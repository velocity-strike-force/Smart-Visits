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

export interface OutlookIntegrationStatus {
  connected: boolean;
  userId: string;
  outlookUserEmail: string;
  connectedAt: string;
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
    userId: profile.userId,
    name: profile.name,
    email: profile.email,
    role: roleFromProfile(profile.roleId),
  };
}

export function profileUserId(): string {
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

export async function loadProfileFromApi(userId = profileUserId()): Promise<ProfileApi> {
  const res = await fetch(
    apiUrl(`/api/profile?userId=${encodeURIComponent(userId)}`)
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
  return body.profile;
}

export async function updateProfileFromApi(
  profilePatch: Partial<ProfileApi> & { userId?: string }
): Promise<void> {
  const userId = profilePatch.userId ?? profileUserId();
  const response = await fetch(apiUrl('/api/profile'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...profilePatch,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Profile update failed (${response.status})`);
  }

  const body = (await response.json()) as {
    success?: boolean;
    message?: string;
  };
  if (!body.success) {
    throw new Error(body.message || 'Profile update failed');
  }
}

export async function getOutlookIntegrationStatus(
  userId = profileUserId()
): Promise<OutlookIntegrationStatus> {
  const response = await fetch(
    apiUrl(`/api/outlook-integration?userId=${encodeURIComponent(userId)}`)
  );
  if (!response.ok) {
    throw new Error(`Outlook status request failed (${response.status})`);
  }
  const body = (await response.json()) as {
    success?: boolean;
    connected?: boolean;
    userId?: string;
    outlookUserEmail?: string;
    connectedAt?: string;
  };
  if (!body.success || !body.userId) {
    throw new Error('Invalid Outlook status response');
  }
  return {
    connected: Boolean(body.connected),
    userId: body.userId,
    outlookUserEmail: body.outlookUserEmail || '',
    connectedAt: body.connectedAt || '',
  };
}

export async function startOutlookIntegration(
  userId = profileUserId()
): Promise<{ authUrl: string }> {
  const response = await fetch(apiUrl('/api/outlook-integration'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    throw new Error(`Outlook connect request failed (${response.status})`);
  }
  const body = (await response.json()) as {
    success?: boolean;
    authUrl?: string;
    message?: string;
  };
  if (!body.success || !body.authUrl) {
    throw new Error(body.message || 'Invalid Outlook connect response');
  }
  return {
    authUrl: body.authUrl,
  };
}

export async function disconnectOutlookIntegration(
  userId = profileUserId()
): Promise<void> {
  const response = await fetch(
    apiUrl(`/api/outlook-integration?userId=${encodeURIComponent(userId)}`),
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) {
    throw new Error(`Outlook disconnect failed (${response.status})`);
  }
  const body = (await response.json()) as {
    success?: boolean;
    message?: string;
  };
  if (!body.success) {
    throw new Error(body.message || 'Outlook disconnect failed');
  }
}
