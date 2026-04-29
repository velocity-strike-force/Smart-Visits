import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { postSlackIncomingWebhook } from "../services/slackIncomingWebhook";

export interface PostVisitSlackPayload {
    customer?: string;
    productLine?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    salesRep?: string;
    domain?: string;
    purpose?: string;
    details?: string;
    capacity?: string;
    inviteeCount?: number;
    isPrivate?: boolean;
}

export class SlackPostVisitHandler extends ApiGatewayLambdaHandler {
    async handleSlackPostVisitEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            POST: this.postVisitSlack.bind(this),
        });
    }

    private async postVisitSlack(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const webhookUrl = process.env.SLACK_WEBHOOK_URL?.trim();
            const body = JSON.parse(event.body ?? "{}") as PostVisitSlackPayload;

            const lines = [
                "*New visit posted (Smart Visits)*",
                body.customer && `• *Customer:* ${body.customer}`,
                body.productLine && `• *Product line:* ${body.productLine}`,
                body.domain && `• *Domain:* ${body.domain}`,
                body.location && `• *Location:* ${body.location}`,
                body.startDate && `• *Start:* ${body.startDate}`,
                body.endDate && `• *End:* ${body.endDate}`,
                body.salesRep && `• *Sales rep:* ${body.salesRep}`,
                body.purpose && `• *Purpose:* ${body.purpose}`,
                body.capacity && `• *Capacity:* ${body.capacity}`,
                typeof body.inviteeCount === "number" &&
                    `• *Invitees added:* ${body.inviteeCount}`,
                typeof body.isPrivate === "boolean" &&
                    `• *Private:* ${body.isPrivate ? "Yes" : "No"}`,
                body.details && `• *Details:* ${body.details}`,
            ].filter(Boolean) as string[];

            const text = lines.join("\n");

            if (!webhookUrl) {
                return this.createSuccessResponse({
                    success: true,
                    skipped: true,
                    message: "Slack webhook not configured",
                });
            }

            await postSlackIncomingWebhook(webhookUrl, text);

            return this.createSuccessResponse({
                success: true,
                message: "Posted to Slack",
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Slack notification failed",
            });
        }
    }
}
