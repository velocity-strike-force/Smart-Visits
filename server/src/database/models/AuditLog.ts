export interface AuditLogData {
    entityId: string;
    timestamp: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entityType: string;
    userId: string;
    userName: string;
    before: Record<string, any> | null;
    after: Record<string, any> | null;
}

export class AuditLog {
    readonly entityId: string;
    readonly timestamp: Date;
    readonly action: "CREATE" | "UPDATE" | "DELETE";
    readonly entityType: string;
    readonly userId: string;
    readonly userName: string;
    readonly before: Record<string, any> | null;
    readonly after: Record<string, any> | null;

    constructor(data: AuditLogData) {
        this.entityId = data.entityId;
        this.timestamp = new Date(data.timestamp);
        this.action = data.action;
        this.entityType = data.entityType;
        this.userId = data.userId;
        this.userName = data.userName;
        this.before = data.before;
        this.after = data.after;
    }
}
