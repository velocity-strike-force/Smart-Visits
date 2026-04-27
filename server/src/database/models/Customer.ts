export interface CustomerData {
    customerId: string;
    customerName: string;
    arr: number;
    implementationStatus: string;
    isKeyAccount: boolean;
    domain: string;
    primaryContactName: string;
    primaryContactEmail: string;
}

export class Customer {
    readonly customerId: string;
    readonly customerName: string;
    readonly arr: number;
    readonly implementationStatus: string;
    readonly isKeyAccount: boolean;
    readonly domain: string;
    readonly primaryContactName: string;
    readonly primaryContactEmail: string;

    constructor(data: CustomerData) {
        this.customerId = data.customerId;
        this.customerName = data.customerName;
        this.arr = data.arr;
        this.implementationStatus = data.implementationStatus;
        this.isKeyAccount = data.isKeyAccount;
        this.domain = data.domain;
        this.primaryContactName = data.primaryContactName;
        this.primaryContactEmail = data.primaryContactEmail;
    }
}
