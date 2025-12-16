// src/types/movement.ts
import { FieldValue, Timestamp } from '../firebase';

export type MovementType = 'IN' | 'OUT'; // Entrada o Salida
export type MovementCategory = 'INSUMO' | 'SERVICIO' | 'NOMINA' | 'MANTENIMIENTO' | 'RETIRO' | 'FONDO_EXTRA' | 'OTRO';

export interface Movement {
  id: string;
  type: MovementType;
  category: MovementCategory;
  amount: number;
  description: string;
  // Usamos el tipado seguro que aprendimos
  createdAt: Timestamp | Date | FieldValue;
  shiftId?: string; // Opcional: Para ligarlo al turno actual
  registeredBy?: string; // Nuevo: Saber quién registró el gasto
}

