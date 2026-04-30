import { OutlookOAuthService } from "../../src/services/OutlookOAuthService";

const MOCK_CONFIG = {
    tenantId: "tenant-abc-123",
    clientId: "client-id-456",
    clientSecret: "client-secret-789",
    redirectUri: "http://127.0.0.1:3000/api/outlook-integration",
};

function makeMockParameterStore() {
    return {
        init: jest.fn().mockResolvedValue(undefined),
        getRequired: jest.fn((key: string) => {
            const map: Record<string, string> = {
                "outlook/tenant-id": MOCK_CONFIG.tenantId,
                "outlook/client-id": MOCK_CONFIG.clientId,
                "outlook/client-secret": MOCK_CONFIG.clientSecret,
            };
            if (!map[key]) throw new Error(`Missing param: ${key}`);
            return map[key];
        }),
        get: jest.fn(),
    };
}

function makeService(paramStore?: ReturnType<typeof makeMockParameterStore>) {
    const ps = paramStore ?? makeMockParameterStore();
    return new OutlookOAuthService(ps as any);
}

describe("OutlookOAuthService", () => {
    const originalRedirectUri = process.env.OUTLOOK_OAUTH_REDIRECT_URI;

    beforeEach(() => {
        process.env.OUTLOOK_OAUTH_REDIRECT_URI = MOCK_CONFIG.redirectUri;
        jest.restoreAllMocks();
    });

    afterAll(() => {
        process.env.OUTLOOK_OAUTH_REDIRECT_URI = originalRedirectUri;
    });

    describe("buildAuthorizationUrl", () => {
        it("returns a well-formed Microsoft authorization URL with correct params", async () => {
            const service = makeService();
            const state = "base64url-encoded-state";

            const url = await service.buildAuthorizationUrl(state);

            expect(url).toContain(
                `https://login.microsoftonline.com/${MOCK_CONFIG.tenantId}/oauth2/v2.0/authorize`
            );
            expect(url).toContain(`client_id=${MOCK_CONFIG.clientId}`);
            expect(url).toContain("response_type=code");
            expect(url).toContain(
                `redirect_uri=${encodeURIComponent(MOCK_CONFIG.redirectUri)}`
            );
            expect(url).toContain("scope=openid+profile+offline_access+User.Read+Calendars.ReadWrite");
            expect(url).toContain(`state=${state}`);
        });

        it("throws when OUTLOOK_OAUTH_REDIRECT_URI is not set", async () => {
            delete process.env.OUTLOOK_OAUTH_REDIRECT_URI;
            const service = makeService();

            await expect(
                service.buildAuthorizationUrl("some-state")
            ).rejects.toThrow("OUTLOOK_OAUTH_REDIRECT_URI is not configured");
        });
    });

    describe("exchangeAuthorizationCode", () => {
        it("sends correct POST body and returns token result", async () => {
            const mockResponse = {
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
                expires_in: 3600,
                token_type: "Bearer",
            };

            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(JSON.stringify(mockResponse), { status: 200 })
            );

            const service = makeService();
            const result = await service.exchangeAuthorizationCode("auth-code-123");

            expect(result.accessToken).toBe("new-access-token");
            expect(result.refreshToken).toBe("new-refresh-token");
            expect(result.accessTokenExpiresAt).toBeDefined();

            const expiresAt = Date.parse(result.accessTokenExpiresAt);
            expect(expiresAt).toBeGreaterThan(Date.now());

            const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
            const requestBody = fetchCall[1]?.body?.toString() || fetchCall[0]?.body?.toString();
            expect(requestBody).toContain("grant_type=authorization_code");
            expect(requestBody).toContain("code=auth-code-123");
        });

        it("throws if response contains no refresh token", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "token-no-refresh",
                        expires_in: 3600,
                    }),
                    { status: 200 }
                )
            );

            const service = makeService();

            await expect(
                service.exchangeAuthorizationCode("code-no-refresh")
            ).rejects.toThrow("did not return a refresh token");
        });

        it("throws on non-200 response from Microsoft identity endpoint", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({ error: "invalid_grant", error_description: "Code expired" }),
                    { status: 400 }
                )
            );

            const service = makeService();

            await expect(
                service.exchangeAuthorizationCode("expired-code")
            ).rejects.toThrow("Microsoft identity token request failed (400)");
        });
    });

    describe("refreshAccessToken", () => {
        it("sends refresh_token grant and returns new tokens", async () => {
            const mockResponse = {
                access_token: "refreshed-access-token",
                refresh_token: "rotated-refresh-token",
                expires_in: 3600,
            };

            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(JSON.stringify(mockResponse), { status: 200 })
            );

            const service = makeService();
            const result = await service.refreshAccessToken("old-refresh-token");

            expect(result.accessToken).toBe("refreshed-access-token");
            expect(result.refreshToken).toBe("rotated-refresh-token");
        });

        it("uses fallback refresh token when response omits new one", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({ access_token: "new-access", expires_in: 3600 }),
                    { status: 200 }
                )
            );

            const service = makeService();
            const result = await service.refreshAccessToken("kept-refresh-token");

            expect(result.refreshToken).toBe("kept-refresh-token");
        });

        it("throws on token endpoint failure", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response("Unauthorized", { status: 401 })
            );

            const service = makeService();

            await expect(
                service.refreshAccessToken("bad-token")
            ).rejects.toThrow("Microsoft identity token request failed (401)");
        });
    });

    describe("getProfile", () => {
        it("returns displayName and email from Graph /me endpoint", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        displayName: "Jane Smith",
                        mail: "jane.smith@contoso.com",
                        userPrincipalName: "jane@contoso.onmicrosoft.com",
                    }),
                    { status: 200 }
                )
            );

            const service = makeService();
            const profile = await service.getProfile("valid-access-token");

            expect(profile.displayName).toBe("Jane Smith");
            expect(profile.email).toBe("jane.smith@contoso.com");
        });

        it("falls back to userPrincipalName when mail is absent", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        displayName: "Guest User",
                        userPrincipalName: "guest@contoso.onmicrosoft.com",
                    }),
                    { status: 200 }
                )
            );

            const service = makeService();
            const profile = await service.getProfile("token");

            expect(profile.email).toBe("guest@contoso.onmicrosoft.com");
        });

        it("throws when neither mail nor userPrincipalName is present", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(JSON.stringify({ displayName: "No Email" }), { status: 200 })
            );

            const service = makeService();

            await expect(service.getProfile("token")).rejects.toThrow(
                "Graph profile missing mail/userPrincipalName"
            );
        });

        it("throws on non-200 Graph response", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response("Token expired", { status: 401 })
            );

            const service = makeService();

            await expect(service.getProfile("expired-token")).rejects.toThrow(
                "Graph profile fetch failed (401)"
            );
        });
    });

    describe("ensureValidAccessToken", () => {
        it("returns integration unchanged when token is not near expiry", async () => {
            const fetchSpy = jest.spyOn(global, "fetch");
            const service = makeService();
            const integration = {
                userId: "user-001",
                connectedAt: "2026-04-01T00:00:00.000Z",
                updatedAt: "2026-04-01T00:00:00.000Z",
                refreshToken: "refresh",
                accessToken: "still-valid-token",
                accessTokenExpiresAt: new Date(Date.now() + 600_000).toISOString(),
                outlookUserEmail: "user@example.com",
                oauthState: "",
                oauthStateExpiresAt: "",
            };

            const result = await service.ensureValidAccessToken(integration);

            expect(result.accessToken).toBe("still-valid-token");
            expect(fetchSpy).not.toHaveBeenCalled();
        });

        it("refreshes token when within 120s of expiry", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "fresh-token",
                        refresh_token: "new-refresh",
                        expires_in: 3600,
                    }),
                    { status: 200 }
                )
            );

            const service = makeService();
            const integration = {
                userId: "user-001",
                connectedAt: "2026-04-01T00:00:00.000Z",
                updatedAt: "2026-04-01T00:00:00.000Z",
                refreshToken: "old-refresh",
                accessToken: "expiring-token",
                accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
                outlookUserEmail: "user@example.com",
                oauthState: "",
                oauthStateExpiresAt: "",
            };

            const result = await service.ensureValidAccessToken(integration);

            expect(result.accessToken).toBe("fresh-token");
            expect(result.refreshToken).toBe("new-refresh");
        });

        it("throws when refresh token is missing on an expired integration", async () => {
            const service = makeService();
            const integration = {
                userId: "user-001",
                connectedAt: "2026-04-01T00:00:00.000Z",
                updatedAt: "2026-04-01T00:00:00.000Z",
                refreshToken: "",
                accessToken: "expired",
                accessTokenExpiresAt: new Date(Date.now() - 60_000).toISOString(),
                outlookUserEmail: "user@example.com",
                oauthState: "",
                oauthStateExpiresAt: "",
            };

            await expect(
                service.ensureValidAccessToken(integration)
            ).rejects.toThrow("missing refresh token");
        });

        it("treats invalid ISO date as expired and refreshes", async () => {
            jest.spyOn(global, "fetch").mockResolvedValue(
                new Response(
                    JSON.stringify({
                        access_token: "new-token",
                        refresh_token: "new-refresh",
                        expires_in: 3600,
                    }),
                    { status: 200 }
                )
            );

            const service = makeService();
            const integration = {
                userId: "user-001",
                connectedAt: "2026-04-01T00:00:00.000Z",
                updatedAt: "2026-04-01T00:00:00.000Z",
                refreshToken: "valid-refresh",
                accessToken: "old",
                accessTokenExpiresAt: "not-a-date",
                outlookUserEmail: "user@example.com",
                oauthState: "",
                oauthStateExpiresAt: "",
            };

            const result = await service.ensureValidAccessToken(integration);

            expect(result.accessToken).toBe("new-token");
        });
    });
});
