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

export type { Visit } from '../types/visit';

interface VisitsContextType {
  visits: Visit[];
  visitsLoading: boolean;
  visitsError: string | null;
  addAttendee: (visitId: string, attendeeName: string) => void;
  removeAttendee: (visitId: string, attendeeName: string) => void;
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
    setVisits(prevVisits =>
      prevVisits.map(visit =>
        visit.id === visitId
          ? {
              ...visit,
              attendees: visit.attendees.filter(a => a !== attendeeName),
            }
          : visit
      )
    );
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
