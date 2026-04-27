import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";

export class ApiGatewayLambdaHandler {
    createSuccessResponse(body: any): APIGatewayProxyResult {
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        };
    }

    createErrorResponse(statusCode: number, body: any): APIGatewayProxyResult {
        return {
            statusCode: statusCode,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(body),
        };
    }

    protected handleEndpoint(
        event: APIGatewayProxyEventV2,
        handlers: {
            [key: string]: (
                event: APIGatewayProxyEventV2
            ) => Promise<APIGatewayProxyResult>;
        }
    ) {
        try {
            const httpMethod =
                event?.requestContext?.http?.method?.toUpperCase();
            const handler = handlers[httpMethod];
            if (!handler) {
                return this.createErrorResponse(405, {
                    success: false,
                    message: `Method not allowed: ${httpMethod}`,
                });
            }
            return handler(event);
        } catch (error) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
