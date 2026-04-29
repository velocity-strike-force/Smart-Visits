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
