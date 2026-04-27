export interface SignupData {
    visitId: string;
    userId: string;
    userName: string;
    userEmail: string;
    signedUpAt: string;
}

export class Signup {
    readonly visitId: string;
    readonly userId: string;
    readonly userName: string;
    readonly userEmail: string;
    readonly signedUpAt: Date;

    constructor(data: SignupData) {
        this.visitId = data.visitId;
        this.userId = data.userId;
        this.userName = data.userName;
        this.userEmail = data.userEmail;
        this.signedUpAt = new Date(data.signedUpAt);
    }
}
