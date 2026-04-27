import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

export class ProfileHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
    }

    async handleProfileEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getProfile.bind(this),
            POST: this.updateProfile.bind(this),
        });
    }

    private async getProfile(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const userId = event.queryStringParameters?.userId;

        if (!userId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "userId is required",
            });
        }

        // TODO: replace mock with real DynamoDB call — this.db.getUserById(userId)
        return this.createSuccessResponse({
            success: true,
            profile: {
                userId,
                name: "Jane Smith",
                email: "jane.smith@rfsmart.com",
                productLines: ["NetSuite", "Oracle Cloud"],
                city: "Jacksonville",
                state: "FL",
                emailNotifications: true,
                slackNotifications: false,
                proximityAlerts: true,
                proximityDistanceMiles: 50,
                createdAt: "2026-01-15T08:00:00Z",
                updatedAt: "2026-04-01T10:00:00Z",
            },
        });
    }

    private async updateProfile(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}");
        const { userId } = body;

        if (!userId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "userId is required",
            });
        }

        // TODO: replace mock with real DynamoDB call — this.db.createOrUpdateUser(body)

        return this.createSuccessResponse({
            success: true,
            message: "Profile updated successfully",
        });
    }
}
