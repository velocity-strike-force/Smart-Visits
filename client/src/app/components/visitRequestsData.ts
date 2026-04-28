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

export const mockVisitRequests: VisitRequest[] = [
    {
        id: "REQ-1001",
        submittedBy: "Emma Davis",
        department: "Customer Success",
        customer: "Acme Corp",
        productLine: "NetSuite",
        preferredTiming: "Early May, weekdays",
        notes: "Would like to focus on inventory workflows and integrations.",
        submittedAt: "2026-04-22",
    },
    {
        id: "REQ-1002",
        submittedBy: "Noah Wilson",
        department: "Operations",
        customer: "Globex Industries",
        productLine: "TMS",
        preferredTiming: "Mid May",
        notes: "Interested in warehouse optimization use cases.",
        submittedAt: "2026-04-23",
    },
    {
        id: "REQ-1003",
        submittedBy: "Olivia Martinez",
        department: "Sales Engineering",
        customer: "Acme Corp",
        productLine: "NetSuite",
        preferredTiming: "Late May",
        notes: "Would like to observe advanced reporting workflows.",
        submittedAt: "2026-04-24",
    },
    {
        id: "REQ-1004",
        submittedBy: "Liam Brown",
        department: "Implementation",
        customer: "Northstar Foods",
        productLine: "Oracle Cloud",
        preferredTiming: "Flexible in June",
        notes: "Interested in migration planning and best practices.",
        submittedAt: "2026-04-25",
    },
    {
        id: "REQ-1005",
        submittedBy: "Sophia Clark",
        department: "Support",
        customer: "Globex Industries",
        productLine: "TMS",
        preferredTiming: "First week of June",
        notes: "Want to understand recurring support pain points on-site.",
        submittedAt: "2026-04-27",
    },
];
