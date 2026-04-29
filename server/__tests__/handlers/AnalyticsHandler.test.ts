import { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { AnalyticsHandler } from "../../src/handlers/AnalyticsHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

function makeEvent(
    method: string,
    queryStringParameters?: Record<string, string>
): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/analytics`,
        rawPath: "/api/analytics",
        rawQueryString: "",
        headers: {},
        queryStringParameters: queryStringParameters ?? undefined,
        requestContext: {
            http: {
                method,
                path: "/api/analytics",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/analytics`,
            stage: "$default",
            time: "27/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: undefined,
        isBase64Encoded: false,
    };
}

function makeVisit(
    visitId: string,
    customerName: string,
    salesRepName: string,
    startDate = new Date().toISOString()
) {
    return {
        visitId,
        productLine: "NetSuite",
        location: "Jacksonville",
        city: "Jacksonville",
        state: "FL",
        salesRepId: "rep-001",
        salesRepName,
        domain: "ERP",
        customerId: `cust-${visitId}`,
        customerName,
        customerARR: 120000,
        customerImplementationStatus: "Live",
        isKeyAccount: true,
        startDate,
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

describe("AnalyticsHandler", () => {
    beforeEach(() => {
        ddbMock.reset();
    });

    it("GET /api/analytics returns aggregated analytics", async () => {
        ddbMock.on(ScanCommand).resolves({
            Items: [
                makeVisit("001", "Acme", "Jane"),
                makeVisit("002", "Acme", "Jane"),
                makeVisit("003", "Globex", "Chris"),
            ],
        });

        const handler = new AnalyticsHandler();
        const result = await handler.handleAnalyticsEndpoint(makeEvent("GET"));
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.totalVisits).toBe(3);
        expect(body.data.topCustomersByVisitCount[0].customerName).toBe("Acme");
    });

    it("GET /api/analytics returns empty aggregates when there are no visits", async () => {
        ddbMock.on(ScanCommand).resolves({ Items: [] });

        const handler = new AnalyticsHandler();
        const result = await handler.handleAnalyticsEndpoint(makeEvent("GET"));
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.totalVisits).toBe(0);
        expect(body.data.totalVisitsThisQuarter).toBe(0);
        expect(body.data.topCustomersByVisitCount).toHaveLength(0);
        expect(body.data.topSalesRepsByVisitCount).toHaveLength(0);
        expect(body.data.leastVisitedCustomers).toHaveLength(0);
    });

    it("GET /api/analytics counts only current-quarter visits", async () => {
        const now = new Date();
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        const inQuarterDate = new Date(
            Date.UTC(now.getUTCFullYear(), quarterStartMonth, 2, 12, 0, 0, 0)
        ).toISOString();
        const previousQuarterDate = new Date(
            Date.UTC(now.getUTCFullYear(), quarterStartMonth - 1, 28, 12, 0, 0, 0)
        ).toISOString();

        ddbMock.on(ScanCommand).resolves({
            Items: [
                makeVisit("in-quarter", "Acme", "Jane", inQuarterDate),
                makeVisit("prev-quarter", "Globex", "Chris", previousQuarterDate),
            ],
        });

        const handler = new AnalyticsHandler();
        const result = await handler.handleAnalyticsEndpoint(makeEvent("GET"));
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.totalVisits).toBe(2);
        expect(body.data.totalVisitsThisQuarter).toBe(1);
    });

    it("POST /api/analytics returns 405 method not allowed", async () => {
        const handler = new AnalyticsHandler();
        const result = await handler.handleAnalyticsEndpoint(makeEvent("POST"));
        expect(result.statusCode).toBe(405);
    });
});
