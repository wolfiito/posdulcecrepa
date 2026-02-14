import {type Branch } from "./branch";

/**
 * ADMIN: Acceso a todas las opciones
 * GERENTE: Acceso a todo menos los reportes
 * CAJERO: Cobra ordenes y toma ordenes
 * MESERO: Únicamente puede tomar ordenes
 */
export type UserRole = 'ADMIN' | 'GERENTE' | 'CAJERO' | 'MESERO';

// Interface de Usuario
export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  branchId: string;
  branch?: Branch;
}