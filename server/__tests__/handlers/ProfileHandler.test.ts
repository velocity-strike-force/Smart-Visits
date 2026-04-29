import { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { ProfileHandler } from "../../src/handlers/ProfileHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

function makeEvent(
    method: string,
    queryStringParameters?: Record<string, string>,
    body?: string
): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/profile`,
        rawPath: "/api/profile",
        rawQueryString: "",
        headers: {},
        queryStringParameters: queryStringParameters ?? undefined,
        requestContext: {
            http: {
                method,
                path: "/api/profile",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/profile`,
            stage: "$default",
            time: "27/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: body ?? undefined,
        isBase64Encoded: false,
    };
}

describe("ProfileHandler", () => {
    beforeEach(() => {
        ddbMock.reset();
    });

    it("GET /api/profile without userId returns 400", async () => {
        const handler = new ProfileHandler();
        const result = await handler.handleProfileEndpoint(makeEvent("GET"));
        expect(result.statusCode).toBe(400);
    });

    it("GET /api/profile returns profile when user exists", async () => {
        ddbMock.on(GetCommand).resolves({
            Item: {
                userId: "user-001",
                name: "Sam",
                email: "sam@example.com",
                productLines: ["NetSuite"],
                city: "Jacksonville",
                state: "FL",
                emailNotifications: true,
                slackNotifications: false,
                proximityAlerts: false,
                proximityDistanceMiles: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });

        const handler = new ProfileHandler();
        const result = await handler.handleProfileEndpoint(
            makeEvent("GET", { userId: "user-001" })
        );

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).success).toBe(true);
    });

    it("GET /api/profile returns 404 when user does not exist", async () => {
        ddbMock.on(GetCommand).resolves({});

        const handler = new ProfileHandler();
        const result = await handler.handleProfileEndpoint(
            makeEvent("GET", { userId: "user-missing" })
        );

        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).success).toBe(false);
    });

    it("POST /api/profile upserts profile data", async () => {
        ddbMock.on(GetCommand).resolves({});
        ddbMock.on(PutCommand).resolves({});

        const handler = new ProfileHandler();
        const result = await handler.handleProfileEndpoint(
            makeEvent(
                "POST",
                undefined,
                JSON.stringify({
                    userId: "user-002",
                    name: "Alex",
                    email: "alex@example.com",
                    productLines: ["NetSuite"],
                })
            )
        );

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).success).toBe(true);
    });

    it("POST /api/profile without userId returns 400", async () => {
        const handler = new ProfileHandler();
        const result = await handler.handleProfileEndpoint(
            makeEvent(
                "POST",
                undefined,
                JSON.stringify({
                    name: "No User Id",
                    email: "nouser@example.com",
                })
            )
        );

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).success).toBe(false);
    });
});
