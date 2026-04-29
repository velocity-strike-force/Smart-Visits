/** JSON shapes returned by GET /api/reference-data */

export interface ReferenceCustomerDto {
    customerId: string;
    customerName: string;
    arr?: number;
    implementationStatus?: string;
    isKeyAccount?: boolean;
    domain?: string;
    primaryContactName?: string;
    primaryContactEmail?: string;
    updatedAt?: string;
}

export interface ReferenceRoleDto {
    roleId: string;
    name: string;
    description: string;
    sortOrder: number;
    createdAt: string;
}

export interface ReferenceProductLineDto {
    productLineId: string;
    name: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

export interface ReferenceDomainDto {
    domainId: string;
    name: string;
    description: string;
    sortOrder: number;
    createdAt: string;
}

export interface ReferenceDataPayload {
    customers: ReferenceCustomerDto[];
    roles: ReferenceRoleDto[];
    productLines: ReferenceProductLineDto[];
    domains: ReferenceDomainDto[];
}
