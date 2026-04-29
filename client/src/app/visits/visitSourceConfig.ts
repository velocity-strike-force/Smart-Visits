export type VisitsDataSourceMode = 'mock' | 'api';

/**
 * VITE_VISITS_DATA_SOURCE: `api` (or `remote` / `dynamo`) = fetch from backend.
 * Anything else or unset = embedded `getMockVisits()`.
 */
export function getVisitsDataSourceMode(): VisitsDataSourceMode {
  const v = import.meta.env.VITE_VISITS_DATA_SOURCE?.toLowerCase();
  if (v === 'api' || v === 'remote' || v === 'dynamo') {
    return 'api';
  }
  return 'mock';
}

export function getVisitApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ''
  ) ?? '';
}
