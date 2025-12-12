// src/types/user.ts

export type UserRole = 'ADMIN' | 'GERENTE' | 'CAJERO' | 'MESERO';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // Nota: En un futuro, idealmente esto no debería viajar al frontend por seguridad.
}