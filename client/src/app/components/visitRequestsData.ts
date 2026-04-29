export interface VisitRequest {
    id: string;
    submittedBy: string;
    department: string;
    customer: string;
    productLine: string;
    preferredTiming: string;
    notes: string;
    submittedAt: string;
}

import visitRequestsData from "../../mockapi/visitRequests.json";

export const mockVisitRequests = visitRequestsData as VisitRequest[];
