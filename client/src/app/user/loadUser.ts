import { getMockUser } from './mockUserData';
import { loadUserFromApi } from './userApi';
import { getVisitsDataSourceMode } from '../visits/visitSourceConfig';

export async function loadUser() {
  if (getVisitsDataSourceMode() === 'mock') {
    return getMockUser();
  }
  return loadUserFromApi();
}
