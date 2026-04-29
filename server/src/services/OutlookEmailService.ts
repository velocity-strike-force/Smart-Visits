import { ParameterStoreService } from "./ParameterStoreService";

export interface EmailRecipient {
    name: string;
    email: string;
}

export interface OutlookEmailPayload {
    to: EmailRecipient[];
    subject: string;
    htmlBody: string;
}

interface CachedToken {
    accessToken: string;
    expiresAtEpochMs: number;
}

export class OutlookEmailService {
    private readonly parameterStore: ParameterStoreService;
    private cachedToken?: CachedToken;

    constructor(parameterStore?: ParameterStoreService) {
        this.parameterStore =
            parameterStore ?? ParameterStoreService.getInstance();
    }

    async sendMail(payload: OutlookEmailPayload): Promise<void> {
        if (payload.to.length === 0) {
            return;
        }

        await this.parameterStore.init();

        const senderEmail = this.parameterStore.getRequired(
            "outlook/sender-email"
        );
        const accessToken = await this.getAccessToken();
        const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: {
                    subject: payload.subject,
                    body: {
                        contentType: "HTML",
                        content: payload.htmlBody,
                    },
                    toRecipients: payload.to.map((recipient) => ({
                        emailAddress: {
                            name: recipient.name,
                            address: recipient.email,
                        },
                    })),
                },
                saveToSentItems: false,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Microsoft Graph sendMail failed (${response.status}): ${errorBody}`
            );
        }
    }

    private async getAccessToken(): Promise<string> {
        const now = Date.now();
        if (this.cachedToken && now < this.cachedToken.expiresAtEpochMs) {
            return this.cachedToken.accessToken;
        }

        await this.parameterStore.init();

        const tenantId = this.parameterStore.getRequired("outlook/tenant-id");
        const clientId = this.parameterStore.getRequired("outlook/client-id");
        const clientSecret = this.parameterStore.getRequired(
            "outlook/client-secret"
        );

        const tokenEndpoint = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
        const body = new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            scope: "https://graph.microsoft.com/.default",
        });

        const response = await fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Microsoft identity token request failed (${response.status}): ${errorBody}`
            );
        }

        const payload = (await response.json()) as {
            access_token?: string;
            expires_in?: number;
        };

        if (!payload.access_token) {
            throw new Error("Microsoft identity token response missing access_token");
        }

        const expiresInSeconds = payload.expires_in ?? 3600;
        this.cachedToken = {
            accessToken: payload.access_token,
            // Refresh early to avoid sending with a nearly expired token.
            expiresAtEpochMs: Date.now() + Math.max(expiresInSeconds - 120, 60) * 1000,
        };

        return this.cachedToken.accessToken;
    }
}

export default new OutlookEmailService();
