import { ParameterStoreService } from "./ParameterStoreService";
import { OutlookIntegrationData } from "../database/schema/OutlookIntegration";
import { fetchWithRetry } from "./httpRetry";

const TOKEN_REFRESH_BUFFER_SECONDS = 120;
const AUTH_SCOPE =
    "openid profile offline_access User.Read Calendars.ReadWrite";

interface TokenEndpointResponse {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}

export interface OAuthTokenResult {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
}

export interface OutlookProfile {
    displayName: string;
    email: string;
}

export class OutlookOAuthService {
    private readonly parameterStore: ParameterStoreService;

    constructor(parameterStore?: ParameterStoreService) {
        this.parameterStore =
            parameterStore ?? ParameterStoreService.getInstance();
    }

    async buildAuthorizationUrl(state: string): Promise<string> {
        const { tenantId, clientId, redirectUri } = await this.getOAuthConfig();
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: "code",
            redirect_uri: redirectUri,
            response_mode: "query",
            scope: AUTH_SCOPE,
            state,
        });

        return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize?${params.toString()}`;
    }

    async exchangeAuthorizationCode(code: string): Promise<OAuthTokenResult> {
        const { tenantId, clientId, clientSecret, redirectUri } =
            await this.getOAuthConfig();

        const body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            scope: AUTH_SCOPE,
        });

        const payload = await this.sendTokenRequest(tenantId, body);
        const tokenResult = this.toOAuthTokenResult(payload);
        if (!tokenResult.refreshToken) {
            throw new Error(
                "Authorization code exchange did not return a refresh token"
            );
        }
        return tokenResult;
    }

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResult> {
        const { tenantId, clientId, clientSecret } = await this.getOAuthConfig();
        const body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            scope: AUTH_SCOPE,
        });

        const payload = await this.sendTokenRequest(tenantId, body);
        return this.toOAuthTokenResult(payload, refreshToken);
    }

    async getProfile(accessToken: string): Promise<OutlookProfile> {
        const response = await fetchWithRetry(
            () =>
                fetch("https://graph.microsoft.com/v1.0/me", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }),
            "outlook-oauth:get-profile"
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Outlook profile fetch failed", {
                status: response.status,
                errorBody,
            });
            throw new Error(
                `Graph profile fetch failed (${response.status}): ${errorBody}`
            );
        }

        const payload = (await response.json()) as {
            displayName?: string;
            mail?: string;
            userPrincipalName?: string;
        };
        const email = payload.mail || payload.userPrincipalName;
        if (!email) {
            throw new Error("Graph profile missing mail/userPrincipalName");
        }

        return {
            displayName: payload.displayName || email,
            email,
        };
    }

    async ensureValidAccessToken(
        integration: OutlookIntegrationData
    ): Promise<OutlookIntegrationData> {
        if (
            integration.accessToken &&
            integration.accessTokenExpiresAt &&
            !this.isTokenNearExpiry(integration.accessTokenExpiresAt)
        ) {
            return integration;
        }

        if (!integration.refreshToken) {
            throw new Error("Outlook integration missing refresh token");
        }

        const refreshed = await this.refreshAccessToken(integration.refreshToken);
        console.info("Refreshed Outlook access token from refresh token", {
            userId: integration.userId,
        });
        return {
            ...integration,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
            updatedAt: new Date().toISOString(),
        };
    }

    private async getOAuthConfig(): Promise<{
        tenantId: string;
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    }> {
        await this.parameterStore.init();

        const tenantId = this.parameterStore.getRequired("outlook/tenant-id");
        const clientId = this.parameterStore.getRequired("outlook/client-id");
        const clientSecret = this.parameterStore.getRequired(
            "outlook/client-secret"
        );
        const redirectUri = process.env.OUTLOOK_OAUTH_REDIRECT_URI;

        if (!redirectUri) {
            throw new Error("OUTLOOK_OAUTH_REDIRECT_URI is not configured");
        }

        return {
            tenantId,
            clientId,
            clientSecret,
            redirectUri,
        };
    }

    private async sendTokenRequest(
        tenantId: string,
        body: URLSearchParams
    ): Promise<TokenEndpointResponse> {
        const endpoint = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
        const response = await fetchWithRetry(
            () =>
                fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body,
                }),
            "outlook-oauth:token-request"
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Outlook token request failed", {
                status: response.status,
                errorBody,
            });
            throw new Error(
                `Microsoft identity token request failed (${response.status}): ${errorBody}`
            );
        }

        return (await response.json()) as TokenEndpointResponse;
    }

    private toOAuthTokenResult(
        payload: TokenEndpointResponse,
        fallbackRefreshToken = ""
    ): OAuthTokenResult {
        if (!payload.access_token) {
            throw new Error("Token response missing access_token");
        }

        const expiresIn = payload.expires_in ?? 3600;
        const expiresAt = new Date(
            Date.now() + (expiresIn - TOKEN_REFRESH_BUFFER_SECONDS) * 1000
        );

        return {
            accessToken: payload.access_token,
            refreshToken: payload.refresh_token ?? fallbackRefreshToken,
            accessTokenExpiresAt: expiresAt.toISOString(),
        };
    }

    private isTokenNearExpiry(expiresAtIso: string): boolean {
        const expiresAtEpoch = Date.parse(expiresAtIso);
        if (Number.isNaN(expiresAtEpoch)) {
            return true;
        }
        return Date.now() + TOKEN_REFRESH_BUFFER_SECONDS * 1000 >= expiresAtEpoch;
    }
}

export default new OutlookOAuthService();
