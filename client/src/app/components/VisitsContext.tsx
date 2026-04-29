import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import type { Visit } from '../types/visit';
import { getVisitsDataSourceMode } from '../visits/visitSourceConfig';
import { getMockVisits } from '../visits/mockVisitsData';
import { loadVisits } from '../visits/loadVisits';
import {
  cancelVisitSignup,
  createVisitSignup,
  loadVisitDetailWithSignups,
} from '../visits/visitApi';

export type { Visit } from '../types/visit';

interface VisitsContextType {
  visits: Visit[];
  visitsLoading: boolean;
  visitsError: string | null;
  addAttendee: (
    visitId: string,
    attendee: { userId: string; name: string; email: string }
  ) => Promise<void>;
  removeAttendee: (
    visitId: string,
    attendee: { userId: string; name: string }
  ) => Promise<void>;
  refreshVisit: (visitId: string) => Promise<void>;
  getVisit: (visitId: string) => Visit | undefined;
}

const VisitsContext = createContext<VisitsContextType | undefined>(undefined);

export function VisitsProvider({ children }: { children: ReactNode }) {
  const isApi = getVisitsDataSourceMode() === 'api';

  const [visits, setVisits] = useState<Visit[]>(() =>
    isApi ? [] : getMockVisits()
  );
  const [visitsLoading, setVisitsLoading] = useState(isApi);
  const [visitsError, setVisitsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApi) {
      setVisits(getMockVisits());
      setVisitsLoading(false);
      setVisitsError(null);
      return;
    }

    let cancelled = false;
    setVisitsLoading(true);
    setVisitsError(null);

    loadVisits()
      .then(rows => {
        if (!cancelled) setVisits(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setVisits([]);
          setVisitsError(
            err instanceof Error ? err.message : 'Failed to load visits'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setVisitsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isApi]);

  const mergeVisit = (incoming: Visit) => {
    setVisits((prevVisits) => {
      const existingIndex = prevVisits.findIndex((visit) => visit.id === incoming.id);
      if (existingIndex === -1) {
        return [...prevVisits, incoming];
      }
      return prevVisits.map((visit) =>
        visit.id === incoming.id ? { ...visit, ...incoming } : visit
      );
    });
  };

  const refreshVisit = async (visitId: string): Promise<void> => {
    if (!isApi) {
      return;
    }
    const detail = await loadVisitDetailWithSignups(visitId);
    if (!detail) {
      return;
    }
    mergeVisit(detail);
  };

  const addAttendee = async (
    visitId: string,
    attendee: { userId: string; name: string; email: string }
  ) => {
    if (!isApi) {
      setVisits((prevVisits) =>
        prevVisits.map((visit) =>
          visit.id === visitId && visit.attendees.length < visit.capacity
            ? {
                ...visit,
                attendees: [...visit.attendees, attendee.name],
                attendeeUserIds: [...(visit.attendeeUserIds ?? []), attendee.userId],
              }
            : visit
        )
      );
      return;
    }

    await createVisitSignup({
      visitId,
      userId: attendee.userId,
      userName: attendee.name,
      userEmail: attendee.email,
    });
    await refreshVisit(visitId);
  };

  const removeAttendee = async (
    visitId: string,
    attendee: { userId: string; name: string }
  ) => {
    if (!isApi) {
      setVisits((prevVisits) =>
        prevVisits.map((visit) =>
          visit.id === visitId
            ? {
                ...visit,
                attendees: visit.attendees.filter((a) => a !== attendee.name),
                attendeeUserIds: (visit.attendeeUserIds ?? []).filter(
                  (id) => id !== attendee.userId
                ),
              }
            : visit
        )
      );
      return;
    }

    await cancelVisitSignup(visitId, attendee.userId);
    await refreshVisit(visitId);
  };

  const getVisit = (visitId: string) => visits.find(v => v.id === visitId);

  return (
    <VisitsContext.Provider
      value={{
        visits,
        visitsLoading,
        visitsError,
        addAttendee,
        removeAttendee,
        refreshVisit,
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
