export interface CalendarEventLinkData {
    visitId: string;
    userId: string;
    eventId: string;
    webLink: string;
    createdAt: string;
    updatedAt: string;
}

export class CalendarEventLink {
    readonly visitId: string;
    readonly userId: string;
    readonly eventId: string;
    readonly webLink: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(data: CalendarEventLinkData) {
        this.visitId = data.visitId;
        this.userId = data.userId;
        this.eventId = data.eventId;
        this.webLink = data.webLink;
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
    }
}
