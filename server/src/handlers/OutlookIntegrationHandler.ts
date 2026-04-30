import { randomUUID } from "crypto";
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import outlookOAuthService, {
    OutlookOAuthService,
} from "../services/OutlookOAuthService";
import { OutlookIntegrationData } from "../database/schema/OutlookIntegration";
import outlookCalendarService, {
    OutlookCalendarService,
} from "../services/OutlookCalendarService";

interface OAuthStatePayload {
    userId: string;
    nonce: string;
    issuedAt: number;
}

interface IntegrationErrorResponse {
    success: false;
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export class OutlookIntegrationHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;
    private readonly oauthService: OutlookOAuthService;
    private readonly calendarService: OutlookCalendarService;

    constructor(options?: {
        db?: Dynamo;
        oauthService?: OutlookOAuthService;
        calendarService?: OutlookCalendarService;
    }) {
        super();
        this.db = options?.db ?? new Dynamo({});
        this.oauthService = options?.oauthService ?? outlookOAuthService;
        this.calendarService = options?.calendarService ?? outlookCalendarService;
    }

    async handleOutlookIntegrationEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getIntegration.bind(this),
            POST: this.startConnect.bind(this),
            DELETE: this.disconnect.bind(this),
        });
    }

    private async getIntegration(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const code = event.queryStringParameters?.code;
        const state = event.queryStringParameters?.state;
        if (code && state) {
            return this.completeConnect(code, state);
        }

        const userId = event.queryStringParameters?.userId;
        if (!userId) {
            return this.createIntegrationErrorResponse(
                400,
                "INVALID_REQUEST",
                "userId is required"
            );
        }

        const integration = await this.db.getOutlookIntegrationByUserId(userId);
        return this.createSuccessResponse({
            success: true,
            connected: Boolean(integration?.refreshToken),
            userId,
            outlookUserEmail: integration?.outlookUserEmail || "",
            connectedAt: integration?.connectedAt?.toISOString() || "",
        });
    }

    private async startConnect(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}") as { userId?: string };
        const userId = body.userId?.trim();
        if (!userId) {
            return this.createIntegrationErrorResponse(
                400,
                "INVALID_REQUEST",
                "userId is required"
            );
        }

        const profile = await this.db.getUserById(userId);
        if (!profile) {
            return this.createIntegrationErrorResponse(
                404,
                "USER_NOT_FOUND",
                "User profile not found",
                { userId }
            );
        }

        const now = Date.now();
        const nowIso = new Date(now).toISOString();
        const nonce = randomUUID();
        const statePayload: OAuthStatePayload = {
            userId,
            nonce,
            issuedAt: now,
        };
        const encodedState = Buffer.from(JSON.stringify(statePayload)).toString(
            "base64url"
        );
        const authUrl = await this.oauthService.buildAuthorizationUrl(encodedState);
        const existing = await this.db.getOutlookIntegrationByUserId(userId);

        await this.db.putOutlookIntegration({
            userId,
            connectedAt: existing?.connectedAt.toISOString() || nowIso,
            updatedAt: nowIso,
            refreshToken: existing?.refreshToken || "",
            accessToken: existing?.accessToken || "",
            accessTokenExpiresAt: existing?.accessTokenExpiresAt || "",
            outlookUserEmail: existing?.outlookUserEmail || profile.email,
            oauthState: nonce,
            oauthStateExpiresAt: new Date(now + OAUTH_STATE_TTL_MS).toISOString(),
        });

        return this.createSuccessResponse({
            success: true,
            userId,
            authUrl,
        });
    }

    private async completeConnect(
        code: string,
        state: string
    ): Promise<APIGatewayProxyResult> {
        let payload: OAuthStatePayload;
        try {
            payload = JSON.parse(
                Buffer.from(state, "base64url").toString("utf8")
            ) as OAuthStatePayload;
        } catch {
            return this.createOAuthCallbackRedirect("error", {
                message: "Invalid OAuth state payload",
            });
        }

        const userId = payload.userId?.trim();
        const nonce = payload.nonce?.trim();
        if (!userId || !nonce) {
            return this.createOAuthCallbackRedirect("error", {
                userId: userId || "",
                message: "OAuth state is missing required fields",
            });
        }

        try {
            const integration = await this.db.getOutlookIntegrationByUserId(userId);
            if (!integration) {
                return this.createOAuthCallbackRedirect("error", {
                    userId,
                    message: "No pending Outlook integration request found",
                });
            }

            if (integration.oauthState !== nonce) {
                return this.createOAuthCallbackRedirect("error", {
                    userId,
                    message: "OAuth state mismatch",
                });
            }

            const stateExpiry = Date.parse(integration.oauthStateExpiresAt || "");
            if (Number.isNaN(stateExpiry) || Date.now() > stateExpiry) {
                return this.createOAuthCallbackRedirect("error", {
                    userId,
                    message: "OAuth state has expired; start connection again",
                });
            }

            const tokenResult = await this.oauthService.exchangeAuthorizationCode(
                code
            );
            const profile = await this.oauthService.getProfile(
                tokenResult.accessToken
            );
            const nowIso = new Date().toISOString();

            const nextIntegration: OutlookIntegrationData = {
                userId,
                connectedAt: integration.connectedAt.toISOString(),
                updatedAt: nowIso,
                refreshToken: tokenResult.refreshToken,
                accessToken: tokenResult.accessToken,
                accessTokenExpiresAt: tokenResult.accessTokenExpiresAt,
                outlookUserEmail: profile.email,
                oauthState: "",
                oauthStateExpiresAt: "",
            };
            await this.db.putOutlookIntegration(nextIntegration);

            console.info("Outlook calendar integration connected", {
                userId,
                outlookUserEmail: profile.email,
            });

            return this.createOAuthCallbackRedirect("success", {
                userId,
                message: "Outlook calendar integration connected",
            });
        } catch (error) {
            console.error("Failed completing Outlook OAuth callback", {
                userId,
                error,
            });
            return this.createOAuthCallbackRedirect("error", {
                userId,
                message:
                    error instanceof Error
                        ? error.message
                        : "Outlook connection failed",
            });
        }
    }

    private async disconnect(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const userId = event.queryStringParameters?.userId;
        if (!userId) {
            return this.createIntegrationErrorResponse(
                400,
                "INVALID_REQUEST",
                "userId is required"
            );
        }

        const links = await this.db.getCalendarEventLinksForUser(userId);
        for (const link of links) {
            try {
                await this.calendarService.deleteVisitEventForUser(
                    link.visitId,
                    link.userId
                );
            } catch (error) {
                console.error("Failed deleting Outlook event during disconnect", {
                    userId,
                    visitId: link.visitId,
                    eventId: link.eventId,
                    error,
                });
            }
        }

        await this.db.deleteOutlookIntegration(userId);
        console.info("Outlook calendar integration disconnected", { userId });
        return this.createSuccessResponse({
            success: true,
            message: "Outlook calendar integration disconnected",
            userId,
        });
    }

    private createIntegrationErrorResponse(
        statusCode: number,
        code: string,
        message: string,
        details?: Record<string, unknown>
    ): APIGatewayProxyResult {
        const body: IntegrationErrorResponse = {
            success: false,
            code,
            message,
            ...(details ? { details } : {}),
        };
        return this.createErrorResponse(statusCode, body);
    }

    private createOAuthCallbackRedirect(
        status: "success" | "error",
        options: {
            userId?: string;
            message: string;
        }
    ): APIGatewayProxyResult {
        const url = new URL(
            "/outlook/callback",
            process.env.FRONTEND_BASE_URL || "https://smart-visits.example.com"
        );
        url.searchParams.set("status", status);
        url.searchParams.set("message", options.message);
        if (options.userId) {
            url.searchParams.set("userId", options.userId);
        }

        return {
            statusCode: 302,
            headers: {
                "Access-Control-Allow-Origin": "*",
                Location: url.toString(),
            },
            body: "",
        };
    }
}
