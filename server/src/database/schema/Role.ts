export interface RoleData {
    roleId: string;
    name: string;
    description: string;
    sortOrder: number;
    createdAt: string;
}

export class Role {
    readonly roleId: string;
    readonly name: string;
    readonly description: string;
    readonly sortOrder: number;
    readonly createdAt: Date;

    constructor(data: RoleData) {
        this.roleId = data.roleId;
        this.name = data.name;
        this.description = data.description;
        this.sortOrder = data.sortOrder;
        this.createdAt = new Date(data.createdAt);
    }
}
