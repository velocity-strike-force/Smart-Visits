import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

export class SignupHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
    }

    async handleSignupEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getSignups.bind(this),
            POST: this.createSignup.bind(this),
            DELETE: this.cancelSignup.bind(this),
        });
    }

    private async getSignups(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const visitId = event.queryStringParameters?.visitId;

        if (!visitId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId is required",
            });
        }

        // TODO: replace mock with real DynamoDB call — this.db.getSignupsForVisit(visitId)
        return this.createSuccessResponse({
            success: true,
            visitId,
            signups: [
                {
                    visitId,
                    userId: "user-002",
                    userName: "Alice Williams",
                    userEmail: "alice.williams@rfsmart.com",
                    signedUpAt: "2026-04-10T14:30:00Z",
                },
                {
                    visitId,
                    userId: "user-003",
                    userName: "Charlie Brown",
                    userEmail: "charlie.brown@rfsmart.com",
                    signedUpAt: "2026-04-11T09:15:00Z",
                },
            ],
            capacityRemaining: 3,
        });
    }

    private async createSignup(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}");
        const { visitId, userId, userName, userEmail } = body;

        if (!visitId || !userId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId and userId are required",
            });
        }

        // TODO: replace mock with real DynamoDB call:
        // 1. Check capacity: this.db.getSignupsForVisit(visitId) + this.db.getVisitById(visitId)
        // 2. Create signup: this.db.putSignup({ visitId, userId, userName, userEmail, signedUpAt })

        return this.createSuccessResponse({
            success: true,
            message: "Successfully signed up for visit",
        });
    }

    private async cancelSignup(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const params = event.queryStringParameters;
        const visitId = params?.visitId;
        const userId = params?.userId;

        if (!visitId || !userId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId and userId are required",
            });
        }

        // TODO: replace mock with real DynamoDB call — this.db.deleteSignup(visitId, userId)

        return this.createSuccessResponse({
            success: true,
            message: "Signup cancelled successfully",
        });
    }
}
