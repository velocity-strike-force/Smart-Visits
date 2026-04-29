import type { User } from '../types/user';
import { getVisitApiBaseUrl } from '../visits/visitSourceConfig';

/** Same toggle as visits: `VITE_VISITS_DATA_SOURCE=api` uses `/api/profile`. */
export interface ProfileApi {
  userId: string;
  roleId?: string;
  name: string;
  email: string;
  productLines: string[];
  city: string;
  state: string;
  emailNotifications: boolean;
  slackNotifications: boolean;
  proximityAlerts: boolean;
  proximityDistanceMiles: number;
  createdAt: string;
  updatedAt: string;
}

function apiUrl(path: string): string {
  const base = getVisitApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function roleFromProfile(roleId?: string): 'visitor' | 'sales_rep' {
  const r = roleId?.toLowerCase() ?? '';
  if (r.includes('visitor') || r.includes('guest')) return 'visitor';
  return 'sales_rep';
}

export function mapProfileToUser(profile: ProfileApi): User {
  return {
    name: profile.name,
    email: profile.email,
    role: roleFromProfile(profile.roleId),
  };
}

function profileUserId(): string {
  const raw = import.meta.env.VITE_PROFILE_USER_ID as string | undefined;
  return raw?.trim() || 'user-seed-00';
}

export async function loadUserFromApi(): Promise<User> {
  const userId = profileUserId();
  const res = await fetch(
    apiUrl(`/dev/profile?userId=${encodeURIComponent(userId)}`)
  );
  if (!res.ok) {
    throw new Error(`Profile request failed (${res.status})`);
  }
  const body = (await res.json()) as {
    success?: boolean;
    profile?: ProfileApi;
  };
  if (!body.success || !body.profile) {
    throw new Error('Invalid profile response');
  }
  return mapProfileToUser(body.profile);
}
