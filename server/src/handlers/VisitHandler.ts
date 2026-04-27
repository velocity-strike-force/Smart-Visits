import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

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

        // TODO: replace mock with real DynamoDB call — this.db.getVisitById / this.db.getAllVisits
        if (visitId) {
            return this.createSuccessResponse({
                success: true,
                visit: {
                    visitId: visitId,
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
                    visitDetails: "Closed-toed shoes required. Meet in lobby at 9 AM.",
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

    private async createVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}");

        // TODO: replace mock with real DynamoDB call — this.db.createVisit(...)
        const newVisitId = `visit-${Date.now()}`;

        return this.createSuccessResponse({
            success: true,
            visitId: newVisitId,
            message: "Visit created successfully",
        });
    }

    private async updateVisit(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? "{}");
        const { visitId, ...updates } = body;

        if (!visitId) {
            return this.createErrorResponse(400, {
                success: false,
                message: "visitId is required",
            });
        }

        // TODO: replace mock with real DynamoDB call — this.db.updateVisit(visitId, updates)

        return this.createSuccessResponse({
            success: true,
            visitId,
            message: "Visit updated successfully",
        });
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

        // TODO: replace mock with real DynamoDB call — this.db.deleteVisit(visitId)

        return this.createSuccessResponse({
            success: true,
            message: "Visit deleted successfully",
        });
    }
}
