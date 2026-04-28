import { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
    DynamoDBDocumentClient,
    GetCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { CustomerHandler } from "../../src/handlers/CustomerHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

function makeEvent(
    method: string,
    queryStringParameters?: Record<string, string>
): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/customer`,
        rawPath: "/api/customer",
        rawQueryString: "",
        headers: {},
        queryStringParameters: queryStringParameters ?? undefined,
        requestContext: {
            http: {
                method,
                path: "/api/customer",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/customer`,
            stage: "$default",
            time: "27/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: undefined,
        isBase64Encoded: false,
    };
}

describe("CustomerHandler", () => {
    beforeEach(() => {
        ddbMock.reset();
    });

    it("GET /api/customer?customerId=... returns a single customer", async () => {
        ddbMock.on(GetCommand).resolves({
            Item: {
                customerId: "cust-001",
                customerName: "Acme Corp",
                arr: 250000,
                implementationStatus: "Live",
                isKeyAccount: true,
            },
        });

        const handler = new CustomerHandler();
        const result = await handler.handleCustomerEndpoint(
            makeEvent("GET", { customerId: "cust-001" })
        );

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).success).toBe(true);
    });

    it("GET /api/customer?q=acme returns customer list", async () => {
        ddbMock.on(ScanCommand).resolves({
            Items: [
                {
                    customerId: "cust-001",
                    customerName: "Acme Corp",
                    arr: 250000,
                },
            ],
        });

        const handler = new CustomerHandler();
        const result = await handler.handleCustomerEndpoint(
            makeEvent("GET", { q: "acme" })
        );
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.customers).toHaveLength(1);
    });
});
