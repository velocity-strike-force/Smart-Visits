export interface VisitData {
    visitId: string;
    productLine: string;
    location: string;
    city: string;
    state: string;
    salesRepId: string;
    salesRepName: string;
    domain: string;
    customerId: string;
    customerName: string;
    customerARR: number;
    customerImplementationStatus: string;
    isKeyAccount: boolean;
    startDate: string;
    endDate: string;
    capacity: number;
    invitees: string[];
    customerContactRep: string;
    purposeForVisit: string;
    visitDetails: string;
    isDraft: boolean;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
}

export class Visit {
    readonly visitId: string;
    readonly productLine: string;
    readonly location: string;
    readonly city: string;
    readonly state: string;
    readonly salesRepId: string;
    readonly salesRepName: string;
    readonly domain: string;
    readonly customerId: string;
    readonly customerName: string;
    readonly customerARR: number;
    readonly customerImplementationStatus: string;
    readonly isKeyAccount: boolean;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly capacity: number;
    readonly invitees: string[];
    readonly customerContactRep: string;
    readonly purposeForVisit: string;
    readonly visitDetails: string;
    readonly isDraft: boolean;
    readonly isPrivate: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(data: VisitData) {
        this.visitId = data.visitId;
        this.productLine = data.productLine;
        this.location = data.location;
        this.city = data.city;
        this.state = data.state;
        this.salesRepId = data.salesRepId;
        this.salesRepName = data.salesRepName;
        this.domain = data.domain;
        this.customerId = data.customerId;
        this.customerName = data.customerName;
        this.customerARR = data.customerARR;
        this.customerImplementationStatus = data.customerImplementationStatus;
        this.isKeyAccount = data.isKeyAccount;
        this.startDate = new Date(data.startDate);
        this.endDate = new Date(data.endDate);
        this.capacity = data.capacity;
        this.invitees = data.invitees;
        this.customerContactRep = data.customerContactRep;
        this.purposeForVisit = data.purposeForVisit;
        this.visitDetails = data.visitDetails;
        this.isDraft = data.isDraft;
        this.isPrivate = data.isPrivate;
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
    }
}
