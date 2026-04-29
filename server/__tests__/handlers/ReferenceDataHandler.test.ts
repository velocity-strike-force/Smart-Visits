import { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ReferenceDataHandler } from "../../src/handlers/ReferenceDataHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

function makeEvent(method: string): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/reference-data`,
        rawPath: "/api/reference-data",
        rawQueryString: "",
        headers: {},
        queryStringParameters: undefined,
        requestContext: {
            http: {
                method,
                path: "/api/reference-data",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/reference-data`,
            stage: "$default",
            time: "27/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: undefined,
        isBase64Encoded: false,
    };
}

describe("ReferenceDataHandler", () => {
    beforeEach(() => {
        ddbMock.reset();
    });

    it("GET /api/reference-data aggregates four tables", async () => {
        ddbMock.on(ScanCommand).callsFake((input) => {
            const name = input.TableName ?? "";
            if (name.includes("Customers")) {
                return Promise.resolve({
                    Items: [
                        {
                            customerId: "cust-1",
                            customerName: "Beta Co",
                            arr: 100000,
                        },
                        {
                            customerId: "cust-2",
                            customerName: "Alpha Inc",
                        },
                    ],
                });
            }
            if (name.includes("Roles")) {
                return Promise.resolve({
                    Items: [
                        {
                            roleId: "role-1",
                            name: "Rep",
                            description: "Sales",
                            sortOrder: 1,
                            createdAt: "2026-01-01T00:00:00.000Z",
                        },
                    ],
                });
            }
            if (name.includes("ProductLines")) {
                return Promise.resolve({
                    Items: [
                        {
                            productLineId: "pl-1",
                            name: "NetSuite",
                            description: "ERP",
                            sortOrder: 0,
                            isActive: true,
                            createdAt: "2026-01-01T00:00:00.000Z",
                        },
                    ],
                });
            }
            if (name.includes("ReferenceData")) {
                return Promise.resolve({
                    Items: [
                        {
                            domainId: "dom-1",
                            name: "Manufacturing",
                            description: "Mfg",
                            sortOrder: 0,
                            createdAt: "2026-01-01T00:00:00.000Z",
                        },
                    ],
                });
            }
            return Promise.resolve({ Items: [] });
        });

        const handler = new ReferenceDataHandler();
        const result = await handler.handleReferenceDataEndpoint(
            makeEvent("GET")
        );
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.customers).toHaveLength(2);
        expect(body.customers[0].customerName).toBe("Alpha Inc");
        expect(body.roles).toHaveLength(1);
        expect(body.productLines).toHaveLength(1);
        expect(body.domains).toHaveLength(1);
    });
});
