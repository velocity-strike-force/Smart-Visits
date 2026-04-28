/** Junction: user ↔ product line (many-to-many). */
export interface UserProductLineData {
    userId: string;
    productLineId: string;
    assignedAt: string;
}

export class UserProductLine {
    readonly userId: string;
    readonly productLineId: string;
    readonly assignedAt: Date;

    constructor(data: UserProductLineData) {
        this.userId = data.userId;
        this.productLineId = data.productLineId;
        this.assignedAt = new Date(data.assignedAt);
    }
}
