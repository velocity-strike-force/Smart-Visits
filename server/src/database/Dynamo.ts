import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    QueryCommand,
    ScanCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { smartVisitsTables } from "./schema";
import { Visit, type VisitData } from "./schema/Visit";
import { User, type UserData } from "./schema/User";
import { Signup, type SignupData } from "./schema/Signup";
import { Feedback, type FeedbackData } from "./schema/Feedback";
import { Customer, type CustomerData } from "./schema/Customer";
import { AuditLog, type AuditLogData } from "./schema/AuditLog";
import { Role, type RoleData } from "./schema/Role";
import { ProductLine, type ProductLineData } from "./schema/ProductLine";
import { UserProductLine, type UserProductLineData } from "./schema/UserProductLine";
import { Domain, type DomainData } from "./schema/Domain";
import {
    CalendarEventLink,
    type CalendarEventLinkData,
} from "./schema/CalendarEventLink";
import {
    OutlookIntegration,
    type OutlookIntegrationData,
} from "./schema/OutlookIntegration";

export class Dynamo {
    private readonly client: DynamoDBDocumentClient;

    private readonly tables = smartVisitsTables(process.env.STAGE || "dev");

    constructor(ctorParams: { client?: DynamoDBDocumentClient }) {
        const { client } = ctorParams;
        if (client) {
            this.client = client;
        } else {
            const region =
                process.env.AWS_REGION ||
                process.env.AWS_DEFAULT_REGION ||
                "us-east-1";
            const isLocalDynamo = Boolean(process.env.DYNAMODB_ENDPOINT);
            const dynamoClient = new DynamoDBClient({
                region,
                ...(isLocalDynamo && {
                    endpoint: process.env.DYNAMODB_ENDPOINT,
                    credentials: {
                        accessKeyId:
                            process.env.AWS_ACCESS_KEY_ID || "local-access-key",
                        secretAccessKey:
                            process.env.AWS_SECRET_ACCESS_KEY || "local-secret-key",
                    },
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

    async getAllUsersWithEmailNotifications(): Promise<User[]> {
        let items: Array<Record<string, unknown>> = [];
        let startKey: Record<string, unknown> | undefined;

        do {
            const command = new ScanCommand({
                TableName: this.tables.users,
                FilterExpression: "emailNotifications = :enabled",
                ExpressionAttributeValues: {
                    ":enabled": true,
                },
                ExclusiveStartKey: startKey,
            });
            const result = await this.client.send(command);
            if (result.Items) {
                items.push(...(result.Items as Record<string, unknown>[]));
            }
            startKey = result.LastEvaluatedKey as
                | Record<string, unknown>
                | undefined;
        } while (startKey);

        return items.map((item) => new User(item as unknown as UserData));
    }

    // ── Roles ───────────────────────────────────────────────

    async getRoleById(roleId: string): Promise<Role | undefined> {
        const command = new GetCommand({
            TableName: this.tables.roles,
            Key: { roleId },
        });
        const result = await this.client.send(command);
        return result.Item ? new Role(result.Item as RoleData) : undefined;
    }

    async putRole(data: RoleData): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tables.roles,
                Item: data,
            })
        );
    }

    // ── Product lines ───────────────────────────────────────

    async getProductLineById(
        productLineId: string
    ): Promise<ProductLine | undefined> {
        const command = new GetCommand({
            TableName: this.tables.productLines,
            Key: { productLineId },
        });
        const result = await this.client.send(command);
        return result.Item
            ? new ProductLine(result.Item as ProductLineData)
            : undefined;
    }

    async putProductLine(data: ProductLineData): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tables.productLines,
                Item: data,
            })
        );
    }

    async getAllRoles(): Promise<Role[]> {
        const items = await this.scanTable(this.tables.roles);
        return items.map((i) => new Role(i as unknown as RoleData));
    }

    async getAllProductLines(): Promise<ProductLine[]> {
        const items = await this.scanTable(this.tables.productLines);
        return items.map(
            (i) => new ProductLine(i as unknown as ProductLineData)
        );
    }

    async getAllDomains(): Promise<Domain[]> {
        const items = await this.scanTable(this.tables.referenceData);
        return items.map((i) => new Domain(i as unknown as DomainData));
    }

    async getDomainById(domainId: string): Promise<Domain | undefined> {
        const command = new GetCommand({
            TableName: this.tables.referenceData,
            Key: { domainId },
        });
        const result = await this.client.send(command);
        return result.Item
            ? new Domain(result.Item as DomainData)
            : undefined;
    }

    async putDomain(data: DomainData): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tables.referenceData,
                Item: data,
            })
        );
    }

    // ── User ↔ product line (junction) ──────────────────────

    async getUserProductLines(userId: string): Promise<UserProductLine[]> {
        const command = new QueryCommand({
            TableName: this.tables.userProductLines,
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: { ":uid": userId },
        });
        const result = await this.client.send(command);
        return (result.Items ?? []).map(
            (i) => new UserProductLine(i as UserProductLineData)
        );
    }

    async putUserProductLine(data: UserProductLineData): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tables.userProductLines,
                Item: data,
            })
        );
    }

    async deleteUserProductLine(
        userId: string,
        productLineId: string
    ): Promise<void> {
        await this.client.send(
            new DeleteCommand({
                TableName: this.tables.userProductLines,
                Key: { userId, productLineId },
            })
        );
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

    // ── Outlook integrations ────────────────────────────────

    async getOutlookIntegrationByUserId(
        userId: string
    ): Promise<OutlookIntegration | undefined> {
        const command = new GetCommand({
            TableName: this.tables.outlookIntegrations,
            Key: { userId },
        });
        const result = await this.client.send(command);
        return result.Item
            ? new OutlookIntegration(result.Item as OutlookIntegrationData)
            : undefined;
    }

    async putOutlookIntegration(data: OutlookIntegrationData): Promise<void> {
        const command = new PutCommand({
            TableName: this.tables.outlookIntegrations,
            Item: data,
        });
        await this.client.send(command);
    }

    async deleteOutlookIntegration(userId: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: this.tables.outlookIntegrations,
            Key: { userId },
        });
        await this.client.send(command);
    }

    // ── Calendar event links ────────────────────────────────

    async getCalendarEventLink(
        visitId: string,
        userId: string
    ): Promise<CalendarEventLink | undefined> {
        const command = new GetCommand({
            TableName: this.tables.calendarEventLinks,
            Key: { visitId, userId },
        });
        const result = await this.client.send(command);
        return result.Item
            ? new CalendarEventLink(result.Item as CalendarEventLinkData)
            : undefined;
    }

    async getCalendarEventLinksForVisit(
        visitId: string
    ): Promise<CalendarEventLink[]> {
        const command = new QueryCommand({
            TableName: this.tables.calendarEventLinks,
            KeyConditionExpression: "visitId = :visitId",
            ExpressionAttributeValues: {
                ":visitId": visitId,
            },
        });
        const result = await this.client.send(command);
        return (result.Items ?? []).map(
            (item) => new CalendarEventLink(item as CalendarEventLinkData)
        );
    }

    async getCalendarEventLinksForUser(
        userId: string
    ): Promise<CalendarEventLink[]> {
        let items: Record<string, unknown>[] = [];
        let startKey: Record<string, unknown> | undefined;

        do {
            const command = new ScanCommand({
                TableName: this.tables.calendarEventLinks,
                FilterExpression: "userId = :userId",
                ExpressionAttributeValues: {
                    ":userId": userId,
                },
                ExclusiveStartKey: startKey,
            });
            const result = await this.client.send(command);
            if (result.Items) {
                items.push(...(result.Items as Record<string, unknown>[]));
            }
            startKey = result.LastEvaluatedKey as
                | Record<string, unknown>
                | undefined;
        } while (startKey);

        return items.map(
            (item) => new CalendarEventLink(item as unknown as CalendarEventLinkData)
        );
    }

    async putCalendarEventLink(data: CalendarEventLinkData): Promise<void> {
        const command = new PutCommand({
            TableName: this.tables.calendarEventLinks,
            Item: data,
        });
        await this.client.send(command);
    }

    async deleteCalendarEventLink(visitId: string, userId: string): Promise<void> {
        const command = new DeleteCommand({
            TableName: this.tables.calendarEventLinks,
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

    async getAllCustomers(): Promise<Customer[]> {
        const items = await this.scanTable(this.tables.customers);
        return items.map((i) => new Customer(i as unknown as CustomerData));
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

    private async scanTable(
        tableName: string
    ): Promise<Record<string, unknown>[]> {
        let items: Record<string, unknown>[] = [];
        let startKey: Record<string, unknown> | undefined;
        do {
            const command = new ScanCommand({
                TableName: tableName,
                ExclusiveStartKey: startKey,
            });
            const result = await this.client.send(command);
            if (result.Items) {
                items.push(...(result.Items as Record<string, unknown>[]));
            }
            startKey = result.LastEvaluatedKey as
                | Record<string, unknown>
                | undefined;
        } while (startKey);
        return items;
    }
}
