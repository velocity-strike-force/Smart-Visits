import { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { VisitHandler } from "../../src/handlers/VisitHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

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

function makeVisit(visitId = "visit-001") {
    return {
        visitId,
        productLine: "NetSuite",
        location: "Jacksonville",
        city: "Jacksonville",
        state: "FL",
        salesRepId: "rep-001",
        salesRepName: "Jane",
        domain: "ERP",
        customerId: "cust-001",
        customerName: "Acme",
        customerARR: 120000,
        customerImplementationStatus: "Live",
        isKeyAccount: true,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        capacity: 5,
        invitees: [],
        customerContactRep: "Alex",
        purposeForVisit: "QBR",
        visitDetails: "Details",
        isDraft: false,
        isPrivate: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

describe("VisitHandler", () => {
    beforeEach(() => {
        ddbMock.reset();
    });

    it("GET /api/visit returns a list of visits", async () => {
        ddbMock.on(ScanCommand).resolves({ Items: [makeVisit()] });
        const handler = new VisitHandler();
        const event = makeEvent("GET");
        const result = await handler.handleVisitEndpoint(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.visits).toHaveLength(1);
    });

    it("GET /api/visit?visitId=visit-001 returns a single visit", async () => {
        ddbMock.on(GetCommand).resolves({ Item: makeVisit("visit-001") });
        const handler = new VisitHandler();
        const event = makeEvent("GET", { visitId: "visit-001" });
        const result = await handler.handleVisitEndpoint(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.visit.visitId).toBe("visit-001");
    });

    it("POST /api/visit creates a visit and returns an id", async () => {
        ddbMock.on(PutCommand).resolves({});
        const handler = new VisitHandler();
        const event = makeEvent(
            "POST",
            undefined,
            JSON.stringify({
                visitId: "visit-123",
                productLine: "NetSuite",
                location: "Jacksonville",
                salesRepId: "rep-001",
            })
        );
        const result = await handler.handleVisitEndpoint(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.visitId).toBe("visit-123");
    });

    it("DELETE /api/visit without visitId returns 400", async () => {
        const handler = new VisitHandler();
        const event = makeEvent("DELETE");
        const result = await handler.handleVisitEndpoint(event);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(false);
    });

    it("DELETE /api/visit removes an existing visit", async () => {
        ddbMock.on(GetCommand).resolves({ Item: makeVisit("visit-xyz") });
        ddbMock.on(DeleteCommand).resolves({});
        ddbMock.on(PutCommand).resolves({});
        const handler = new VisitHandler();
        const event = makeEvent("DELETE", { visitId: "visit-xyz" });
        const result = await handler.handleVisitEndpoint(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
    });

    it("PATCH /api/visit returns 405 method not allowed", async () => {
        const handler = new VisitHandler();
        const event = makeEvent("PATCH");
        const result = await handler.handleVisitEndpoint(event);

        expect(result.statusCode).toBe(405);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(false);
    });
});
