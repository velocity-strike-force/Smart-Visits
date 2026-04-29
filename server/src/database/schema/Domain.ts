export interface DomainData {
    domainId: string;
    name: string;
    description: string;
    sortOrder: number;
    createdAt: string;
}

export class Domain {
    readonly domainId: string;
    readonly name: string;
    readonly description: string;
    readonly sortOrder: number;
    readonly createdAt: Date;

    constructor(data: DomainData) {
        this.domainId = data.domainId;
        this.name = data.name;
        this.description = data.description;
        this.sortOrder = data.sortOrder;
        this.createdAt = new Date(data.createdAt);
    }
}
