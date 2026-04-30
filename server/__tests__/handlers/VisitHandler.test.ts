import { APIGatewayProxyEventV2 } from "aws-lambda";
import { VisitHandler } from "../../src/handlers/VisitHandler";
import { Dynamo } from "../../src/database/Dynamo";
import { Visit, type VisitData } from "../../src/database/schema/Visit";

jest.mock("../../src/services/AuditLoggerService", () => ({
    __esModule: true,
    default: {
        log: jest.fn(),
        flush: jest.fn().mockResolvedValue(undefined),
    },
}));

function sampleVisitData(overrides: Partial<VisitData> = {}): VisitData {
    return {
        visitId: "visit-001",
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        city: "Jacksonville",
        state: "FL",
        salesRepId: "rep-001",
        salesRepName: "Jane Smith",
        domain: "ERP",
        customerId: "cust-001",
        customerName: "Acme Corp",
        customerARR: 250000,
        customerImplementationStatus: "Live",
        isKeyAccount: true,
        startDate: "2026-05-15",
        endDate: "2026-05-16",
        capacity: 5,
        invitees: ["user-002"],
        customerContactRep: "John Doe",
        purposeForVisit: "Quarterly Business Review",
        visitDetails: "Meet in lobby.",
        isDraft: false,
        isPrivate: false,
        createdAt: "2026-04-01T10:00:00Z",
        updatedAt: "2026-04-01T10:00:00Z",
        ...overrides,
    };
}

function makeEvent(
    method: string,
    queryStringParameters?: Record<string, string>,
    body?: string
): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/visit`,
        rawPath: "/api/visit",
        rawQueryString: "",
        headers: {},
        queryStringParameters: queryStringParameters ?? undefined,
        requestContext: {
            http: {
                method,
                path: "/api/visit",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/visit`,
            stage: "$default",
            time: "27/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: body ?? undefined,
        isBase64Encoded: false,
    };
}

describe("VisitHandler", () => {
    const previousRedirectUri = process.env.OUTLOOK_OAUTH_REDIRECT_URI;
    let mockDb: Dynamo;
    let notificationService: {
        notifyVisitCreated: jest.Mock<Promise<void>, [VisitData]>;
    };
    let calendarService: {
        createOrUpdateVisitEventForUser: jest.Mock;
        deleteAllVisitEvents: jest.Mock;
        syncVisitEventsForVisit: jest.Mock;
    };
    let handler: VisitHandler;

    beforeEach(() => {
        process.env.OUTLOOK_OAUTH_REDIRECT_URI =
            "http://127.0.0.1:3000/api/outlook-integration";
        const primaryVisit = new Visit(sampleVisitData());
        const draftVisit = new Visit(
            sampleVisitData({
                visitId: "visit-002",
                isDraft: true,
                customerName: "Globex Industries",
            })
        );

        mockDb = {
            getAllVisits: jest.fn().mockResolvedValue([primaryVisit, draftVisit]),
            getVisitById: jest.fn().mockImplementation(async (id: string) => {
                if (id === "visit-001") return primaryVisit;
                if (id === "visit-002") return draftVisit;
                if (id === "visit-xyz") {
                    return new Visit(
                        sampleVisitData({
                            visitId: "visit-xyz",
                            salesRepId: "rep-xyz",
                        })
                    );
                }
                if (id === "visit-updated") {
                    return new Visit(
                        sampleVisitData({
                            visitId: "visit-updated",
                            capacity: 10,
                            visitDetails: "Updated purpose",
                        })
                    );
                }
                return undefined;
            }),
            createVisit: jest.fn().mockResolvedValue(undefined),
            updateVisit: jest.fn().mockResolvedValue(undefined),
            deleteVisit: jest.fn().mockResolvedValue(undefined),
        } as unknown as Dynamo;

        notificationService = {
            notifyVisitCreated: jest.fn().mockResolvedValue(undefined),
        };
        calendarService = {
            createOrUpdateVisitEventForUser: jest.fn().mockResolvedValue(undefined),
            deleteAllVisitEvents: jest.fn().mockResolvedValue(undefined),
            syncVisitEventsForVisit: jest.fn().mockResolvedValue(undefined),
        };

        handler = new VisitHandler({
            db: mockDb,
            notificationService: notificationService as any,
            calendarService: calendarService as any,
        });
    });

    afterAll(() => {
        process.env.OUTLOOK_OAUTH_REDIRECT_URI = previousRedirectUri;
    });

    it("GET /api/visit returns a list of visits", async () => {
        const result = await handler.handleVisitEndpoint(makeEvent("GET"));
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.visits).toHaveLength(2);
        expect(mockDb.getAllVisits).toHaveBeenCalledTimes(1);
    });

    it("GET /api/visit?visitId=visit-001 returns a single visit", async () => {
        const result = await handler.handleVisitEndpoint(
            makeEvent("GET", { visitId: "visit-001" })
        );
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.visit.visitId).toBe("visit-001");
        expect(mockDb.getVisitById).toHaveBeenCalledWith("visit-001");
    });

    it("GET /api/visit?visitId=visit-404 returns 404 when not found", async () => {
        const result = await handler.handleVisitEndpoint(
            makeEvent("GET", { visitId: "visit-404" })
        );
        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).success).toBe(false);
    });

    it("POST /api/visit creates a visit and dispatches notifications", async () => {
        const result = await handler.handleVisitEndpoint(
            makeEvent(
                "POST",
                undefined,
                JSON.stringify({
                    visitId: "visit-123",
                    productLine: "NetSuite",
                    location: "Jacksonville",
                    salesRepId: "rep-001",
                })
            )
        );

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).success).toBe(true);
        expect(mockDb.createVisit).toHaveBeenCalledTimes(1);
        expect(notificationService.notifyVisitCreated).toHaveBeenCalledTimes(1);
    });

    it("PUT /api/visit syncs linked Outlook calendar events for updated visit", async () => {
        const result = await handler.handleVisitEndpoint(
            makeEvent(
                "PUT",
                undefined,
                JSON.stringify({
                    visitId: "visit-updated",
                    capacity: 10,
                    purposeForVisit: "Updated purpose",
                })
            )
        );

        expect(result.statusCode).toBe(200);
        expect(mockDb.updateVisit).toHaveBeenCalledWith(
            "visit-updated",
            expect.objectContaining({
                capacity: 10,
            })
        );
        expect(calendarService.syncVisitEventsForVisit).toHaveBeenCalledTimes(1);
        expect(calendarService.syncVisitEventsForVisit).toHaveBeenCalledWith(
            expect.objectContaining({ visitId: "visit-updated" }),
            "rep-001"
        );
    });

    it("PUT /api/visit without visitId returns 400", async () => {
        const result = await handler.handleVisitEndpoint(
            makeEvent(
                "PUT",
                undefined,
                JSON.stringify({
                    purposeForVisit: "Missing id update",
                })
            )
        );
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).success).toBe(false);
    });

    it("DELETE /api/visit without visitId returns 400", async () => {
        const result = await handler.handleVisitEndpoint(makeEvent("DELETE"));
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).success).toBe(false);
    });

    it("DELETE /api/visit removes an existing visit", async () => {
        const result = await handler.handleVisitEndpoint(
            makeEvent("DELETE", { visitId: "visit-xyz" })
        );
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).success).toBe(true);
        expect(mockDb.deleteVisit).toHaveBeenCalledWith("visit-xyz");
        expect(calendarService.deleteAllVisitEvents).toHaveBeenCalledWith(
            "visit-xyz"
        );
    });

    it("PATCH /api/visit returns 405 method not allowed", async () => {
        const result = await handler.handleVisitEndpoint(makeEvent("PATCH"));
        expect(result.statusCode).toBe(405);
        expect(JSON.parse(result.body).success).toBe(false);
    });
});
