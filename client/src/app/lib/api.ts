const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiVisit {
    id?: string;
    visitId?: string;
    title?: string;
    customer?: string;
    customerName?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    productLine?: string;
    location?: string;
    arr?: number;
    customerARR?: number;
    salesRep?: string;
    salesRepName?: string;
    domain?: string;
    isDraft?: boolean;
    capacity?: number;
    currentAttendees?: number;
    invitees?: string[];
}

interface VisitListResponse {
    success?: boolean;
    visits?: ApiVisit[];
}

function getApiUrl(path: string) {
    if (!API_URL) {
        throw new Error(
            "Missing VITE_API_BASE_URL. Add it to client/.env and restart the dev server.",
        );
    }

    return `${API_URL.replace(/\/$/, "")}${path}`;
}

export async function getVisits(): Promise<ApiVisit[]> {
    const response = await fetch(getApiUrl("/dev/visit"));

    if (!response.ok) {
        throw new Error(`Failed to load visits (${response.status})`);
    }

    const data = (await response.json()) as VisitListResponse;
    return data.visits ?? [];
}

export interface CreateVisitPayload {
    productLine: string;
    location: string;
    salesRepName: string;
    domain: string;
    customerName: string;
    startDate: string;
    endDate: string;
    capacity: number;
    invitees: string[];
    customerContactRep: string;
    purposeForVisit: string;
    visitDetails: string;
    isDraft: boolean;
    isPrivate: boolean;
}

export interface CreateVisitResponse {
    success: boolean;
    visitId?: string;
    message?: string;
}

export async function createVisit(
    payload: CreateVisitPayload,
): Promise<CreateVisitResponse> {
    const response = await fetch(getApiUrl("/dev/visit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to create visit (${response.status})`);
    }

    return (await response.json()) as CreateVisitResponse;
}
