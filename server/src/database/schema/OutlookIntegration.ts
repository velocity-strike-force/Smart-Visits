export interface OutlookIntegrationData {
    userId: string;
    connectedAt: string;
    updatedAt: string;
    refreshToken: string;
    accessToken: string;
    accessTokenExpiresAt: string;
    outlookUserEmail: string;
    oauthState: string;
    oauthStateExpiresAt: string;
}

export class OutlookIntegration {
    readonly userId: string;
    readonly connectedAt: Date;
    readonly updatedAt: Date;
    readonly refreshToken: string;
    readonly accessToken: string;
    readonly accessTokenExpiresAt: string;
    readonly outlookUserEmail: string;
    readonly oauthState: string;
    readonly oauthStateExpiresAt: string;

    constructor(data: OutlookIntegrationData) {
        this.userId = data.userId;
        this.connectedAt = new Date(data.connectedAt);
        this.updatedAt = new Date(data.updatedAt);
        this.refreshToken = data.refreshToken;
        this.accessToken = data.accessToken;
        this.accessTokenExpiresAt = data.accessTokenExpiresAt;
        this.outlookUserEmail = data.outlookUserEmail;
        this.oauthState = data.oauthState;
        this.oauthStateExpiresAt = data.oauthStateExpiresAt;
    }
}
