import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import { SignupData } from "../database/schema/Signup";
import auditLogger from "../services/AuditLoggerService";
import { AuditLogData } from "../database/schema/AuditLog";
import defaultCalendarService, {
    OutlookCalendarService,
} from "../services/OutlookCalendarService";
import { Visit } from "../database/schema/Visit";

export class SignupHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;
    private readonly calendarService: OutlookCalendarService;

    constructor(options?: { db?: Dynamo; calendarService?: OutlookCalendarService }) {
        super();
        this.db = options?.db ?? new Dynamo({});
        this.calendarService = options?.calendarService ?? defaultCalendarService;
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

    private dispatchSignupCalendarCreate(userId: string, visit: Visit): void {
        if (!process.env.OUTLOOK_OAUTH_REDIRECT_URI) {
            return;
        }
        this.calendarService
            .createOrUpdateVisitEventForUser(userId, {
                visitId: visit.visitId,
                customerName: visit.customerName,
                productLine: visit.productLine,
                location: visit.location,
                visitDetails: visit.visitDetails,
                startDate: visit.startDate,
                endDate: visit.endDate,
            })
            .catch((error) => {
                console.error("Failed to create calendar event for signup", {
                    visitId: visit.visitId,
                    userId,
                    error,
                });
            });
    }

    private dispatchSignupCalendarDelete(visitId: string, userId: string): void {
        if (!process.env.OUTLOOK_OAUTH_REDIRECT_URI) {
            return;
        }
        this.calendarService.deleteVisitEventForUser(visitId, userId).catch((error) => {
            console.error("Failed to delete calendar event for signup cancel", {
                visitId,
                userId,
                error,
            });
        });
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
        try {
            const visitId = event.queryStringParameters?.visitId;

            if (!visitId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "visitId is required",
                });
            }

            const [signups, visit] = await Promise.all([
                this.db.getSignupsForVisit(visitId),
                this.db.getVisitById(visitId),
            ]);

            return this.createSuccessResponse({
                success: true,
                visitId,
                signups,
                capacityRemaining: visit
                    ? Math.max(visit.capacity - signups.length, 0)
                    : null,
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

    private async createSignup(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const body = JSON.parse(event.body ?? "{}") as Partial<SignupData>;
            const { visitId, userId, userName, userEmail } = body;

            if (!visitId || !userId || !userName || !userEmail) {
                return this.createErrorResponse(400, {
                    success: false,
                    message:
                        "visitId, userId, userName, and userEmail are required",
                });
            }

            const [visit, signups] = await Promise.all([
                this.db.getVisitById(visitId),
                this.db.getSignupsForVisit(visitId),
            ]);

            if (!visit) {
                return this.createErrorResponse(404, {
                    success: false,
                    message: "Visit not found",
                });
            }

            if (signups.some((signup) => signup.userId === userId)) {
                return this.createErrorResponse(409, {
                    success: false,
                    message: "User is already signed up for this visit",
                });
            }

            if (signups.length >= visit.capacity) {
                return this.createErrorResponse(409, {
                    success: false,
                    message: "Visit is at capacity",
                });
            }

            const signupData: SignupData = {
                visitId,
                userId,
                userName,
                userEmail,
                signedUpAt: new Date().toISOString(),
            };

            await this.db.putSignup(signupData);
            await this.logAudit({
                entityId: `${visitId}#${userId}`,
                action: "SIGNUP_CREATED",
                actorUserId: userId,
                metadata: { visitId, userId },
            });
            this.dispatchSignupCalendarCreate(userId, visit);

            return this.createSuccessResponse({
                success: true,
                message: "Successfully signed up for visit",
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

    private async cancelSignup(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const params = event.queryStringParameters;
            const visitId = params?.visitId;
            const userId = params?.userId;

            if (!visitId || !userId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "visitId and userId are required",
                });
            }

            const signups = await this.db.getSignupsForVisit(visitId);
            if (!signups.some((signup) => signup.userId === userId)) {
                return this.createErrorResponse(404, {
                    success: false,
                    message: "Signup not found",
                });
            }

            await this.db.deleteSignup(visitId, userId);
            await this.logAudit({
                entityId: `${visitId}#${userId}`,
                action: "SIGNUP_CANCELLED",
                actorUserId: userId,
                metadata: { visitId, userId },
            });
            this.dispatchSignupCalendarDelete(visitId, userId);

            return this.createSuccessResponse({
                success: true,
                message: "Signup cancelled successfully",
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
