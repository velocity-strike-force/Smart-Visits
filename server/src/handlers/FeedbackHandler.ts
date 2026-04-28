import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import { FeedbackData } from "../database/schema/Feedback";
import auditLogger from "../services/AuditLoggerService";
import { AuditLogData } from "../database/schema/AuditLog";

export class FeedbackHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
    }

    private async logAudit(
        entry: Omit<AuditLogData, "timestamp">
    ): Promise<void> {
        try {
            auditLogger.log(entry);
            await auditLogger.flush();
        } catch (error) {
            console.error("Failed to flush audit log entry", error);
        }
    }

    async handleFeedbackEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getFeedback.bind(this),
            POST: this.submitFeedback.bind(this),
        });
    }

    private async getFeedback(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const visitId = event.queryStringParameters?.visitId;

            if (!visitId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "visitId is required",
                });
            }

            const feedback = await this.db.getFeedbackForVisit(visitId);
            return this.createSuccessResponse({
                success: true,
                visitId,
                feedback,
            });
        } catch (error) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }

    private async submitFeedback(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const body = JSON.parse(event.body ?? "{}") as Partial<FeedbackData>;
            const { visitId, userId } = body;

            if (!visitId || !userId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "visitId and userId are required",
                });
            }

            const feedbackData: FeedbackData = {
                visitId,
                userId,
                userName: body.userName ?? "",
                role: body.role === "salesRep" ? "salesRep" : "visitor",
                feedbackNotes: body.feedbackNotes ?? "",
                keyAreasOfFocus: body.keyAreasOfFocus ?? [],
                detractors: body.detractors ?? "",
                delighters: body.delighters ?? "",
                submittedAt: body.submittedAt ?? new Date().toISOString(),
            };

            await this.db.putFeedback(feedbackData);
            await this.logAudit({
                entityId: `${visitId}#${userId}`,
                action: "FEEDBACK_SUBMITTED",
                actorUserId: userId,
                metadata: { visitId, userId },
            });

            return this.createSuccessResponse({
                success: true,
                message: "Feedback submitted successfully",
            });
        } catch (error) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }
}
