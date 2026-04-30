import { APIGatewayProxyEventV2 } from "aws-lambda";
import { OutlookIntegrationHandler } from "../../src/handlers/OutlookIntegrationHandler";

function makeEvent(
    method: string,
    queryStringParameters?: Record<string, string>,
    body?: string
): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/outlook-integration`,
        rawPath: "/api/outlook-integration",
        rawQueryString: "",
        headers: {},
        queryStringParameters: queryStringParameters ?? undefined,
        requestContext: {
            http: {
                method,
                path: "/api/outlook-integration",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/outlook-integration`,
            stage: "$default",
            time: "29/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: body ?? undefined,
        isBase64Encoded: false,
    };
}

describe("OutlookIntegrationHandler", () => {
    const previousFrontendBaseUrl = process.env.FRONTEND_BASE_URL;

    beforeEach(() => {
        process.env.FRONTEND_BASE_URL = "http://127.0.0.1:5173";
    });

    afterAll(() => {
        process.env.FRONTEND_BASE_URL = previousFrontendBaseUrl;
    });

    it("POST /api/outlook-integration returns auth URL", async () => {
        const db = {
            getUserById: jest.fn().mockResolvedValue({
                userId: "user-001",
                email: "user@example.com",
            }),
            getOutlookIntegrationByUserId: jest.fn().mockResolvedValue(undefined),
            putOutlookIntegration: jest.fn().mockResolvedValue(undefined),
        };
        const oauthService = {
            buildAuthorizationUrl: jest
                .fn()
                .mockResolvedValue("https://login.example/authorize"),
        };

        const handler = new OutlookIntegrationHandler({
            db: db as any,
            oauthService: oauthService as any,
            calendarService: {} as any,
        });

        const result = await handler.handleOutlookIntegrationEndpoint(
            makeEvent("POST", undefined, JSON.stringify({ userId: "user-001" }))
        );

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.authUrl).toBe("https://login.example/authorize");
    });

    it("GET callback redirects to frontend callback route on success", async () => {
        const nonce = "nonce-123";
        const state = Buffer.from(
            JSON.stringify({
                userId: "user-001",
                nonce,
                issuedAt: Date.now(),
            })
        ).toString("base64url");

        const db = {
            getOutlookIntegrationByUserId: jest.fn().mockResolvedValue({
                userId: "user-001",
                oauthState: nonce,
                oauthStateExpiresAt: new Date(Date.now() + 60000).toISOString(),
                connectedAt: new Date("2026-04-01T10:00:00.000Z"),
            }),
            putOutlookIntegration: jest.fn().mockResolvedValue(undefined),
        };
        const oauthService = {
            exchangeAuthorizationCode: jest.fn().mockResolvedValue({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
            }),
            getProfile: jest.fn().mockResolvedValue({
                displayName: "User One",
                email: "user.one@example.com",
            }),
        };

        const handler = new OutlookIntegrationHandler({
            db: db as any,
            oauthService: oauthService as any,
            calendarService: {} as any,
        });

        const result = await handler.handleOutlookIntegrationEndpoint(
            makeEvent("GET", { code: "auth-code", state })
        );

        expect(result.statusCode).toBe(302);
        expect(result.headers?.Location).toContain("/outlook/callback");
        expect(result.headers?.Location).toContain("status=success");
        expect(result.headers?.Location).toContain("userId=user-001");
    });
});
