import { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { SignupHandler } from "../../src/handlers/SignupHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

function makeEvent(
    method: string,
    queryStringParameters?: Record<string, string>,
    body?: string
): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/signup`,
        rawPath: "/api/signup",
        rawQueryString: "",
        headers: {},
        queryStringParameters: queryStringParameters ?? undefined,
        requestContext: {
            http: {
                method,
                path: "/api/signup",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/signup`,
            stage: "$default",
            time: "27/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: body ?? undefined,
        isBase64Encoded: false,
    };
}

function makeVisit() {
    return {
        visitId: "visit-001",
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
        capacity: 2,
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

describe("SignupHandler", () => {
    beforeEach(() => {
        ddbMock.reset();
    });

    it("GET /api/signup without visitId returns 400", async () => {
        const handler = new SignupHandler();
        const result = await handler.handleSignupEndpoint(makeEvent("GET"));
        expect(result.statusCode).toBe(400);
    });

    it("GET /api/signup returns signups and capacityRemaining", async () => {
        ddbMock.on(QueryCommand).resolves({
            Items: [
                {
                    visitId: "visit-001",
                    userId: "user-001",
                    userName: "Sam",
                    userEmail: "sam@example.com",
                    signedUpAt: new Date().toISOString(),
                },
            ],
        });
        ddbMock.on(GetCommand).resolves({ Item: makeVisit() });

        const handler = new SignupHandler();
        const result = await handler.handleSignupEndpoint(
            makeEvent("GET", { visitId: "visit-001" })
        );
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.signups).toHaveLength(1);
        expect(body.capacityRemaining).toBe(1);
    });

    it("POST /api/signup creates a signup", async () => {
        ddbMock.on(GetCommand).resolves({ Item: makeVisit() });
        ddbMock.on(QueryCommand).resolves({ Items: [] });
        ddbMock.on(PutCommand).resolves({});

        const handler = new SignupHandler();
        const result = await handler.handleSignupEndpoint(
            makeEvent(
                "POST",
                undefined,
                JSON.stringify({
                    visitId: "visit-001",
                    userId: "user-001",
                    userName: "Sam",
                    userEmail: "sam@example.com",
                })
            )
        );
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
    });

    it("DELETE /api/signup cancels an existing signup", async () => {
        ddbMock.on(QueryCommand).resolves({
            Items: [
                {
                    visitId: "visit-001",
                    userId: "user-001",
                    userName: "Sam",
                    userEmail: "sam@example.com",
                    signedUpAt: new Date().toISOString(),
                },
            ],
        });
        ddbMock.on(DeleteCommand).resolves({});
        ddbMock.on(PutCommand).resolves({});

        const handler = new SignupHandler();
        const result = await handler.handleSignupEndpoint(
            makeEvent("DELETE", { visitId: "visit-001", userId: "user-001" })
        );

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).success).toBe(true);
    });
});
