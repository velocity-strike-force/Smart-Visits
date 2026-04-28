export interface AuditLogData {
    entityId: string;
    timestamp: string;
    action: string;
    actorUserId?: string;
    metadata?: Record<string, unknown>;
}

export class AuditLog {
    readonly entityId: string;
    readonly timestamp: Date;
    readonly action: string;
    readonly actorUserId?: string;
    readonly metadata?: Record<string, unknown>;

    constructor(data: AuditLogData) {
        this.entityId = data.entityId;
        this.timestamp = new Date(data.timestamp);
        this.action = data.action;
        this.actorUserId = data.actorUserId;
        this.metadata = data.metadata;
    }
}
