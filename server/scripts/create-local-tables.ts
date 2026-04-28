import {
    CreateTableCommand,
    DynamoDBClient,
    PutItemCommand,
    ResourceNotFoundException,
    waitUntilTableExists,
    type AttributeDefinition,
    type KeySchemaElement,
} from "@aws-sdk/client-dynamodb";
import { buildSmartVisitsTableDefinitions } from "../src/database/schema";

function createClient(): DynamoDBClient {
    const region =
        process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    const endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

    return new DynamoDBClient({
        region,
        endpoint,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakeMyKeyId",
            secretAccessKey:
                process.env.AWS_SECRET_ACCESS_KEY || "fakeSecretAccessKey",
        },
    });
}

function toKeySchema(partitionKey: string, sortKey?: string): KeySchemaElement[] {
    const keySchema: KeySchemaElement[] = [
        {
            AttributeName: partitionKey,
            KeyType: "HASH",
        },
    ];

    if (sortKey) {
        keySchema.push({
            AttributeName: sortKey,
            KeyType: "RANGE",
        });
    }

    return keySchema;
}

function toAttributeDefinitions(
    partitionKey: string,
    sortKey?: string
): AttributeDefinition[] {
    const attributes: AttributeDefinition[] = [
        {
            AttributeName: partitionKey,
            AttributeType: "S",
        },
    ];

    if (sortKey) {
        attributes.push({
            AttributeName: sortKey,
            AttributeType: "S",
        });
    }

    return attributes;
}

async function ensureTable(
    client: DynamoDBClient,
    tableName: string,
    partitionKey: string,
    sortKey?: string
): Promise<void> {
    try {
        await client.send(
            new CreateTableCommand({
                TableName: tableName,
                BillingMode: "PAY_PER_REQUEST",
                KeySchema: toKeySchema(partitionKey, sortKey),
                AttributeDefinitions: toAttributeDefinitions(partitionKey, sortKey),
            })
        );
        await waitUntilTableExists(
            { client, maxWaitTime: 30 },
            { TableName: tableName }
        );
        console.log(`Created table: ${tableName}`);
    } catch (error) {
        if (
            error &&
            typeof error === "object" &&
            "name" in error &&
            error.name === "ResourceInUseException"
        ) {
            console.log(`Table already exists: ${tableName}`);
            return;
        }
        throw error;
    }
}

async function seedSampleData(
    client: DynamoDBClient,
    stage: string
): Promise<void> {
    const shouldSeed = process.env.SEED_SAMPLE_DATA === "true";
    if (!shouldSeed) {
        return;
    }

    const nowIso = new Date().toISOString();
    const visitsTable = `${stage}-smart-visits-Visits`;
    const customersTable = `${stage}-smart-visits-Customers`;

    await client.send(
        new PutItemCommand({
            TableName: customersTable,
            Item: {
                customerId: { S: "cust-001" },
                customerName: { S: "Acme Corp" },
                arr: { N: "250000" },
                implementationStatus: { S: "Live" },
                isKeyAccount: { BOOL: true },
                domain: { S: "Manufacturing" },
                primaryContactName: { S: "John Doe" },
                primaryContactEmail: { S: "john.doe@acme.com" },
            },
        })
    );

    await client.send(
        new PutItemCommand({
            TableName: visitsTable,
            Item: {
                visitId: { S: "visit-001" },
                productLine: { S: "NetSuite" },
                location: { S: "Jacksonville, FL" },
                city: { S: "Jacksonville" },
                state: { S: "FL" },
                salesRepId: { S: "rep-001" },
                salesRepName: { S: "Jane Smith" },
                domain: { S: "ERP" },
                customerId: { S: "cust-001" },
                customerName: { S: "Acme Corp" },
                customerARR: { N: "250000" },
                customerImplementationStatus: { S: "Live" },
                isKeyAccount: { BOOL: true },
                startDate: { S: nowIso },
                endDate: { S: nowIso },
                capacity: { N: "5" },
                invitees: { L: [] },
                customerContactRep: { S: "John Doe" },
                purposeForVisit: { S: "Quarterly Business Review" },
                visitDetails: { S: "Seeded local development visit" },
                isDraft: { BOOL: false },
                isPrivate: { BOOL: false },
                createdAt: { S: nowIso },
                updatedAt: { S: nowIso },
            },
        })
    );

    console.log("Seeded sample data.");
}

async function main(): Promise<void> {
    const stage = process.env.STAGE || "dev";
    const client = createClient();

    const tableDefinitions = buildSmartVisitsTableDefinitions(stage);
    for (const definition of tableDefinitions) {
        await ensureTable(
            client,
            definition.tableName,
            definition.partitionKey.name,
            definition.sortKey?.name
        );
    }

    await seedSampleData(client, stage);
    console.log("DynamoDB local table setup complete.");
}

main().catch(async (error) => {
    if (error instanceof ResourceNotFoundException) {
        console.error(
            "DynamoDB endpoint is unreachable. Start DynamoDB Local and try again."
        );
    } else {
        console.error("Failed to set up DynamoDB local tables:", error);
    }
    process.exitCode = 1;
});
