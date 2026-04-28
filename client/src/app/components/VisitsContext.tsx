import { createContext, useContext, useState, ReactNode } from "react";

export interface Visit {
    id: string;
    title: string;
    customer: string;
    date: Date;
    productLine: string;
    location: string;
    arr: number;
    salesRep: string;
    domain: string;
    isDraft?: boolean;
    capacity: number;
    attendees: string[];
    creatorEmail: string;
    endDate?: Date;
    customerContact?: string;
    purpose?: string;
    details?: string;
    isPrivate?: boolean;
}

interface VisitsContextType {
    visits: Visit[];
    addAttendee: (visitId: string, attendeeName: string) => void;
    removeAttendee: (visitId: string, attendeeName: string) => void;
    getVisit: (visitId: string) => Visit | undefined;
}

const VisitsContext = createContext<VisitsContextType | undefined>(undefined);

const mockVisits: Visit[] = [
    {
        id: "1",
        title: "Q2 Executive Briefing",
        customer: "Acme Corp",
        date: new Date(2026, 0, 14),
        endDate: new Date(2026, 0, 14),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 320000,
        salesRep: "John Smith",
        domain: "Manufacturing",
        capacity: 10,
        attendees: [
            "Sarah Williams",
            "Mike Johnson",
            "Emily Davis",
            "David Brown",
        ],
        creatorEmail: "john.smith@rfsmart.com",
        customerContact: "Bob Anderson",
        purpose: "Executive Briefing",
        details: "Meet at building 2 lobby at 9:00 AM.",
        isPrivate: false,
        isDraft: false,
    },
    {
        id: "2",
        title: "Cloud Migration Discovery",
        customer: "TechStart Inc",
        date: new Date(2026, 1, 6),
        productLine: "Oracle Cloud",
        location: "Miami, FL",
        arr: 180000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        isDraft: true,
        capacity: 8,
        attendees: [],
        creatorEmail: "jane.doe@rfsmart.com",
    },
    {
        id: "3",
        title: "Warehouse Optimization Visit",
        customer: "Global Logistics",
        date: new Date(2026, 1, 19),
        productLine: "TMS",
        location: "Tampa, FL",
        arr: 520000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        capacity: 5,
        attendees: [
            "John Smith",
            "Sarah Williams",
            "Emily Davis",
            "David Brown",
            "Lisa Anderson",
        ],
        creatorEmail: "mike.johnson@rfsmart.com",
    },
    {
        id: "4",
        title: "Shipping Workflow Training",
        customer: "RetailMax",
        date: new Date(2026, 2, 5),
        productLine: "Shipping",
        location: "Orlando, FL",
        arr: 180000,
        salesRep: "Sarah Williams",
        domain: "Counting",
        capacity: 12,
        attendees: [
            "Mike Johnson",
            "Emily Davis",
            "David Brown",
            "Lisa Anderson",
            "Robert Taylor",
            "Jennifer Wilson",
            "Thomas Moore",
            "Amanda Clark",
        ],
        creatorEmail: "sarah.williams@rfsmart.com",
    },
    {
        id: "5",
        title: "Floor Operations Review",
        customer: "Acme Corp",
        date: new Date(2026, 2, 18),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 320000,
        salesRep: "John Smith",
        domain: "Manufacturing",
        capacity: 8,
        attendees: ["Emily Davis", "David Brown", "Lisa Anderson"],
        creatorEmail: "john.smith@rfsmart.com",
    },
    {
        id: "6",
        title: "Customer Enablement Workshop",
        customer: "Northstar Foods",
        date: new Date(2026, 2, 26),
        productLine: "Oracle Cloud",
        location: "Nashville, TN",
        arr: 275000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        capacity: 9,
        attendees: [
            "Sarah Williams",
            "Mike Johnson",
            "Amanda Clark",
            "Thomas Moore",
        ],
        creatorEmail: "jane.doe@rfsmart.com",
    },
    {
        id: "7",
        title: "Capacity Planning Session",
        customer: "Global Logistics",
        date: new Date(2026, 3, 3),
        productLine: "TMS",
        location: "Tampa, FL",
        arr: 520000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        capacity: 10,
        attendees: [
            "John Smith",
            "Emily Davis",
            "David Brown",
            "Lisa Anderson",
        ],
        creatorEmail: "mike.johnson@rfsmart.com",
    },
    {
        id: "8",
        title: "Post Go-Live Check-in",
        customer: "Bluewave Energy",
        date: new Date(2026, 3, 9),
        productLine: "NetSuite",
        location: "Houston, TX",
        arr: 240000,
        salesRep: "Alex Rivera",
        domain: "Manufacturing",
        capacity: 6,
        attendees: ["Sarah Williams", "Robert Taylor"],
        creatorEmail: "alex.rivera@rfsmart.com",
    },
    {
        id: "9",
        title: "Distribution Center Walkthrough",
        customer: "RetailMax",
        date: new Date(2026, 3, 17),
        productLine: "Shipping",
        location: "Orlando, FL",
        arr: 180000,
        salesRep: "Sarah Williams",
        domain: "Counting",
        capacity: 10,
        attendees: ["Emily Davis", "David Brown", "Amanda Clark"],
        creatorEmail: "sarah.williams@rfsmart.com",
    },
    {
        id: "10",
        title: "Executive Steering Committee",
        customer: "Acme Corp",
        date: new Date(2026, 3, 23),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 320000,
        salesRep: "Sarah Williams",
        domain: "Manufacturing",
        capacity: 12,
        attendees: [
            "John Smith",
            "Mike Johnson",
            "Emily Davis",
            "Robert Taylor",
            "Jennifer Wilson",
        ],
        creatorEmail: "sarah.williams@rfsmart.com",
    },
    {
        id: "11",
        title: "KPI Alignment Review",
        customer: "Northstar Foods",
        date: new Date(2026, 4, 2),
        productLine: "Oracle Cloud",
        location: "Nashville, TN",
        arr: 275000,
        salesRep: "Jane Doe",
        domain: "Inbound",
        capacity: 7,
        attendees: ["Lisa Anderson", "Thomas Moore", "Amanda Clark"],
        creatorEmail: "jane.doe@rfsmart.com",
    },
    {
        id: "12",
        title: "Network Expansion Discovery",
        customer: "Globex Industries",
        date: new Date(2026, 4, 11),
        productLine: "TMS",
        location: "Atlanta, GA",
        arr: 460000,
        salesRep: "Mike Johnson",
        domain: "Outbound",
        capacity: 8,
        attendees: [
            "John Smith",
            "Emily Davis",
            "David Brown",
            "Jennifer Wilson",
        ],
        creatorEmail: "mike.johnson@rfsmart.com",
    },
];

export function VisitsProvider({ children }: { children: ReactNode }) {
    const [visits, setVisits] = useState<Visit[]>(mockVisits);

    const addAttendee = (visitId: string, attendeeName: string) => {
        setVisits((prevVisits) =>
            prevVisits.map((visit) =>
                visit.id === visitId && visit.attendees.length < visit.capacity
                    ? {
                          ...visit,
                          attendees: [...visit.attendees, attendeeName],
                      }
                    : visit,
            ),
        );
    };

    const removeAttendee = (visitId: string, attendeeName: string) => {
        setVisits((prevVisits) =>
            prevVisits.map((visit) =>
                visit.id === visitId
                    ? {
                          ...visit,
                          attendees: visit.attendees.filter(
                              (a) => a !== attendeeName,
                          ),
                      }
                    : visit,
            ),
        );
    };

    const getVisit = (visitId: string) => {
        return visits.find((v) => v.id === visitId);
    };

    return (
        <VisitsContext.Provider
            value={{ visits, addAttendee, removeAttendee, getVisit }}
        >
            {children}
        </VisitsContext.Provider>
    );
}

export function useVisits() {
    const context = useContext(VisitsContext);
    if (context === undefined) {
        throw new Error("useVisits must be used within a VisitsProvider");
    }
    return context;
}
