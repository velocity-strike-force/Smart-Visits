export interface ProductLineData {
    productLineId: string;
    name: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

export class ProductLine {
    readonly productLineId: string;
    readonly name: string;
    readonly description: string;
    readonly sortOrder: number;
    readonly isActive: boolean;
    readonly createdAt: Date;

    constructor(data: ProductLineData) {
        this.productLineId = data.productLineId;
        this.name = data.name;
        this.description = data.description;
        this.sortOrder = data.sortOrder;
        this.isActive = data.isActive;
        this.createdAt = new Date(data.createdAt);
    }
}
