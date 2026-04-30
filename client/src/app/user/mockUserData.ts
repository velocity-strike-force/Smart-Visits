import type { User } from '../types/user';

export function getMockUser(): User {
  return {
    userId: 'user-mock-001',
    name: 'John Smith',
    email: 'john.smith@rfsmart.com',
    role: 'sales_rep',
  };
}
