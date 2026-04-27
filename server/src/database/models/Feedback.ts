export interface FeedbackData {
    visitId: string;
    userId: string;
    userName: string;
    role: "visitor" | "salesRep";
    feedbackNotes: string;
    keyAreasOfFocus: string[];
    detractors: string;
    delighters: string;
    submittedAt: string;
}

export class Feedback {
    readonly visitId: string;
    readonly userId: string;
    readonly userName: string;
    readonly role: "visitor" | "salesRep";
    readonly feedbackNotes: string;
    readonly keyAreasOfFocus: string[];
    readonly detractors: string;
    readonly delighters: string;
    readonly submittedAt: Date;

    constructor(data: FeedbackData) {
        this.visitId = data.visitId;
        this.userId = data.userId;
        this.userName = data.userName;
        this.role = data.role;
        this.feedbackNotes = data.feedbackNotes;
        this.keyAreasOfFocus = data.keyAreasOfFocus ?? [];
        this.detractors = data.detractors;
        this.delighters = data.delighters;
        this.submittedAt = new Date(data.submittedAt);
    }
}
