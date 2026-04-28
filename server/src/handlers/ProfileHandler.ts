import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import { UserData } from "../database/schema/User";

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
        try {
            const userId = event.queryStringParameters?.userId;

            if (!userId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "userId is required",
                });
            }

            const profile = await this.db.getUserById(userId);
            if (!profile) {
                return this.createErrorResponse(404, {
                    success: false,
                    message: "Profile not found",
                });
            }

            return this.createSuccessResponse({
                success: true,
                profile,
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

    private async updateProfile(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const body = JSON.parse(event.body ?? "{}") as Partial<UserData>;
            const { userId } = body;

            if (!userId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "userId is required",
                });
            }

            const nowIso = new Date().toISOString();
            const existingProfile = await this.db.getUserById(userId);

            const profileData: UserData = {
                userId,
                name: body.name ?? existingProfile?.name ?? "",
                email: body.email ?? existingProfile?.email ?? "",
                productLines:
                    body.productLines ?? existingProfile?.productLines ?? [],
                city: body.city ?? existingProfile?.city ?? "",
                state: body.state ?? existingProfile?.state ?? "",
                emailNotifications:
                    body.emailNotifications ??
                    existingProfile?.emailNotifications ??
                    false,
                slackNotifications:
                    body.slackNotifications ??
                    existingProfile?.slackNotifications ??
                    false,
                proximityAlerts:
                    body.proximityAlerts ?? existingProfile?.proximityAlerts ?? false,
                proximityDistanceMiles:
                    body.proximityDistanceMiles ??
                    existingProfile?.proximityDistanceMiles ??
                    0,
                createdAt: existingProfile
                    ? existingProfile.createdAt.toISOString()
                    : nowIso,
                updatedAt: nowIso,
            };

            await this.db.createOrUpdateUser(profileData);

            return this.createSuccessResponse({
                success: true,
                message: "Profile updated successfully",
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
