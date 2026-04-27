import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

export class CustomerHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
    }

    async handleCustomerEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.searchCustomers.bind(this),
        });
    }

    private async searchCustomers(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        const query = event.queryStringParameters?.q ?? "";

        // TODO: replace mock with real DynamoDB call — this.db.searchCustomers(query)
        const allMockCustomers = [
            {
                customerId: "cust-001",
                customerName: "Acme Corp",
                arr: 250000,
                implementationStatus: "Live",
                isKeyAccount: true,
                domain: "Manufacturing",
                primaryContactName: "John Doe",
                primaryContactEmail: "john.doe@acme.com",
            },
            {
                customerId: "cust-002",
                customerName: "Globex Industries",
                arr: 180000,
                implementationStatus: "Implementing",
                isKeyAccount: false,
                domain: "Distribution",
                primaryContactName: "Hank Scorpio",
                primaryContactEmail: "hank@globex.com",
            },
            {
                customerId: "cust-003",
                customerName: "Initech",
                arr: 95000,
                implementationStatus: "Live",
                isKeyAccount: false,
                domain: "Retail",
                primaryContactName: "Bill Lumbergh",
                primaryContactEmail: "bill@initech.com",
            },
        ];

        const filtered = query
            ? allMockCustomers.filter((c) =>
                  c.customerName.toLowerCase().includes(query.toLowerCase())
              )
            : allMockCustomers;

        return this.createSuccessResponse({
            success: true,
            customers: filtered,
        });
    }
}
