import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    QueryCommand,
    ScanCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { Visit, VisitData } from "./models/Visit";
import { User, UserData } from "./models/User";
import { Signup, SignupData } from "./models/Signup";
import { Feedback, FeedbackData } from "./models/Feedback";
import { Customer, CustomerData } from "./models/Customer";
import { AuditLog, AuditLogData } from "./models/AuditLog";
import { smartVisitsTables } from "./schema";

export class Dynamo {
    private readonly client: DynamoDBDocumentClient;

    private readonly tables = smartVisitsTables(process.env.STAGE || "dev");

    constructor(ctorParams: { client?: DynamoDBDocumentClient }) {
        const { client } = ctorParams;
        if (client) {
            this.client = client;
        } else {
            const dynamoClient = new DynamoDBClient({
                ...(process.env.DYNAMODB_ENDPOINT && {
                    endpoint: process.env.DYNAMODB_ENDPOINT,
                }),
            });
            this.client = DynamoDBDocumentClient.from(dynamoClient);
        }
    }

    // ── Visits ───────────────────────────────────────────────

    async getVisitById(visitId: string): Promise<Visit | undefined> {
        const command = new GetCommand({
            TableName: this.tables.visits,
            Key: { visitId },
        });
        const result = await this.client.send(command);
        return result.Item ? new Visit(result.Item as VisitData) : undefined;
    }

    async getAllVisits(): Promise<Visit[]> {
        let items: Array<Record<string, any>> = [];
        let startKey: Record<string, any> | undefined;
        do {
            const command = new ScanCommand({
                TableName: this.tables.visits,
                ExclusiveStartKey: startKey,
            });
            const result = await this.client.send(command);
            if (result.Items) items.push(...result.Items);
            startKey = result.LastEvaluatedKey;
        } while (startKey);
        return items.map((item) => new Visit(item as VisitData));
    }

    async queryVisitsByMonth(
        year: number,
        month: number
    ): Promise<Visit[]> {
        // TODO: Add a GSI on startDate for efficient month-range queries.
        // For now, scan and filter client-side.
        const all = await this.getAllVisits();
        return all.filter((v) => {
            return (
                v.startDate.getFullYear() === year &&
                v.startDate.getMonth() + 1 === month
            );
        });
    }

    async createVisit(data: VisitData): Promise<void> {
        const command = new PutCommand({
            TableName: this.tables.visits,
            Item: data,
        });
        await this.client.send(command);
    }

    async updateVisit(
        visitId: string,
        updates: Partial<VisitData>
    ): Promise<void> {
        const expressionParts: string[] = [];
        const names: Record<string, string> = {};
        const values: Record<string, any> = {};

        Object.entries(updates).forEach(([key, value], i) => {
            if (key === "visitId") return;
            const alias = `#f${i}`;
            const valAlias = `:v${i}`;
            expressionParts.push(`${alias} = ${valAlias}`);
            names[alias] = key;
            values[valAlias] = value;
        });

        if (expressionParts.length === 0) return;

        const command = new UpdateCommand({
            TableName: this.tables.visits,
            Key: { visitId },
            UpdateExpression: `SET ${expressionParts.join(", ")}`,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
        });
        await this.client.send(command);
    }

    async deleteVisit(visitId: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: this.tables.visits,
            Key: { visitId },
        });
        await this.client.send(command);
    }

    // ── Users (Profiles) ────────────────────────────────────

    async getUserById(userId: string): Promise<User | undefined> {
        const command = new GetCommand({
            TableName: this.tables.users,
            Key: { userId },
        });
        const result = await this.client.send(command);
        return result.Item ? new User(result.Item as UserData) : undefined;
    }

    async createOrUpdateUser(data: UserData): Promise<void> {
        const command = new PutCommand({
            TableName: this.tables.users,
            Item: data,
        });
        await this.client.send(command);
    }

    // ── Signups ─────────────────────────────────────────────

    async getSignupsForVisit(visitId: string): Promise<Signup[]> {
        const command = new QueryCommand({
            TableName: this.tables.signups,
            KeyConditionExpression: "visitId = :vid",
            ExpressionAttributeValues: { ":vid": visitId },
        });
        const result = await this.client.send(command);
        return (result.Items ?? []).map((i) => new Signup(i as SignupData));
    }

    async putSignup(data: SignupData): Promise<void> {
        const command = new PutCommand({
            TableName: this.tables.signups,
            Item: data,
        });
        await this.client.send(command);
    }

    async deleteSignup(visitId: string, userId: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: this.tables.signups,
            Key: { visitId, userId },
        });
        await this.client.send(command);
    }

    // ── Feedback ────────────────────────────────────────────

    async getFeedbackForVisit(visitId: string): Promise<Feedback[]> {
        const command = new QueryCommand({
            TableName: this.tables.feedback,
            KeyConditionExpression: "visitId = :vid",
            ExpressionAttributeValues: { ":vid": visitId },
        });
        const result = await this.client.send(command);
        return (result.Items ?? []).map(
            (i) => new Feedback(i as FeedbackData)
        );
    }

    async putFeedback(data: FeedbackData): Promise<void> {
        const command = new PutCommand({
            TableName: this.tables.feedback,
            Item: data,
        });
        await this.client.send(command);
    }

    // ── Customers ───────────────────────────────────────────

    async searchCustomers(query: string): Promise<Customer[]> {
        const command = new ScanCommand({
            TableName: this.tables.customers,
            FilterExpression: "contains(customerName, :q)",
            ExpressionAttributeValues: { ":q": query },
        });
        const result = await this.client.send(command);
        return (result.Items ?? []).map(
            (i) => new Customer(i as CustomerData)
        );
    }

    async getCustomerById(
        customerId: string
    ): Promise<Customer | undefined> {
        const command = new GetCommand({
            TableName: this.tables.customers,
            Key: { customerId },
        });
        const result = await this.client.send(command);
        return result.Item
            ? new Customer(result.Item as CustomerData)
            : undefined;
    }

    // ── Audit Log ───────────────────────────────────────────

    async putAuditLog(data: AuditLogData): Promise<void> {
        const command = new PutCommand({
            TableName: this.tables.auditLog,
            Item: data,
        });
        await this.client.send(command);
    }

    async getAuditLogsForEntity(entityId: string): Promise<AuditLog[]> {
        const command = new QueryCommand({
            TableName: this.tables.auditLog,
            KeyConditionExpression: "entityId = :eid",
            ExpressionAttributeValues: { ":eid": entityId },
        });
        const result = await this.client.send(command);
        return (result.Items ?? []).map(
            (i) => new AuditLog(i as AuditLogData)
        );
    }
}
