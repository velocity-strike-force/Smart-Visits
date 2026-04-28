export interface UserData {
    userId: string;
    /** FK → `{env}-smart-visits-Roles`. */
    roleId?: string;
    name: string;
    email: string;
    /** Denormalized labels; prefer `UserProductLines` + `ProductLines` for source of truth. */
    productLines: string[];
    city: string;
    state: string;
    emailNotifications: boolean;
    slackNotifications: boolean;
    proximityAlerts: boolean;
    proximityDistanceMiles: number;
    createdAt: string;
    updatedAt: string;
}

export class User {
    readonly userId: string;
    readonly roleId?: string;
    readonly name: string;
    readonly email: string;
    readonly productLines: string[];
    readonly city: string;
    readonly state: string;
    readonly emailNotifications: boolean;
    readonly slackNotifications: boolean;
    readonly proximityAlerts: boolean;
    readonly proximityDistanceMiles: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(data: UserData) {
        this.userId = data.userId;
        this.roleId = data.roleId;
        this.name = data.name;
        this.email = data.email;
        this.productLines = data.productLines;
        this.city = data.city;
        this.state = data.state;
        this.emailNotifications = data.emailNotifications;
        this.slackNotifications = data.slackNotifications;
        this.proximityAlerts = data.proximityAlerts;
        this.proximityDistanceMiles = data.proximityDistanceMiles;
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
    }
}
