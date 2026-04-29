import { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { FeedbackHandler } from "../../src/handlers/FeedbackHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

function makeEvent(
    method: string,
    queryStringParameters?: Record<string, string>,
    body?: string
): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: `${method} /api/feedback`,
        rawPath: "/api/feedback",
        rawQueryString: "",
        headers: {},
        queryStringParameters: queryStringParameters ?? undefined,
        requestContext: {
            http: {
                method,
                path: "/api/feedback",
                protocol: "HTTP/1.1",
                sourceIp: "127.0.0.1",
                userAgent: "jest",
            },
            accountId: "123456789",
            apiId: "test",
            domainName: "localhost",
            domainPrefix: "test",
            requestId: "test-id",
            routeKey: `${method} /api/feedback`,
            stage: "$default",
            time: "27/Apr/2026:12:00:00 +0000",
            timeEpoch: 1777492800000,
        },
        body: body ?? undefined,
        isBase64Encoded: false,
    };
}

describe("FeedbackHandler", () => {
    beforeEach(() => {
        ddbMock.reset();
    });

    it("GET /api/feedback without visitId returns 400", async () => {
        const handler = new FeedbackHandler();
        const result = await handler.handleFeedbackEndpoint(makeEvent("GET"));
        expect(result.statusCode).toBe(400);
    });

    it("GET /api/feedback returns feedback for visit", async () => {
        ddbMock.on(QueryCommand).resolves({
            Items: [
                {
                    visitId: "visit-001",
                    userId: "user-001",
                    userName: "Sam",
                    role: "visitor",
                    feedbackNotes: "Great visit",
                    keyAreasOfFocus: ["Roadmap"],
                    detractors: "",
                    delighters: "Support team",
                    submittedAt: new Date().toISOString(),
                },
            ],
        });

        const handler = new FeedbackHandler();
        const result = await handler.handleFeedbackEndpoint(
            makeEvent("GET", { visitId: "visit-001" })
        );
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.feedback).toHaveLength(1);
    });

    it("POST /api/feedback writes feedback", async () => {
        ddbMock.on(PutCommand).resolves({});

        const handler = new FeedbackHandler();
        const result = await handler.handleFeedbackEndpoint(
            makeEvent(
                "POST",
                undefined,
                JSON.stringify({
                    visitId: "visit-001",
                    userId: "user-001",
                    userName: "Sam",
                    role: "visitor",
                    feedbackNotes: "Great visit",
                    keyAreasOfFocus: ["Roadmap"],
                })
            )
        );

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).success).toBe(true);
    });
});
