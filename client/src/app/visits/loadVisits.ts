import { getMockVisits } from './mockVisitsData';
import { loadVisitsFromApi } from './visitApi';
import { getVisitsDataSourceMode } from './visitSourceConfig';

export async function loadVisits() {
  if (getVisitsDataSourceMode() === 'mock') {
    return getMockVisits();
  }
  return loadVisitsFromApi();
}
