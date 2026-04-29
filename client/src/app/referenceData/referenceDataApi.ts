import mockCustomers from "../../mockapi/postVisitCustomers.json";
import { getVisitsDataSourceMode, getVisitApiBaseUrl } from "../visits/visitSourceConfig";

export interface CustomerReference {
    customerId: string;
    customerName: string;
    arr: number;
    implementationStatus: string;
    isKeyAccount: boolean;
    domain: string;
    primaryContactName: string;
    primaryContactEmail: string;
}

export interface RoleReference {
    roleId: string;
    name: string;
    description: string;
    sortOrder: number;
    createdAt: string;
}

export interface ProductLineReference {
    productLineId: string;
    name: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

export interface DomainReference {
    domainId: string;
    name: string;
    description: string;
    sortOrder: number;
    createdAt: string;
}

export interface ReferenceData {
    customers: CustomerReference[];
    roles: RoleReference[];
    productLines: ProductLineReference[];
    domains: DomainReference[];
}

interface ReferenceDataResponse extends Partial<ReferenceData> {
    success?: boolean;
}

const fallbackProductLines: ProductLineReference[] = [
    "Oracle Cloud",
    "NetSuite",
    "Shipping",
    "TMS",
    "Demand Planning",
    "AX",
].map((name, index) => ({
    productLineId: `mock-product-line-${index}`,
    name,
    description: "",
    sortOrder: index,
    isActive: true,
    createdAt: "",
}));

const fallbackDomains: DomainReference[] = [
    "Manufacturing",
    "Technology",
    "Logistics",
    "Retail",
    "Healthcare",
].map((name, index) => ({
    domainId: `mock-domain-${index}`,
    name,
    description: "",
    sortOrder: index,
    createdAt: "",
}));

const fallbackRoles: RoleReference[] = [
    {
        roleId: "mock-sales-rep",
        name: "Sales Rep",
        description: "",
        sortOrder: 0,
        createdAt: "",
    },
    {
        roleId: "mock-visitor",
        name: "Visitor",
        description: "",
        sortOrder: 1,
        createdAt: "",
    },
];

export const fallbackReferenceData: ReferenceData = {
    customers: mockCustomers.map((customer, index) => ({
        customerId: `mock-customer-${index}`,
        customerName: customer.name,
        arr: customer.arr,
        implementationStatus: customer.status,
        isKeyAccount: customer.isKeyAccount,
        domain: "",
        primaryContactName: "",
        primaryContactEmail: "",
    })),
    roles: fallbackRoles,
    productLines: fallbackProductLines,
    domains: fallbackDomains,
};

function apiUrl(path: string): string {
    const base = getVisitApiBaseUrl();
    const p = path.startsWith("/") ? path : `/${path}`;
    return base ? `${base}${p}` : p;
}

function bySortOrderThenName<T extends { sortOrder?: number; name: string }>(
    a: T,
    b: T,
) {
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name);
}

export function normalizeReferenceData(data: ReferenceDataResponse): ReferenceData {
    return {
        customers: [...(data.customers ?? [])].sort((a, b) =>
            a.customerName.localeCompare(b.customerName),
        ),
        roles: [...(data.roles ?? [])].sort(bySortOrderThenName),
        productLines: [...(data.productLines ?? [])]
            .filter((productLine) => productLine.isActive !== false)
            .sort(bySortOrderThenName),
        domains: [...(data.domains ?? [])].sort(bySortOrderThenName),
    };
}

export async function loadReferenceDataFromApi(): Promise<ReferenceData> {
    const response = await fetch(apiUrl("/dev/dev-smart-visits-referenceData"));
    if (!response.ok) {
        throw new Error(`Reference data request failed (${response.status})`);
    }

    const body = (await response.json()) as ReferenceDataResponse;
    if (!body.success) {
        throw new Error("Invalid reference data response");
    }

    return normalizeReferenceData(body);
}

export function shouldLoadReferenceDataFromApi(): boolean {
    return getVisitsDataSourceMode() === "api";
}
