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

    describe("POST /api/outlook-integration (startConnect)", () => {
        it("returns auth URL for valid user", async () => {
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

        it("returns 400 when userId is missing from body", async () => {
            const handler = new OutlookIntegrationHandler({
                db: {} as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("POST", undefined, JSON.stringify({}))
            );

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.success).toBe(false);
            expect(body.code).toBe("INVALID_REQUEST");
        });

        it("returns 404 when user profile does not exist", async () => {
            const db = {
                getUserById: jest.fn().mockResolvedValue(undefined),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("POST", undefined, JSON.stringify({ userId: "ghost-user" }))
            );

            expect(result.statusCode).toBe(404);
            const body = JSON.parse(result.body);
            expect(body.code).toBe("USER_NOT_FOUND");
        });

        it("persists OAuth state nonce for CSRF verification", async () => {
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

            await handler.handleOutlookIntegrationEndpoint(
                makeEvent("POST", undefined, JSON.stringify({ userId: "user-001" }))
            );

            const savedIntegration = db.putOutlookIntegration.mock.calls[0][0];
            expect(savedIntegration.oauthState).toBeTruthy();
            expect(savedIntegration.oauthStateExpiresAt).toBeTruthy();
            const expiry = Date.parse(savedIntegration.oauthStateExpiresAt);
            expect(expiry).toBeGreaterThan(Date.now());
        });
    });

    describe("GET /api/outlook-integration (status check)", () => {
        it("returns connected status when integration exists with refresh token", async () => {
            const db = {
                getOutlookIntegrationByUserId: jest.fn().mockResolvedValue({
                    userId: "user-001",
                    refreshToken: "valid-refresh-token",
                    outlookUserEmail: "user@outlook.com",
                    connectedAt: new Date("2026-04-01T00:00:00Z"),
                }),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", { userId: "user-001" })
            );

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.connected).toBe(true);
            expect(body.outlookUserEmail).toBe("user@outlook.com");
        });

        it("returns connected=false when no integration found", async () => {
            const db = {
                getOutlookIntegrationByUserId: jest.fn().mockResolvedValue(undefined),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", { userId: "user-new" })
            );

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.connected).toBe(false);
        });

        it("returns 400 when userId query param is missing", async () => {
            const handler = new OutlookIntegrationHandler({
                db: {} as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", {})
            );

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.code).toBe("INVALID_REQUEST");
        });
    });

    describe("GET /api/outlook-integration (OAuth callback)", () => {
        it("redirects to frontend callback route on success", async () => {
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
                    accessTokenExpiresAt: new Date(
                        Date.now() + 3600 * 1000
                    ).toISOString(),
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

        it("redirects with error when state is malformed base64url", async () => {
            const handler = new OutlookIntegrationHandler({
                db: {} as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", { code: "auth-code", state: "!not!valid!json!" })
            );

            expect(result.statusCode).toBe(302);
            expect(result.headers?.Location).toContain("status=error");
            expect(result.headers?.Location).toContain("Invalid+OAuth+state");
        });

        it("redirects with error when nonce does not match stored state", async () => {
            const state = Buffer.from(
                JSON.stringify({
                    userId: "user-001",
                    nonce: "wrong-nonce",
                    issuedAt: Date.now(),
                })
            ).toString("base64url");

            const db = {
                getOutlookIntegrationByUserId: jest.fn().mockResolvedValue({
                    userId: "user-001",
                    oauthState: "correct-nonce",
                    oauthStateExpiresAt: new Date(Date.now() + 60000).toISOString(),
                    connectedAt: new Date("2026-04-01T10:00:00.000Z"),
                }),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", { code: "auth-code", state })
            );

            expect(result.statusCode).toBe(302);
            expect(result.headers?.Location).toContain("status=error");
            expect(result.headers?.Location).toContain("state+mismatch");
        });

        it("redirects with error when OAuth state has expired", async () => {
            const nonce = "expired-nonce";
            const state = Buffer.from(
                JSON.stringify({
                    userId: "user-001",
                    nonce,
                    issuedAt: Date.now() - 700_000,
                })
            ).toString("base64url");

            const db = {
                getOutlookIntegrationByUserId: jest.fn().mockResolvedValue({
                    userId: "user-001",
                    oauthState: nonce,
                    oauthStateExpiresAt: new Date(Date.now() - 60000).toISOString(),
                    connectedAt: new Date("2026-04-01T10:00:00.000Z"),
                }),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", { code: "auth-code", state })
            );

            expect(result.statusCode).toBe(302);
            expect(result.headers?.Location).toContain("status=error");
            expect(result.headers?.Location).toContain("expired");
        });

        it("redirects with error when no pending integration exists", async () => {
            const state = Buffer.from(
                JSON.stringify({
                    userId: "user-ghost",
                    nonce: "nonce",
                    issuedAt: Date.now(),
                })
            ).toString("base64url");

            const db = {
                getOutlookIntegrationByUserId: jest.fn().mockResolvedValue(undefined),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", { code: "auth-code", state })
            );

            expect(result.statusCode).toBe(302);
            expect(result.headers?.Location).toContain("status=error");
            expect(result.headers?.Location).toContain("No+pending");
        });

        it("redirects with error when token exchange throws", async () => {
            const nonce = "nonce-ok";
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
            };
            const oauthService = {
                exchangeAuthorizationCode: jest
                    .fn()
                    .mockRejectedValue(new Error("Code already redeemed")),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: oauthService as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("GET", { code: "used-code", state })
            );

            expect(result.statusCode).toBe(302);
            expect(result.headers?.Location).toContain("status=error");
            expect(result.headers?.Location).toContain("already+redeemed");
        });
    });

    describe("DELETE /api/outlook-integration (disconnect)", () => {
        it("removes integration and cleans up all calendar event links", async () => {
            const calendarService = {
                deleteVisitEventForUser: jest.fn().mockResolvedValue(undefined),
            };
            const db = {
                getCalendarEventLinksForUser: jest.fn().mockResolvedValue([
                    { visitId: "visit-001", userId: "user-001", eventId: "ev-1" },
                    { visitId: "visit-002", userId: "user-001", eventId: "ev-2" },
                ]),
                deleteOutlookIntegration: jest.fn().mockResolvedValue(undefined),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: calendarService as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("DELETE", { userId: "user-001" })
            );

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.success).toBe(true);
            expect(body.message).toContain("disconnected");

            expect(calendarService.deleteVisitEventForUser).toHaveBeenCalledTimes(2);
            expect(calendarService.deleteVisitEventForUser).toHaveBeenCalledWith(
                "visit-001",
                "user-001"
            );
            expect(db.deleteOutlookIntegration).toHaveBeenCalledWith("user-001");
        });

        it("returns 400 when userId is missing", async () => {
            const handler = new OutlookIntegrationHandler({
                db: {} as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("DELETE", {})
            );

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.code).toBe("INVALID_REQUEST");
        });

        it("succeeds even when user has no calendar links (idempotent)", async () => {
            const db = {
                getCalendarEventLinksForUser: jest.fn().mockResolvedValue([]),
                deleteOutlookIntegration: jest.fn().mockResolvedValue(undefined),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: {} as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("DELETE", { userId: "user-no-links" })
            );

            expect(result.statusCode).toBe(200);
            expect(db.deleteOutlookIntegration).toHaveBeenCalledWith("user-no-links");
        });

        it("continues disconnect even if individual event deletion fails", async () => {
            const calendarService = {
                deleteVisitEventForUser: jest
                    .fn()
                    .mockRejectedValueOnce(new Error("Graph 500"))
                    .mockResolvedValueOnce(undefined),
            };
            const db = {
                getCalendarEventLinksForUser: jest.fn().mockResolvedValue([
                    { visitId: "visit-001", userId: "user-001", eventId: "ev-1" },
                    { visitId: "visit-002", userId: "user-001", eventId: "ev-2" },
                ]),
                deleteOutlookIntegration: jest.fn().mockResolvedValue(undefined),
            };

            const handler = new OutlookIntegrationHandler({
                db: db as any,
                oauthService: {} as any,
                calendarService: calendarService as any,
            });

            const result = await handler.handleOutlookIntegrationEndpoint(
                makeEvent("DELETE", { userId: "user-001" })
            );

            expect(result.statusCode).toBe(200);
            expect(db.deleteOutlookIntegration).toHaveBeenCalled();
        });
    });
});
