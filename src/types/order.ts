// src/types/order.ts
import { FieldValue, Timestamp } from '../firebase';
import type { TicketItem } from './menu';

// 1. CORRECCIÓN AQUÍ: Quitamos 'mixed' de las transacciones individuales
export interface PaymentTransaction {
  method: 'cash' | 'card' | 'transfer'; 
  amount: number;
  paidAt?: Timestamp | Date; // Mejor que 'any'
}

export type OrderMode = 'Mesa 1' | 'Mesa 2' | 'Para Llevar';
export type OrderStatus = 'pending' | 'paid' | 'cancelled';

// Aquí sí dejamos 'mixed' porque el pago global puede ser mixto
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';

export type KitchenStatus = 'queued' | 'preparing' | 'ready' | 'delivered';

export interface PaymentDetails {
  totalPaid: number;      // Cuánto entregó el cliente (ej: $500 billete)
  change: number;         // Cambio (ej: $60)
  method: PaymentMethod;  // 'cash', 'card' o 'mixed'
  amountPaid: number;     // El costo real cubierto (ej: $440)
  cardFee?: number;
  
  // EL NUEVO CAMPO ESTRELLA
  transactions?: PaymentTransaction[];
}

export interface Order {
  id?: string;
  items: TicketItem[];
  total: number;
  mode: OrderMode;
  
  status: OrderStatus;        
  kitchenStatus: KitchenStatus; 
  
  orderNumber: number;
  customerName?: string;
  
  createdAt: Timestamp | FieldValue | Date; 
  payment?: PaymentDetails;
  cashier?: string;
  shiftId?: string; // CRÍTICO: No borrar esto, es lo que arregló tu corte
}