import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

export class FeedbackHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
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
        const visitId = event.queryStringParameters?.visitId;

        if (!visitId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId is required",
            });
        }

        // TODO: replace mock with real DynamoDB call — this.db.getFeedbackForVisit(visitId)
        return this.createSuccessResponse({
            success: true,
            visitId,
            feedback: [
                {
                    visitId,
                    userId: "user-002",
                    userName: "Alice Williams",
                    role: "visitor",
                    feedbackNotes: "Great visit — learned a lot about their warehouse operations.",
                    keyAreasOfFocus: [],
                    detractors: "",
                    delighters: "",
                    submittedAt: "2026-05-17T10:00:00Z",
                },
                {
                    visitId,
                    userId: "rep-001",
                    userName: "Jane Smith",
                    role: "salesRep",
                    feedbackNotes: "Customer is very happy with the product.",
                    keyAreasOfFocus: ["Inventory accuracy", "Cycle counting"],
                    detractors: "Minor UI complaints about reporting.",
                    delighters: "Speed of implementation impressed the team.",
                    submittedAt: "2026-05-17T11:30:00Z",
                },
            ],
        });
    }

    private async submitFeedback(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}");
        const { visitId, userId } = body;

        if (!visitId || !userId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId and userId are required",
            });
        }

        // TODO: replace mock with real DynamoDB call — this.db.putFeedback(body)

        return this.createSuccessResponse({
            success: true,
            message: "Feedback submitted successfully",
        });
    }
}
