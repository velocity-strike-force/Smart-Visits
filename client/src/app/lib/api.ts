const API_URL = import.meta.env.VITE_API_URL;

export interface ApiVisit {
  id?: string;
  visitId?: string;
  title?: string;
  purposeForVisit?: string;
  customer?: string;
  customerName?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  productLine?: string;
  location?: string;
  arr?: number;
  customerARR?: number;
  salesRep?: string;
  salesRepName?: string;
  domain?: string;
  isDraft?: boolean;
  capacity?: number;
  currentAttendees?: number;
  invitees?: string[];
  creatorEmail?: string;
  customerContact?: string;
  customerContactRep?: string;
  purpose?: string;
  details?: string;
  visitDetails?: string;
  isKeyAccount?: boolean;
  isPrivate?: boolean;
}

interface VisitListResponse {
  success?: boolean;
  visits?: ApiVisit[];
}

function getApiUrl(path: string) {
  if (!API_URL) {
    throw new Error('Missing VITE_API_URL. Add it to client/.env and restart the dev server.');
  }

  return `${API_URL.replace(/\/$/, '')}${path}`;
}

export async function getVisits(): Promise<ApiVisit[]> {
  const response = await fetch(getApiUrl('/dev/visit'));

  if (!response.ok) {
    throw new Error(`Failed to load visits (${response.status})`);
  }

  const data = await response.json() as VisitListResponse;
  return data.visits ?? [];
}