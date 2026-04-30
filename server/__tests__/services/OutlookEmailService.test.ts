import { OutlookEmailService } from "../../src/services/OutlookEmailService";

const MOCK_PARAMS: Record<string, string> = {
    "outlook/tenant-id": "tenant-abc",
    "outlook/client-id": "client-id-123",
    "outlook/client-secret": "client-secret-456",
    "outlook/sender-email": "noreply@smart-visits.example.com",
};

function makeMockParameterStore() {
    return {
        init: jest.fn().mockResolvedValue(undefined),
        getRequired: jest.fn((key: string) => {
            const value = MOCK_PARAMS[key];
            if (!value) throw new Error(`Missing param: ${key}`);
            return value;
        }),
        get: jest.fn((key: string) => MOCK_PARAMS[key]),
    };
}

function makeService(ps?: ReturnType<typeof makeMockParameterStore>) {
    return new OutlookEmailService((ps ?? makeMockParameterStore()) as any);
}

describe("OutlookEmailService", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe("sendMail", () => {
        it("returns immediately when recipients list is empty", async () => {
            const fetchSpy = jest.spyOn(global, "fetch");
            const service = makeService();

            await service.sendMail({
                to: [],
                subject: "No recipients",
                htmlBody: "<p>hello</p>",
            });

            expect(fetchSpy).not.toHaveBeenCalled();
        });

        it("acquires app token via client_credentials and sends email via Graph", async () => {
            const tokenResponse = new Response(
                JSON.stringify({ access_token: "app-token-xyz", expires_in: 3600 }),
                { status: 200 }
            );
            const sendMailResponse = new Response(null, { status: 202 });

            jest.spyOn(global, "fetch")
                .mockResolvedValueOnce(tokenResponse)
                .mockResolvedValueOnce(sendMailResponse);

            const service = makeService();
            await service.sendMail({
                to: [{ name: "Jane", email: "jane@example.com" }],
                subject: "New Visit Available",
                htmlBody: "<p>A visit matches your preferences</p>",
            });

            const calls = (global.fetch as jest.Mock).mock.calls;

            // First call: token endpoint
            const tokenUrl = calls[0][0] as string;
            expect(tokenUrl).toContain(
                "login.microsoftonline.com/tenant-abc/oauth2/v2.0/token"
            );
            const tokenBody = calls[0][1].body as URLSearchParams;
            expect(tokenBody.get("grant_type")).toBe("client_credentials");
            expect(tokenBody.get("scope")).toBe("https://graph.microsoft.com/.default");

            // Second call: sendMail endpoint
            const sendUrl = calls[1][0] as string;
            expect(sendUrl).toContain(
                "graph.microsoft.com/v1.0/users/noreply%40smart-visits.example.com/sendMail"
            );
            const sendBody = JSON.parse(calls[1][1].body);
            expect(sendBody.message.subject).toBe("New Visit Available");
            expect(sendBody.message.toRecipients[0].emailAddress.address).toBe(
                "jane@example.com"
            );
            expect(sendBody.saveToSentItems).toBe(false);
        });

        it("sends to multiple recipients in toRecipients array", async () => {
            jest.spyOn(global, "fetch")
                .mockResolvedValueOnce(
                    new Response(
                        JSON.stringify({ access_token: "token", expires_in: 3600 }),
                        { status: 200 }
                    )
                )
                .mockResolvedValueOnce(new Response(null, { status: 202 }));

            const service = makeService();
            await service.sendMail({
                to: [
                    { name: "Alice", email: "alice@example.com" },
                    { name: "Bob", email: "bob@example.com" },
                ],
                subject: "Multi-recipient",
                htmlBody: "<p>test</p>",
            });

            const sendBody = JSON.parse(
                (global.fetch as jest.Mock).mock.calls[1][1].body
            );
            expect(sendBody.message.toRecipients).toHaveLength(2);
        });

        it("throws descriptive error when sendMail Graph call fails", async () => {
            jest.spyOn(global, "fetch")
                .mockResolvedValueOnce(
                    new Response(
                        JSON.stringify({ access_token: "token", expires_in: 3600 }),
                        { status: 200 }
                    )
                )
                .mockResolvedValueOnce(
                    new Response(
                        JSON.stringify({
                            error: {
                                code: "ErrorAccessDenied",
                                message: "Access is denied.",
                            },
                        }),
                        { status: 403 }
                    )
                );

            const service = makeService();

            await expect(
                service.sendMail({
                    to: [{ name: "User", email: "user@example.com" }],
                    subject: "Test",
                    htmlBody: "<p>body</p>",
                })
            ).rejects.toThrow("Microsoft Graph sendMail failed (403)");
        });

        it("throws when token endpoint returns non-200", async () => {
            jest.spyOn(global, "fetch").mockResolvedValueOnce(
                new Response("Unauthorized", { status: 401 })
            );

            const service = makeService();

            await expect(
                service.sendMail({
                    to: [{ name: "User", email: "user@example.com" }],
                    subject: "Test",
                    htmlBody: "<p>body</p>",
                })
            ).rejects.toThrow("Microsoft identity token request failed (401)");
        });

        it("throws when token response has no access_token field", async () => {
            jest.spyOn(global, "fetch").mockResolvedValueOnce(
                new Response(JSON.stringify({ expires_in: 3600 }), { status: 200 })
            );

            const service = makeService();

            await expect(
                service.sendMail({
                    to: [{ name: "User", email: "user@example.com" }],
                    subject: "Test",
                    htmlBody: "<p>body</p>",
                })
            ).rejects.toThrow("missing access_token");
        });
    });

    describe("token caching", () => {
        it("reuses cached token for subsequent calls within expiry window", async () => {
            const fetchSpy = jest.spyOn(global, "fetch")
                .mockResolvedValueOnce(
                    new Response(
                        JSON.stringify({ access_token: "cached-token", expires_in: 3600 }),
                        { status: 200 }
                    )
                )
                .mockResolvedValue(new Response(null, { status: 202 }));

            const service = makeService();

            await service.sendMail({
                to: [{ name: "A", email: "a@example.com" }],
                subject: "First",
                htmlBody: "<p>1</p>",
            });
            await service.sendMail({
                to: [{ name: "B", email: "b@example.com" }],
                subject: "Second",
                htmlBody: "<p>2</p>",
            });

            // Token endpoint called only once; sendMail called twice
            const tokenCalls = fetchSpy.mock.calls.filter(
                (call) => (call[0] as string).includes("oauth2/v2.0/token")
            );
            const sendCalls = fetchSpy.mock.calls.filter(
                (call) => (call[0] as string).includes("sendMail")
            );
            expect(tokenCalls).toHaveLength(1);
            expect(sendCalls).toHaveLength(2);
        });
    });
});
