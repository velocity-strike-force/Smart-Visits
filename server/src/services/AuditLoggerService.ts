import { Dynamo } from "../database/Dynamo";
import { AuditLogData } from "../database/schema/AuditLog";

class AuditLoggerService {
    private buffer: AuditLogData[] = [];
    private db: Dynamo;

    constructor() {
        this.db = new Dynamo({});
    }

    log(entry: Omit<AuditLogData, "timestamp">): void {
        this.buffer.push({
            ...entry,
            timestamp: new Date().toISOString(),
        });
    }

    async flush(): Promise<void> {
        const entries = [...this.buffer];
        this.buffer = [];

        for (const entry of entries) {
            await this.db.putAuditLog(entry);
        }
    }

    computeDiff(
        before: Record<string, any>,
        after: Record<string, any>
    ): { before: Record<string, any>; after: Record<string, any> } {
        const diffBefore: Record<string, any> = {};
        const diffAfter: Record<string, any> = {};

        const allKeys = new Set([
            ...Object.keys(before),
            ...Object.keys(after),
        ]);
        for (const key of allKeys) {
            if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                diffBefore[key] = before[key];
                diffAfter[key] = after[key];
            }
        }

        return { before: diffBefore, after: diffAfter };
    }
}

export default new AuditLoggerService();
