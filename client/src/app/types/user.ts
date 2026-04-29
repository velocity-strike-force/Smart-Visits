export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'visitor' | 'sales_rep';
}
