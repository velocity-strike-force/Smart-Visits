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

export interface SignupApi {
  visitId: string;
  userId: string;
  userName: string;
  userEmail: string;
  signedUpAt: string;
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
    attendeeUserIds: [],
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
    attendeeUserIds: [],
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

export async function fetchVisitDetail(visitId: string): Promise<VisitFullApi | null> {
  return fetchVisitById(visitId);
}

export async function fetchVisitSignups(visitId: string): Promise<SignupApi[]> {
  const res = await fetch(
    apiUrl(`/api/signup?visitId=${encodeURIComponent(visitId)}`)
  );
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`Signup request failed (${res.status})`);
  }
  const body = (await res.json()) as {
    success?: boolean;
    signups?: SignupApi[];
  };
  if (!body.success || !Array.isArray(body.signups)) {
    throw new Error('Invalid signup response');
  }
  return body.signups;
}

export async function createVisitSignup(payload: {
  visitId: string;
  userId: string;
  userName: string;
  userEmail: string;
}): Promise<void> {
  const res = await fetch(apiUrl('/api/signup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `Signup failed (${res.status})`);
  }
  const body = (await res.json()) as { success?: boolean; message?: string };
  if (!body.success) {
    throw new Error(body.message || 'Signup failed');
  }
}

export async function cancelVisitSignup(visitId: string, userId: string): Promise<void> {
  const res = await fetch(
    apiUrl(
      `/api/signup?visitId=${encodeURIComponent(visitId)}&userId=${encodeURIComponent(userId)}`
    ),
    { method: 'DELETE' }
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `Cancel signup failed (${res.status})`);
  }
  const body = (await res.json()) as { success?: boolean; message?: string };
  if (!body.success) {
    throw new Error(body.message || 'Cancel signup failed');
  }
}

export async function loadVisitDetailWithSignups(visitId: string): Promise<Visit | null> {
  const [visitFull, signups] = await Promise.all([
    fetchVisitById(visitId),
    fetchVisitSignups(visitId),
  ]);
  if (!visitFull) {
    return null;
  }
  const mapped = mapVisitFromApiFull(visitFull);
  mapped.attendees = signups.map((signup) => signup.userName);
  mapped.attendeeUserIds = signups.map((signup) => signup.userId);
  return mapped;
}

/** Loads visits from VisitHandler list endpoint. */
export async function loadVisitsFromApi(): Promise<Visit[]> {
  const rows = await fetchVisitsList();
  return rows.map(mapListRowToVisit);
}
