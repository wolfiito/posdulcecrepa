
import { FieldValue, Timestamp } from '../firebase';

export type MovementType = 'IN' | 'OUT'; 
export type MovementCategory = 'INSUMO' | 'SERVICIO' | 'NOMINA' | 'MANTENIMIENTO' | 'RETIRO' | 'FONDO_EXTRA' | 'OTRO';

export interface Movement {
  id: string;
  type: MovementType;
  category: MovementCategory;
  amount: number;
  description: string;
  createdAt: Timestamp | Date | FieldValue;
  shiftId?: string; 
  registeredBy?: string; 
}

