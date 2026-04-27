import { createContext, useContext, useState, ReactNode } from 'react';

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
    id: '1',
    title: 'Quarterly Review',
    customer: 'Acme Corp',
    date: new Date(2026, 3, 10),
    endDate: new Date(2026, 3, 10),
    productLine: 'NetSuite',
    location: 'Jacksonville, FL',
    arr: 250000,
    salesRep: 'John Smith',
    domain: 'Manufacturing',
    capacity: 10,
    attendees: ['Sarah Williams', 'Mike Johnson', 'Emily Davis'],
    creatorEmail: 'john.smith@rfsmart.com',
    customerContact: 'Bob Anderson',
    purpose: 'Quarterly Review',
    details: 'Closed-toed shoes required. Meet at main entrance.',
    isPrivate: false,
    isDraft: false,
  },
  {
    id: '2',
    title: 'Product Demo',
    customer: 'TechStart Inc',
    date: new Date(2026, 3, 15),
    productLine: 'Oracle Cloud',
    location: 'Miami, FL',
    arr: 150000,
    salesRep: 'Jane Doe',
    domain: 'Technology',
    isDraft: true,
    capacity: 8,
    attendees: [],
    creatorEmail: 'jane.doe@rfsmart.com',
  },
  {
    id: '3',
    title: 'Implementation Review',
    customer: 'Global Logistics',
    date: new Date(2026, 3, 22),
    productLine: 'TMS',
    location: 'Tampa, FL',
    arr: 500000,
    salesRep: 'Mike Johnson',
    domain: 'Logistics',
    capacity: 5,
    attendees: ['John Smith', 'Sarah Williams', 'Emily Davis', 'David Brown', 'Lisa Anderson'],
    creatorEmail: 'mike.johnson@rfsmart.com',
  },
  {
    id: '4',
    title: 'Training Session',
    customer: 'RetailMax',
    date: new Date(2026, 3, 28),
    productLine: 'Shipping',
    location: 'Orlando, FL',
    arr: 180000,
    salesRep: 'Sarah Williams',
    domain: 'Retail',
    capacity: 12,
    attendees: ['Mike Johnson', 'Emily Davis', 'David Brown', 'Lisa Anderson', 'Robert Taylor', 'Jennifer Wilson', 'Thomas Moore', 'Amanda Clark'],
    creatorEmail: 'sarah.williams@rfsmart.com',
  },
];

export function VisitsProvider({ children }: { children: ReactNode }) {
  const [visits, setVisits] = useState<Visit[]>(mockVisits);

  const addAttendee = (visitId: string, attendeeName: string) => {
    setVisits(prevVisits =>
      prevVisits.map(visit =>
        visit.id === visitId && visit.attendees.length < visit.capacity
          ? { ...visit, attendees: [...visit.attendees, attendeeName] }
          : visit
      )
    );
  };

  const removeAttendee = (visitId: string, attendeeName: string) => {
    setVisits(prevVisits =>
      prevVisits.map(visit =>
        visit.id === visitId
          ? { ...visit, attendees: visit.attendees.filter(a => a !== attendeeName) }
          : visit
      )
    );
  };

  const getVisit = (visitId: string) => {
    return visits.find(v => v.id === visitId);
  };

  return (
    <VisitsContext.Provider value={{ visits, addAttendee, removeAttendee, getVisit }}>
      {children}
    </VisitsContext.Provider>
  );
}

export function useVisits() {
  const context = useContext(VisitsContext);
  if (context === undefined) {
    throw new Error('useVisits must be used within a VisitsProvider');
  }
  return context;
}
