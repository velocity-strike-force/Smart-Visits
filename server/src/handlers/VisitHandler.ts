import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import { Visit, type VisitData } from "../database/schema/Visit";
import auditLogger from "../services/AuditLoggerService";
import { AuditLogData } from "../database/schema/AuditLog";
import defaultNotificationService, {
    NotificationService,
} from "../services/NotificationService";
import defaultCalendarService, {
    OutlookCalendarService,
} from "../services/OutlookCalendarService";

export class VisitHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;
    private readonly notificationService: NotificationService;
    private readonly calendarService: OutlookCalendarService;

    /** Pass `{ db }` in tests; Lambda uses `new Dynamo()` via default `visit.js`. */
    constructor(options?: {
        db?: Dynamo;
        notificationService?: NotificationService;
        calendarService?: OutlookCalendarService;
    }) {
        super();
        this.db = options?.db ?? new Dynamo({});
        this.notificationService =
            options?.notificationService ?? defaultNotificationService;
        this.calendarService = options?.calendarService ?? defaultCalendarService;
    }

    private async logAudit(
        entry: Omit<AuditLogData, "timestamp">
    ): Promise<void> {
        try {
            auditLogger.log(entry);
            await auditLogger.flush();
        } catch (error) {
            console.error("Failed to flush audit log entry", error);
        }
    }

    private dispatchVisitCreatedNotification(visit: VisitData): void {
        if (visit.isDraft) {
            return;
        }

        this.notificationService.notifyVisitCreated(visit).catch((error) => {
            console.error("Failed to dispatch visit created notifications", {
                visitId: visit.visitId,
                error,
            });
        });
    }

    private dispatchVisitCalendarCreate(visit: VisitData): void {
        if (
            visit.isDraft ||
            !visit.salesRepId ||
            !process.env.OUTLOOK_OAUTH_REDIRECT_URI
        ) {
            return;
        }

        this.calendarService
            .createOrUpdateVisitEventForUser(visit.salesRepId, {
                visitId: visit.visitId,
                customerName: visit.customerName,
                productLine: visit.productLine,
                location: visit.location,
                visitDetails: visit.visitDetails,
                startDate: visit.startDate,
                endDate: visit.endDate,
            })
            .catch((error) => {
                console.error("Failed to create Outlook calendar event for visit", {
                    visitId: visit.visitId,
                    userId: visit.salesRepId,
                    error,
                });
            });
    }

    private dispatchVisitCalendarCleanup(visitId: string): void {
        if (!process.env.OUTLOOK_OAUTH_REDIRECT_URI) {
            return;
        }
        this.calendarService.deleteAllVisitEvents(visitId).catch((error) => {
            console.error("Failed cleaning calendar links for deleted visit", {
                visitId,
                error,
            });
        });
    }

    private dispatchVisitCalendarUpdate(visit: Visit): void {
        if (!process.env.OUTLOOK_OAUTH_REDIRECT_URI) {
            return;
        }

        if (visit.isDraft) {
            this.dispatchVisitCalendarCleanup(visit.visitId);
            return;
        }

        this.calendarService
            .syncVisitEventsForVisit(
                {
                    visitId: visit.visitId,
                    customerName: visit.customerName,
                    productLine: visit.productLine,
                    location: visit.location,
                    visitDetails: visit.visitDetails,
                    startDate: visit.startDate,
                    endDate: visit.endDate,
                },
                visit.salesRepId
            )
            .catch((error) => {
                console.error("Failed to sync Outlook calendar after visit update", {
                    visitId: visit.visitId,
                    error,
                });
            });
    }

    async handleVisitEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getVisits.bind(this),
            POST: this.createVisit.bind(this),
            PUT: this.updateVisit.bind(this),
            DELETE: this.deleteVisit.bind(this),
        });
    }

    private async getVisits(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const params = event.queryStringParameters;
        const visitId = params?.visitId;

        try {
            if (visitId) {
                const visit = await this.db.getVisitById(visitId);
                if (!visit) {
                    return this.createErrorResponse(404, {
                        success: false,
                        message: "Visit not found",
                    });
                }
                return this.createSuccessResponse({
                    success: true,
                    visit: this.visitToFullResponse(visit),
                });
            }

            const visits = await this.db.getAllVisits();
            return this.createSuccessResponse({
                success: true,
                visits: visits.map((v) => this.visitToListResponse(v)),
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to load visits",
            });
        }
    }

    private visitToFullResponse(v: Visit) {
        return {
            visitId: v.visitId,
            productLine: v.productLine,
            location: v.location,
            city: v.city,
            state: v.state,
            salesRepId: v.salesRepId,
            salesRepName: v.salesRepName,
            domain: v.domain,
            customerId: v.customerId,
            customerName: v.customerName,
            customerARR: v.customerARR,
            customerImplementationStatus: v.customerImplementationStatus,
            isKeyAccount: v.isKeyAccount,
            startDate: v.startDate.toISOString().slice(0, 10),
            endDate: v.endDate.toISOString().slice(0, 10),
            capacity: v.capacity,
            invitees: v.invitees,
            customerContactRep: v.customerContactRep,
            purposeForVisit: v.purposeForVisit,
            visitDetails: v.visitDetails,
            isDraft: v.isDraft,
            isPrivate: v.isPrivate,
            createdAt: v.createdAt.toISOString(),
            updatedAt: v.updatedAt.toISOString(),
        };
    }

    private visitToListResponse(v: Visit) {
        return {
            visitId: v.visitId,
            productLine: v.productLine,
            location: v.location,
            salesRepName: v.salesRepName,
            customerName: v.customerName,
            startDate: v.startDate.toISOString().slice(0, 10),
            endDate: v.endDate.toISOString().slice(0, 10),
            capacity: v.capacity,
            isDraft: v.isDraft,
            isKeyAccount: v.isKeyAccount,
        };
    }

    private buildVisitDataForCreate(
        body: Record<string, unknown>,
        visitId: string,
        now: string
    ): VisitData {
        return {
            visitId,
            productLine: String(body.productLine ?? "NetSuite"),
            location: String(body.location ?? ""),
            city: String(body.city ?? ""),
            state: String(body.state ?? ""),
            salesRepId: String(body.salesRepId ?? "rep-001"),
            salesRepName: String(body.salesRepName ?? ""),
            domain: String(body.domain ?? "ERP"),
            customerId: String(body.customerId ?? "cust-001"),
            customerName: String(body.customerName ?? ""),
            customerARR: Number(body.customerARR ?? 0),
            customerImplementationStatus: String(
                body.customerImplementationStatus ?? "Live"
            ),
            isKeyAccount: Boolean(body.isKeyAccount ?? false),
            startDate: String(
                body.startDate ?? new Date().toISOString().slice(0, 10)
            ),
            endDate: String(
                body.endDate ?? new Date().toISOString().slice(0, 10)
            ),
            capacity: Number(body.capacity ?? 1),
            invitees: Array.isArray(body.invitees)
                ? (body.invitees as unknown[]).map(String)
                : [],
            customerContactRep: String(body.customerContactRep ?? ""),
            purposeForVisit: String(body.purposeForVisit ?? ""),
            visitDetails: String(body.visitDetails ?? ""),
            isDraft: Boolean(body.isDraft ?? false),
            isPrivate: Boolean(body.isPrivate ?? false),
            createdAt: now,
            updatedAt: now,
        };
    }

    private pickVisitUpdates(
        body: Record<string, unknown>
    ): Partial<VisitData> {
        const keys: (keyof VisitData)[] = [
            "productLine",
            "location",
            "city",
            "state",
            "salesRepId",
            "salesRepName",
            "domain",
            "customerId",
            "customerName",
            "customerARR",
            "customerImplementationStatus",
            "isKeyAccount",
            "startDate",
            "endDate",
            "capacity",
            "invitees",
            "customerContactRep",
            "purposeForVisit",
            "visitDetails",
            "isDraft",
            "isPrivate",
        ];
        const out: Partial<VisitData> = {};
        for (const key of keys) {
            if (body[key] === undefined) continue;
            if (key === "invitees" && Array.isArray(body.invitees)) {
                out.invitees = (body.invitees as unknown[]).map(String);
                continue;
            }
            if (key === "customerARR" || key === "capacity") {
                (out as Record<string, unknown>)[key] = Number(body[key]);
                continue;
            }
            if (
                key === "isKeyAccount" ||
                key === "isDraft" ||
                key === "isPrivate"
            ) {
                (out as Record<string, unknown>)[key] = Boolean(body[key]);
                continue;
            }
            (out as Record<string, unknown>)[key] = body[key] as
                | string
                | number
                | boolean
                | string[];
        }
        return out;
    }

    private async createVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}") as Record<
            string,
            unknown
        >;

        try {
            const now = new Date().toISOString();
            const visitId =
                typeof body.visitId === "string" && body.visitId.length > 0
                    ? body.visitId
                    : `visit-${Date.now()}`;
            const data = this.buildVisitDataForCreate(body, visitId, now);
            await this.db.createVisit(data);
            await this.logAudit({
                entityId: visitId,
                action: "VISIT_CREATED",
                actorUserId: data.salesRepId,
                metadata: { visitId },
            });
            this.dispatchVisitCreatedNotification(data);
            this.dispatchVisitCalendarCreate(data);
            return this.createSuccessResponse({
                success: true,
                visitId,
                message: "Visit created successfully",
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to create visit",
            });
        }
    }

    private async updateVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}") as Record<
            string,
            unknown
        >;
        const visitId = body.visitId;

        if (!visitId || typeof visitId !== "string") {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId is required in the request body",
            });
        }

        try {
            const { visitId: _id, ...rest } = body;
            const updates = this.pickVisitUpdates(
                rest as Record<string, unknown>
            );
            updates.updatedAt = new Date().toISOString();
            await this.db.updateVisit(visitId, updates);
            const updatedVisit = await this.db.getVisitById(visitId);
            if (updatedVisit) {
                this.dispatchVisitCalendarUpdate(updatedVisit);
            }
            return this.createSuccessResponse({
                success: true,
                visitId,
                message: "Visit updated successfully",
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to update visit",
            });
        }
    }

    private async deleteVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const params = event.queryStringParameters;
            const visitId = params?.visitId;

            if (!visitId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "visitId is required",
                });
            }

            const existingVisit = await this.db.getVisitById(visitId);
            if (!existingVisit) {
                return this.createErrorResponse(404, {
                    success: false,
                    message: "Visit not found",
                });
            }

            await this.db.deleteVisit(visitId);
            await this.logAudit({
                entityId: visitId,
                action: "VISIT_DELETED",
                actorUserId: existingVisit.salesRepId,
                metadata: { visitId },
            });
            this.dispatchVisitCalendarCleanup(visitId);

            return this.createSuccessResponse({
                success: true,
                message: "Visit deleted successfully",
            });
        } catch (error) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }
}
