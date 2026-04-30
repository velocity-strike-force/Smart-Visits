import { OutlookCalendarService } from "../../src/services/OutlookCalendarService";

function makeIntegration() {
    return {
        userId: "user-001",
        connectedAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        refreshToken: "refresh-token",
        accessToken: "access-token",
        accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        outlookUserEmail: "user@example.com",
        oauthState: "",
        oauthStateExpiresAt: "",
    };
}

describe("OutlookCalendarService", () => {
    const previousTimeZone = process.env.OUTLOOK_CALENDAR_TIMEZONE;

    beforeEach(() => {
        process.env.OUTLOOK_CALENDAR_TIMEZONE = "UTC";
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(() => {
        process.env.OUTLOOK_CALENDAR_TIMEZONE = previousTimeZone;
    });

    it("creates calendar event and stores event link", async () => {
        const db = {
            getOutlookIntegrationByUserId: jest
                .fn()
                .mockResolvedValue(makeIntegration()),
            getCalendarEventLink: jest.fn().mockResolvedValue(undefined),
            putCalendarEventLink: jest.fn().mockResolvedValue(undefined),
            putOutlookIntegration: jest.fn().mockResolvedValue(undefined),
        };
        const oauthService = {
            ensureValidAccessToken: jest
                .fn()
                .mockImplementation(async (integration) => integration),
        };

        jest.spyOn(global, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: "event-created-001",
                    webLink: "https://outlook.office.com/calendar/item/001",
                }),
                { status: 201 }
            )
        );

        const service = new OutlookCalendarService({
            db: db as any,
            oauthService: oauthService as any,
        });

        await service.createOrUpdateVisitEventForUser("user-001", {
            visitId: "visit-001",
            customerName: "Acme Corp",
            productLine: "NetSuite",
            location: "Jacksonville, FL",
            visitDetails: "Quarterly review",
            startDate: "2026-05-15",
            endDate: "2026-05-16",
        });

        expect(db.putCalendarEventLink).toHaveBeenCalledWith(
            expect.objectContaining({
                visitId: "visit-001",
                userId: "user-001",
                eventId: "event-created-001",
            })
        );
    });

    it("updates existing event link when event already exists", async () => {
        const db = {
            getOutlookIntegrationByUserId: jest
                .fn()
                .mockResolvedValue(makeIntegration()),
            getCalendarEventLink: jest.fn().mockResolvedValue({
                visitId: "visit-001",
                userId: "user-001",
                eventId: "event-existing-001",
                webLink: "https://outlook.office.com/calendar/item/existing",
                createdAt: new Date("2026-04-01T00:00:00.000Z"),
            }),
            putCalendarEventLink: jest.fn().mockResolvedValue(undefined),
            putOutlookIntegration: jest.fn().mockResolvedValue(undefined),
        };
        const oauthService = {
            ensureValidAccessToken: jest
                .fn()
                .mockImplementation(async (integration) => integration),
        };

        jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

        const service = new OutlookCalendarService({
            db: db as any,
            oauthService: oauthService as any,
        });

        await service.createOrUpdateVisitEventForUser("user-001", {
            visitId: "visit-001",
            customerName: "Acme Corp",
            productLine: "NetSuite",
            location: "Jacksonville, FL",
            visitDetails: "Updated details",
            startDate: "2026-05-15",
            endDate: "2026-05-16",
        });

        expect(db.putCalendarEventLink).toHaveBeenCalledWith(
            expect.objectContaining({
                eventId: "event-existing-001",
            })
        );
    });

    it("deletes event and removes event link", async () => {
        const db = {
            getCalendarEventLink: jest.fn().mockResolvedValue({
                visitId: "visit-001",
                userId: "user-001",
                eventId: "event-to-delete",
            }),
            getOutlookIntegrationByUserId: jest
                .fn()
                .mockResolvedValue(makeIntegration()),
            putOutlookIntegration: jest.fn().mockResolvedValue(undefined),
            deleteCalendarEventLink: jest.fn().mockResolvedValue(undefined),
        };
        const oauthService = {
            ensureValidAccessToken: jest
                .fn()
                .mockImplementation(async (integration) => integration),
        };

        jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

        const service = new OutlookCalendarService({
            db: db as any,
            oauthService: oauthService as any,
        });

        await service.deleteVisitEventForUser("visit-001", "user-001");

        expect(db.deleteCalendarEventLink).toHaveBeenCalledWith(
            "visit-001",
            "user-001"
        );
    });
});
