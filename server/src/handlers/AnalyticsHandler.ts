import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

export class AnalyticsHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
    }

    async handleAnalyticsEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getAnalytics.bind(this),
        });
    }

    private async getAnalytics(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const params = event.queryStringParameters;
        const reportType = params?.report ?? "summary";

        // TODO: replace mock with real aggregation queries against DynamoDB
        return this.createSuccessResponse({
            success: true,
            report: reportType,
            data: {
                topCustomersByVisitCount: [
                    { customerName: "Acme Corp", visitCount: 8 },
                    { customerName: "Globex Industries", visitCount: 6 },
                    { customerName: "Initech", visitCount: 5 },
                    { customerName: "Umbrella Corp", visitCount: 4 },
                    { customerName: "Stark Industries", visitCount: 3 },
                ],
                topSalesRepsByVisitCount: [
                    { salesRepName: "Jane Smith", visitCount: 12 },
                    { salesRepName: "Bob Johnson", visitCount: 9 },
                    { salesRepName: "Carol Williams", visitCount: 7 },
                ],
                totalVisits: 45,
                totalVisitsThisQuarter: 15,
                leastVisitedCustomers: [
                    { customerName: "Wayne Enterprises", lastVisitDate: "2025-08-10", visitCount: 1 },
                    { customerName: "Cyberdyne Systems", lastVisitDate: "2025-06-22", visitCount: 1 },
                ],
            },
        });
    }
}
