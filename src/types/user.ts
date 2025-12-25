export type UserRole = 'ADMIN' | 'GERENTE' | 'CAJERO' | 'MESERO';
export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
}