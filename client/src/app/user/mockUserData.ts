import type { User } from '../types/user';

export function getMockUser(): User {
  return {
    name: 'John Smith',
    email: 'john.smith@rfsmart.com',
    role: 'sales_rep',
  };
}
