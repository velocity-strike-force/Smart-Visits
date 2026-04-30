import { Dynamo } from "../database/Dynamo";
import {
    OutlookIntegration,
    OutlookIntegrationData,
} from "../database/schema/OutlookIntegration";
import outlookOAuthService, {
    OutlookOAuthService,
} from "./OutlookOAuthService";
import { fetchWithRetry } from "./httpRetry";

export interface CalendarVisitInput {
    visitId: string;
    customerName: string;
    productLine: string;
    location: string;
    visitDetails: string;
    startDate: string | Date;
    endDate: string | Date;
}

interface GraphEventResponse {
    id?: string;
    webLink?: string;
}

export class OutlookCalendarService {
    private readonly db: Dynamo;
    private readonly oauthService: OutlookOAuthService;
    private readonly calendarTimeZone: string;

    constructor(options?: { db?: Dynamo; oauthService?: OutlookOAuthService }) {
        this.db = options?.db ?? new Dynamo({});
        this.oauthService = options?.oauthService ?? outlookOAuthService;
        this.calendarTimeZone = process.env.OUTLOOK_CALENDAR_TIMEZONE || "UTC";
    }

    async createOrUpdateVisitEventForUser(
        userId: string,
        visit: CalendarVisitInput
    ): Promise<void> {
        const integration = await this.db.getOutlookIntegrationByUserId(userId);
        if (!integration || !integration.refreshToken) {
            console.info("Skipping Outlook calendar sync because user is not connected", {
                userId,
                visitId: visit.visitId,
            });
            return;
        }

        const refreshedIntegration = await this.oauthService.ensureValidAccessToken(
            this.toData(integration)
        );
        const existingLink = await this.db.getCalendarEventLink(visit.visitId, userId);
        const payload = this.buildEventPayload(visit);

        let event: GraphEventResponse | undefined;

        if (existingLink) {
            event = await this.updateEvent(
                refreshedIntegration.accessToken,
                existingLink.eventId,
                payload
            );
        }

        if (!event?.id) {
            event = await this.createEvent(refreshedIntegration.accessToken, payload);
        }

        if (!event.id) {
            throw new Error("Calendar API response missing event id");
        }

        const now = new Date().toISOString();
        await this.db.putCalendarEventLink({
            visitId: visit.visitId,
            userId,
            eventId: event.id,
            webLink: event.webLink ?? existingLink?.webLink ?? "",
            createdAt: existingLink?.createdAt.toISOString() ?? now,
            updatedAt: now,
        });
        await this.db.putOutlookIntegration({
            ...refreshedIntegration,
            updatedAt: now,
        });
        console.info("Synced Outlook calendar event for user", {
            visitId: visit.visitId,
            userId,
            eventId: event.id,
        });
    }

    async deleteVisitEventForUser(visitId: string, userId: string): Promise<void> {
        const existingLink = await this.db.getCalendarEventLink(visitId, userId);
        if (!existingLink) {
            return;
        }

        const integration = await this.db.getOutlookIntegrationByUserId(userId);
        if (integration && integration.refreshToken) {
            const refreshedIntegration =
                await this.oauthService.ensureValidAccessToken(this.toData(integration));
            await this.deleteEvent(
                refreshedIntegration.accessToken,
                existingLink.eventId
            );
            await this.db.putOutlookIntegration({
                ...refreshedIntegration,
                updatedAt: new Date().toISOString(),
            });
        }

        await this.db.deleteCalendarEventLink(visitId, userId);
    }

    async deleteAllVisitEvents(visitId: string): Promise<void> {
        const links = await this.db.getCalendarEventLinksForVisit(visitId);
        for (const link of links) {
            try {
                await this.deleteVisitEventForUser(link.visitId, link.userId);
            } catch (error) {
                console.error("Failed to delete calendar event link", {
                    visitId: link.visitId,
                    userId: link.userId,
                    eventId: link.eventId,
                    error,
                });
            }
        }
    }

    async syncVisitEventsForVisit(
        visit: CalendarVisitInput,
        ownerUserId?: string
    ): Promise<void> {
        const links = await this.db.getCalendarEventLinksForVisit(visit.visitId);
        const targetUsers = new Set<string>();
        if (ownerUserId) {
            targetUsers.add(ownerUserId);
        }
        for (const link of links) {
            targetUsers.add(link.userId);
        }

        for (const userId of targetUsers) {
            try {
                await this.createOrUpdateVisitEventForUser(userId, visit);
            } catch (error) {
                console.error("Failed syncing updated visit to Outlook calendar", {
                    userId,
                    visitId: visit.visitId,
                    error,
                });
            }
        }
    }

    private buildEventPayload(visit: CalendarVisitInput) {
        const start = this.toGraphDateTime(visit.startDate, 14);
        const end = this.toGraphDateTime(visit.endDate, 18);
        return {
            subject: `${visit.customerName} visit (${visit.productLine})`,
            body: {
                contentType: "HTML",
                content: this.buildEventBody(visit),
            },
            start,
            end,
            location: {
                displayName: visit.location,
            },
            isReminderOn: true,
            reminderMinutesBeforeStart: 30,
        };
    }

    private buildEventBody(visit: CalendarVisitInput): string {
        const details =
            visit.visitDetails?.trim().length > 0 ? visit.visitDetails : "N/A";
        return `
            <p><strong>Customer:</strong> ${visit.customerName}</p>
            <p><strong>Product Line:</strong> ${visit.productLine}</p>
            <p><strong>Location:</strong> ${visit.location}</p>
            <p><strong>Details:</strong> ${details}</p>
        `;
    }

    private toGraphDateTime(value: string | Date, fallbackHourUtc: number) {
        const date = this.toDate(value, fallbackHourUtc);
        return {
            dateTime: date.toISOString().replace(/\.\d{3}Z$/, ""),
            timeZone: this.calendarTimeZone,
        };
    }

    private toDate(value: string | Date, fallbackHourUtc: number): Date {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return value;
        }

        if (typeof value === "string") {
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const normalized = `${value}T${String(fallbackHourUtc).padStart(
                    2,
                    "0"
                )}:00:00Z`;
                return new Date(normalized);
            }
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        return new Date();
    }

    private async createEvent(
        accessToken: string,
        payload: Record<string, unknown>
    ): Promise<GraphEventResponse> {
        const response = await fetchWithRetry(
            () =>
                fetch("https://graph.microsoft.com/v1.0/me/events", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }),
            "outlook-calendar:create-event"
        );
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Graph calendar create failed", {
                status: response.status,
                errorBody,
            });
            throw new Error(
                `Graph calendar create failed (${response.status}): ${errorBody}`
            );
        }
        return (await response.json()) as GraphEventResponse;
    }

    private async updateEvent(
        accessToken: string,
        eventId: string,
        payload: Record<string, unknown>
    ): Promise<GraphEventResponse | undefined> {
        const endpoint = `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`;
        const patchResponse = await fetchWithRetry(
            () =>
                fetch(endpoint, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }),
            "outlook-calendar:update-event"
        );

        if (patchResponse.ok) {
            // PATCH often returns 200/204 with partial/no body.
            if (patchResponse.status === 204) {
                return { id: eventId };
            }
            const payload = (await patchResponse.json()) as GraphEventResponse;
            return {
                id: payload.id || eventId,
                webLink: payload.webLink,
            };
        }

        if (patchResponse.status === 404) {
            return undefined;
        }

        const errorBody = await patchResponse.text();
        console.error("Graph calendar update failed", {
            status: patchResponse.status,
            eventId,
            errorBody,
        });
        throw new Error(
            `Graph calendar update failed (${patchResponse.status}): ${errorBody}`
        );
    }

    private async deleteEvent(accessToken: string, eventId: string): Promise<void> {
        const endpoint = `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(eventId)}`;
        const response = await fetchWithRetry(
            () =>
                fetch(endpoint, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            "outlook-calendar:delete-event"
        );

        if (response.ok || response.status === 404) {
            return;
        }

        const errorBody = await response.text();
        console.error("Graph calendar delete failed", {
            status: response.status,
            eventId,
            errorBody,
        });
        throw new Error(
            `Graph calendar delete failed (${response.status}): ${errorBody}`
        );
    }

    private toData(integration: OutlookIntegration): OutlookIntegrationData {
        return {
            userId: integration.userId,
            connectedAt: integration.connectedAt.toISOString(),
            updatedAt: integration.updatedAt.toISOString(),
            refreshToken: integration.refreshToken,
            accessToken: integration.accessToken,
            accessTokenExpiresAt: integration.accessTokenExpiresAt,
            outlookUserEmail: integration.outlookUserEmail,
            oauthState: integration.oauthState,
            oauthStateExpiresAt: integration.oauthStateExpiresAt,
        };
    }
}

export default new OutlookCalendarService();
