import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";

/** Resolve HTTP method from REST (v1), HTTP API (v2), or minimal/test payloads. */
function resolveHttpMethod(event: APIGatewayProxyEventV2): string | undefined {
    const e = event as APIGatewayProxyEventV2 & {
        httpMethod?: string;
        routeKey?: string;
    };
    const fromV1 = e.httpMethod?.trim();
    const fromV2 = e.requestContext?.http?.method?.trim();
    if (fromV1) return fromV1.toUpperCase();
    if (fromV2) return fromV2.toUpperCase();

    if (typeof e.routeKey === "string" && e.routeKey.length > 0) {
        const token = e.routeKey.split(/\s+/)[0]?.toUpperCase();
        if (
            token &&
            /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/i.test(token)
        ) {
            return token;
        }
    }
    return undefined;
}

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

    protected async handleEndpoint(
        event: APIGatewayProxyEventV2,
        handlers: {
            [key: string]: (
                event: APIGatewayProxyEventV2
            ) => Promise<APIGatewayProxyResult>;
        }
    ): Promise<APIGatewayProxyResult> {
        try {
            const httpMethod = resolveHttpMethod(event);
            const handler = httpMethod ? handlers[httpMethod] : undefined;
            if (!handler) {
                return this.createErrorResponse(405, {
                    success: false,
                    message: `Method not allowed: ${httpMethod ?? "unknown"}`,
                });
            }
            return await handler(event);
        } catch (error) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
