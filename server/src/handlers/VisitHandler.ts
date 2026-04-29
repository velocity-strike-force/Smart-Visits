import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import { Visit, type VisitData } from "../database/models/Visit";

/** `VISITS_DATA_SOURCE=dynamo` uses DynamoDB; otherwise handler mocks (tests/local default). */
function useVisitMocks(): boolean {
    return process.env.VISITS_DATA_SOURCE?.toLowerCase() !== "dynamo";
}

export class VisitHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
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
        const params = event.queryStringParameters;
        const visitId = params?.visitId;

        if (useVisitMocks()) {
            return this.getVisitsMock(visitId);
        }

        try {
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
                    visit: this.visitToFullResponse(visit),
                });
            }

            const visits = await this.db.getAllVisits();
            return this.createSuccessResponse({
                success: true,
                visits: visits.map((v) => this.visitToListResponse(v)),
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to load visits",
            });
        }
    }

    private getVisitsMock(
        visitId: string | undefined
    ): APIGatewayProxyResult {
        if (visitId) {
            return this.createSuccessResponse({
                success: true,
                visit: {
                    visitId,
                    productLine: "NetSuite",
                    location: "Jacksonville, FL",
                    city: "Jacksonville",
                    state: "FL",
                    salesRepId: "rep-001",
                    salesRepName: "Jane Smith",
                    domain: "ERP",
                    customerId: "cust-001",
                    customerName: "Acme Corp",
                    customerARR: 250000,
                    customerImplementationStatus: "Live",
                    isKeyAccount: true,
                    startDate: "2026-05-15",
                    endDate: "2026-05-16",
                    capacity: 5,
                    invitees: ["user-002", "user-003"],
                    customerContactRep: "John Doe",
                    purposeForVisit: "Quarterly Business Review",
                    visitDetails:
                        "Closed-toed shoes required. Meet in lobby at 9 AM.",
                    isDraft: false,
                    isPrivate: false,
                    createdAt: "2026-04-01T10:00:00Z",
                    updatedAt: "2026-04-01T10:00:00Z",
                },
            });
        }

        return this.createSuccessResponse({
            success: true,
            visits: [
                {
                    visitId: "visit-001",
                    productLine: "NetSuite",
                    location: "Jacksonville, FL",
                    salesRepName: "Jane Smith",
                    customerName: "Acme Corp",
                    startDate: "2026-05-15",
                    endDate: "2026-05-16",
                    capacity: 5,
                    isDraft: false,
                    isKeyAccount: true,
                },
                {
                    visitId: "visit-002",
                    productLine: "Oracle Cloud",
                    location: "Atlanta, GA",
                    salesRepName: "Bob Johnson",
                    customerName: "Globex Industries",
                    startDate: "2026-05-20",
                    endDate: "2026-05-21",
                    capacity: 3,
                    isDraft: true,
                    isKeyAccount: false,
                },
            ],
        });
    }

    private visitToFullResponse(v: Visit) {
        return {
            visitId: v.visitId,
            productLine: v.productLine,
            location: v.location,
            city: v.city,
            state: v.state,
            salesRepId: v.salesRepId,
            salesRepName: v.salesRepName,
            domain: v.domain,
            customerId: v.customerId,
            customerName: v.customerName,
            customerARR: v.customerARR,
            customerImplementationStatus: v.customerImplementationStatus,
            isKeyAccount: v.isKeyAccount,
            startDate: v.startDate.toISOString().slice(0, 10),
            endDate: v.endDate.toISOString().slice(0, 10),
            capacity: v.capacity,
            invitees: v.invitees,
            customerContactRep: v.customerContactRep,
            purposeForVisit: v.purposeForVisit,
            visitDetails: v.visitDetails,
            isDraft: v.isDraft,
            isPrivate: v.isPrivate,
            createdAt: v.createdAt.toISOString(),
            updatedAt: v.updatedAt.toISOString(),
        };
    }

    private visitToListResponse(v: Visit) {
        return {
            visitId: v.visitId,
            productLine: v.productLine,
            location: v.location,
            salesRepName: v.salesRepName,
            customerName: v.customerName,
            startDate: v.startDate.toISOString().slice(0, 10),
            endDate: v.endDate.toISOString().slice(0, 10),
            capacity: v.capacity,
            isDraft: v.isDraft,
            isKeyAccount: v.isKeyAccount,
        };
    }

    private buildVisitDataForCreate(
        body: Record<string, unknown>,
        visitId: string,
        now: string
    ): VisitData {
        return {
            visitId,
            productLine: String(body.productLine ?? "NetSuite"),
            location: String(body.location ?? ""),
            city: String(body.city ?? ""),
            state: String(body.state ?? ""),
            salesRepId: String(body.salesRepId ?? "rep-001"),
            salesRepName: String(body.salesRepName ?? ""),
            domain: String(body.domain ?? "ERP"),
            customerId: String(body.customerId ?? "cust-001"),
            customerName: String(body.customerName ?? ""),
            customerARR: Number(body.customerARR ?? 0),
            customerImplementationStatus: String(
                body.customerImplementationStatus ?? "Live"
            ),
            isKeyAccount: Boolean(body.isKeyAccount ?? false),
            startDate: String(
                body.startDate ?? new Date().toISOString().slice(0, 10)
            ),
            endDate: String(
                body.endDate ?? new Date().toISOString().slice(0, 10)
            ),
            capacity: Number(body.capacity ?? 1),
            invitees: Array.isArray(body.invitees)
                ? (body.invitees as unknown[]).map(String)
                : [],
            customerContactRep: String(body.customerContactRep ?? ""),
            purposeForVisit: String(body.purposeForVisit ?? ""),
            visitDetails: String(body.visitDetails ?? ""),
            isDraft: Boolean(body.isDraft ?? false),
            isPrivate: Boolean(body.isPrivate ?? false),
            createdAt: now,
            updatedAt: now,
        };
    }

    private pickVisitUpdates(
        body: Record<string, unknown>
    ): Partial<VisitData> {
        const keys: (keyof VisitData)[] = [
            "productLine",
            "location",
            "city",
            "state",
            "salesRepId",
            "salesRepName",
            "domain",
            "customerId",
            "customerName",
            "customerARR",
            "customerImplementationStatus",
            "isKeyAccount",
            "startDate",
            "endDate",
            "capacity",
            "invitees",
            "customerContactRep",
            "purposeForVisit",
            "visitDetails",
            "isDraft",
            "isPrivate",
        ];
        const out: Partial<VisitData> = {};
        for (const key of keys) {
            if (body[key] === undefined) continue;
            if (key === "invitees" && Array.isArray(body.invitees)) {
                out.invitees = (body.invitees as unknown[]).map(String);
                continue;
            }
            if (key === "customerARR" || key === "capacity") {
                (out as Record<string, unknown>)[key] = Number(body[key]);
                continue;
            }
            if (
                key === "isKeyAccount" ||
                key === "isDraft" ||
                key === "isPrivate"
            ) {
                (out as Record<string, unknown>)[key] = Boolean(body[key]);
                continue;
            }
            (out as Record<string, unknown>)[key] = body[key] as
                | string
                | number
                | boolean
                | string[];
        }
        return out;
    }

    private async createVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}") as Record<
            string,
            unknown
        >;

        if (useVisitMocks()) {
            const newVisitId = `visit-${Date.now()}`;
            return this.createSuccessResponse({
                success: true,
                visitId: newVisitId,
                message: "Visit created successfully",
            });
        }

        try {
            const now = new Date().toISOString();
            const visitId =
                typeof body.visitId === "string" && body.visitId.length > 0
                    ? body.visitId
                    : `visit-${Date.now()}`;
            const data = this.buildVisitDataForCreate(body, visitId, now);
            await this.db.createVisit(data);
            return this.createSuccessResponse({
                success: true,
                visitId,
                message: "Visit created successfully",
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to create visit",
            });
        }
    }

    private async updateVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}") as Record<
            string,
            unknown
        >;
        const visitId = body.visitId;

        if (!visitId || typeof visitId !== "string") {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId is required",
            });
        }

        if (useVisitMocks()) {
            return this.createSuccessResponse({
                success: true,
                visitId,
                message: "Visit updated successfully",
            });
        }

        try {
            const { visitId: _id, ...rest } = body;
            const updates = this.pickVisitUpdates(
                rest as Record<string, unknown>
            );
            updates.updatedAt = new Date().toISOString();
            await this.db.updateVisit(visitId, updates);
            return this.createSuccessResponse({
                success: true,
                visitId,
                message: "Visit updated successfully",
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to update visit",
            });
        }
    }

    private async deleteVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const params = event.queryStringParameters;
        const visitId = params?.visitId;

        if (!visitId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId is required",
            });
        }

        if (useVisitMocks()) {
            return this.createSuccessResponse({
                success: true,
                message: "Visit deleted successfully",
            });
        }

        try {
            await this.db.deleteVisit(visitId);
            return this.createSuccessResponse({
                success: true,
                message: "Visit deleted successfully",
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error ? err.message : "Failed to delete visit",
            });
        }
    }
}
