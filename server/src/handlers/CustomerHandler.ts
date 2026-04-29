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
        try {
            const params = event.queryStringParameters;
            const customerId = params?.customerId;

            if (customerId) {
                const customer = await this.db.getCustomerById(customerId);
                if (!customer) {
                    return this.createErrorResponse(404, {
                        success: false,
                        message: "Customer not found",
                    });
                }

                return this.createSuccessResponse({
                    success: true,
                    customer,
                });
            }

            const query = params?.q ?? "";
            const customers = await this.db.searchCustomers(query);

            return this.createSuccessResponse({
                success: true,
                customers,
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
