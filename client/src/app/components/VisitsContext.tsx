import { useSuspenseQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { ApiVisit, getVisits } from "../lib/api";
import fallbackVisitsData from "../../mockapi/fallbackVisits.json";

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
    isKeyAccount?: boolean;
    isDraft?: boolean;
    postVisitRecordCount?: number;
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
    visitsLoading: boolean;
    visitsError: string | null;
    addAttendee: (visitId: string, attendeeName: string) => void;
    removeAttendee: (visitId: string, attendeeName: string) => void;
    getVisit: (visitId: string) => Visit | undefined;
}

const VisitsContext = createContext<VisitsContextType | undefined>(undefined);

const EMPTY_RESPONSE_FALLBACK_ENABLED =
    import.meta.env.VITE_ENABLE_EMPTY_API_FALLBACK === "true";

interface FallbackVisitRecord {
    id: string;
    title: string;
    customer: string;
    date: string;
    productLine: string;
    location: string;
    arr: number;
    salesRep: string;
    domain: string;
    capacity: number;
    attendees: string[];
    creatorEmail: string;
    endDate?: string;
    isKeyAccount?: boolean;
    isDraft?: boolean;
    postVisitRecordCount?: number;
    customerContact?: string;
    purpose?: string;
    details?: string;
    isPrivate?: boolean;
}

function mapFallbackVisitToVisit(visit: FallbackVisitRecord): Visit | null {
    const date = new Date(visit.date);
    const endDate = visit.endDate ? new Date(visit.endDate) : undefined;

    if (!visit.id || Number.isNaN(date.getTime())) {
        return null;
    }

    return {
        id: visit.id,
        title: visit.title,
        customer: visit.customer,
        date,
        productLine: visit.productLine,
        location: visit.location,
        arr: visit.arr,
        salesRep: visit.salesRep,
        domain: visit.domain,
        capacity: visit.capacity,
        attendees: visit.attendees,
        creatorEmail: visit.creatorEmail,
        endDate:
            endDate && !Number.isNaN(endDate.getTime()) ? endDate : undefined,
        isKeyAccount: visit.isKeyAccount,
        isDraft: visit.isDraft,
        postVisitRecordCount: visit.postVisitRecordCount,
        customerContact: visit.customerContact,
        purpose: visit.purpose,
        details: visit.details,
        isPrivate: visit.isPrivate,
    };
}

const emptyStateFallbackVisits: Visit[] = (
    fallbackVisitsData as FallbackVisitRecord[]
)
    .map(mapFallbackVisitToVisit)
    .filter((visit): visit is Visit => Boolean(visit));

function mapApiVisitToVisit(visit: ApiVisit): Visit | null {
    const id = visit.id ?? visit.visitId ?? "";
    const date = new Date(visit.date ?? visit.startDate ?? "");
    const endDate = visit.endDate ? new Date(visit.endDate) : undefined;

    if (!id || Number.isNaN(date.getTime())) {
        return null;
    }

    const attendeeCountFromApi = visit.currentAttendees ?? 0;
    const attendees =
        visit.invitees && visit.invitees.length > 0
            ? visit.invitees
            : Array.from(
                  { length: attendeeCountFromApi },
                  (_, index) => `Attendee ${index + 1}`,
              );

    return {
        id,
        title: visit.title ?? "",
        customer: visit.customer ?? visit.customerName ?? "",
        date,
        productLine: visit.productLine ?? "",
        location: visit.location ?? "",
        arr: visit.arr ?? visit.customerARR ?? 0,
        salesRep: visit.salesRep ?? visit.salesRepName ?? "",
        domain: visit.domain ?? "",
        isDraft: visit.isDraft ?? false,
        capacity: visit.capacity ?? Math.max(attendees.length, 1),
        attendees,
        creatorEmail: "",
        endDate:
            endDate && !Number.isNaN(endDate.getTime()) ? endDate : undefined,
    };
}

export function VisitsProvider({ children }: { children: ReactNode }) {
    const { data: apiVisits } = useSuspenseQuery({
        queryKey: ["visits"],
        queryFn: getVisits,
        select: (visits): Visit[] => {
            const mapped = visits
                .map(mapApiVisitToVisit)
                .filter((visit): visit is Visit => Boolean(visit));

            if (mapped.length > 0) {
                return mapped;
            }

            // Enable fallback only when explicitly requested for empty API responses.
            return EMPTY_RESPONSE_FALLBACK_ENABLED
                ? emptyStateFallbackVisits
                : mapped;
        },
    });

    const [attendeeOverrides, setAttendeeOverrides] = useState<
        Record<string, string[]>
    >({});

    const visits = useMemo(
        () =>
            apiVisits.map((visit) => ({
                ...visit,
                attendees: attendeeOverrides[visit.id] ?? visit.attendees,
            })),
        [apiVisits, attendeeOverrides],
    );

    const addAttendee = (visitId: string, attendeeName: string) => {
        const visit = visits.find((current) => current.id === visitId);
        if (!visit) {
            return;
        }

        const currentAttendees = attendeeOverrides[visitId] ?? visit.attendees;
        if (
            currentAttendees.length >= visit.capacity ||
            currentAttendees.includes(attendeeName)
        ) {
            return;
        }

        setAttendeeOverrides((previous) => ({
            ...previous,
            [visitId]: [...currentAttendees, attendeeName],
        }));
    };

    const removeAttendee = (visitId: string, attendeeName: string) => {
        const visit = visits.find((current) => current.id === visitId);
        if (!visit) {
            return;
        }

        const currentAttendees = attendeeOverrides[visitId] ?? visit.attendees;
        setAttendeeOverrides((previous) => ({
            ...previous,
            [visitId]: currentAttendees.filter(
                (attendee) => attendee !== attendeeName,
            ),
        }));
    };

    const getVisit = (visitId: string) => {
        return visits.find((visit) => visit.id === visitId);
    };

    return (
        <VisitsContext.Provider
            value={{
                visits,
                visitsLoading,
                visitsError,
                addAttendee,
                removeAttendee,
                getVisit,
            }}
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
