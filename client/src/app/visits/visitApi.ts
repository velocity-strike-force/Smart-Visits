import type { Visit } from '../types/visit';
import { getVisitApiBaseUrl } from './visitSourceConfig';

export interface VisitListRow {
  visitId: string;
  productLine: string;
  location: string;
  salesRepName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  capacity: number;
  isDraft: boolean;
  isKeyAccount: boolean;
}

export interface VisitFullApi {
  visitId: string;
  productLine: string;
  location: string;
  city: string;
  state: string;
  salesRepId: string;
  salesRepName: string;
  domain: string;
  customerId: string;
  customerName: string;
  customerARR: number;
  customerImplementationStatus: string;
  isKeyAccount: boolean;
  startDate: string;
  endDate: string;
  capacity: number;
  invitees: string[];
  customerContactRep: string;
  purposeForVisit: string;
  visitDetails: string;
  isDraft: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

function apiUrl(path: string): string {
  const base = getVisitApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function parseDay(value: string): Date {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function mapVisitFromApiFull(api: VisitFullApi): Visit {
  const start = parseDay(api.startDate);
  const end = api.endDate ? parseDay(api.endDate) : undefined;
  const purpose = api.purposeForVisit?.trim();
  return {
    id: api.visitId,
    title: purpose || `${api.customerName} – ${api.productLine}`,
    customer: api.customerName,
    date: start,
    endDate: end,
    productLine: api.productLine,
    location: api.location,
    arr: api.customerARR,
    salesRep: api.salesRepName,
    domain: api.domain,
    isDraft: api.isDraft,
    capacity: api.capacity,
    attendees: [...(api.invitees ?? [])],
    creatorEmail: '',
    customerContact: api.customerContactRep,
    purpose: api.purposeForVisit,
    details: api.visitDetails,
    isPrivate: api.isPrivate,
  };
}

export function mapListRowToVisit(row: VisitListRow): Visit {
  return {
    id: row.visitId,
    title: `${row.customerName} – ${row.productLine}`,
    customer: row.customerName,
    date: parseDay(row.startDate),
    endDate: row.endDate ? parseDay(row.endDate) : undefined,
    productLine: row.productLine,
    location: row.location,
    arr: 0,
    salesRep: row.salesRepName,
    domain: '',
    isDraft: row.isDraft,
    capacity: row.capacity,
    attendees: [],
    creatorEmail: '',
  };
}

async function fetchVisitsList(): Promise<VisitListRow[]> {
  const res = await fetch(apiUrl('/api/visit'));
  if (!res.ok) throw new Error(`Visits request failed (${res.status})`);
  const body = (await res.json()) as { success?: boolean; visits?: VisitListRow[] };
  if (!body.success || !Array.isArray(body.visits)) {
    throw new Error('Invalid visits response');
  }
  return body.visits;
}

async function fetchVisitById(visitId: string): Promise<VisitFullApi | null> {
  const res = await fetch(
    apiUrl(`/api/visit?visitId=${encodeURIComponent(visitId)}`)
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Visit request failed (${res.status})`);
  const body = (await res.json()) as { success?: boolean; visit?: VisitFullApi };
  if (!body.success || !body.visit) return null;
  return body.visit;
}

/** Loads visits from VisitHandler list endpoint. */
export async function loadVisitsFromApi(): Promise<Visit[]> {
  const rows = await fetchVisitsList();
  return rows.map(mapListRowToVisit);
}
