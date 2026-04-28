import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import { VisitData } from "../database/schema/Visit";
import auditLogger from "../services/AuditLoggerService";
import { AuditLogData } from "../database/schema/AuditLog";

export class VisitHandler extends ApiGatewayLambdaHandler {
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

    async handleVisitEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getVisits.bind(this),
            POST: this.createVisit.bind(this),
            PUT: this.updateVisit.bind(this),
            DELETE: this.deleteVisit.bind(this),
        });
    }

    private async getVisits(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const params = event.queryStringParameters;
            const visitId = params?.visitId;

            if (visitId) {
                const visit = await this.db.getVisitById(visitId);
                if (!visit) {
                    return this.createErrorResponse(404, {
                        success: false,
                        message: "Visit not found",
                    });
                }

                return this.createSuccessResponse({
                    success: true,
                    visit,
                });
            }

            const visits = await this.db.getAllVisits();
            return this.createSuccessResponse({
                success: true,
                visits,
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

    private async createVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const body = JSON.parse(event.body ?? "{}") as Partial<VisitData>;
            const nowIso = new Date().toISOString();
            const visitId = body.visitId ?? randomUUID();

            const visitData: VisitData = {
                visitId,
                productLine: body.productLine ?? "",
                location: body.location ?? "",
                city: body.city ?? "",
                state: body.state ?? "",
                salesRepId: body.salesRepId ?? "",
                salesRepName: body.salesRepName ?? "",
                domain: body.domain ?? "",
                customerId: body.customerId ?? "",
                customerName: body.customerName ?? "",
                customerARR: body.customerARR ?? 0,
                customerImplementationStatus:
                    body.customerImplementationStatus ?? "",
                isKeyAccount: body.isKeyAccount ?? false,
                startDate: body.startDate ?? nowIso,
                endDate: body.endDate ?? nowIso,
                capacity: body.capacity ?? 0,
                invitees: body.invitees ?? [],
                customerContactRep: body.customerContactRep ?? "",
                purposeForVisit: body.purposeForVisit ?? "",
                visitDetails: body.visitDetails ?? "",
                isDraft: body.isDraft ?? false,
                isPrivate: body.isPrivate ?? false,
                createdAt: body.createdAt ?? nowIso,
                updatedAt: nowIso,
            };

            await this.db.createVisit(visitData);
            await this.logAudit({
                entityId: visitId,
                action: "VISIT_CREATED",
                actorUserId: body.salesRepId,
                metadata: { visitId },
            });

            return this.createSuccessResponse({
                success: true,
                visitId,
                message: "Visit created successfully",
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

    private async updateVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const body = JSON.parse(event.body ?? "{}") as Partial<VisitData>;
            const { visitId, ...updates } = body;

            if (!visitId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "visitId is required",
                });
            }

            const existingVisit = await this.db.getVisitById(visitId);
            if (!existingVisit) {
                return this.createErrorResponse(404, {
                    success: false,
                    message: "Visit not found",
                });
            }

            const normalizedUpdates = Object.fromEntries(
                Object.entries(updates).filter(([, value]) => value !== undefined)
            ) as Partial<VisitData>;
            normalizedUpdates.updatedAt = new Date().toISOString();

            await this.db.updateVisit(visitId, normalizedUpdates);
            await this.logAudit({
                entityId: visitId,
                action: "VISIT_UPDATED",
                actorUserId: normalizedUpdates.salesRepId,
                metadata: {
                    visitId,
                    updatedFields: Object.keys(normalizedUpdates),
                },
            });

            return this.createSuccessResponse({
                success: true,
                visitId,
                message: "Visit updated successfully",
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

    private async deleteVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const params = event.queryStringParameters;
            const visitId = params?.visitId;

            if (!visitId) {
                return this.createErrorResponse(400, {
                    success: false,
                    message: "visitId is required",
                });
            }

            const existingVisit = await this.db.getVisitById(visitId);
            if (!existingVisit) {
                return this.createErrorResponse(404, {
                    success: false,
                    message: "Visit not found",
                });
            }

            await this.db.deleteVisit(visitId);
            await this.logAudit({
                entityId: visitId,
                action: "VISIT_DELETED",
                actorUserId: existingVisit.salesRepId,
                metadata: { visitId },
            });

            return this.createSuccessResponse({
                success: true,
                message: "Visit deleted successfully",
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
