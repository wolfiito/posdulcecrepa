// src/types/order.ts
import { FieldValue, Timestamp } from '../firebase';
import type { TicketItem } from './menu';

export interface PaymentTransaction {
  method: 'cash' | 'card' | 'transfer'; 
  amount: number;
  paidAt?: Timestamp | Date;
}

export type OrderMode = string;
export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';
export type KitchenStatus = 'queued' | 'preparing' | 'ready' | 'delivered';

export interface PaymentDetails {
  totalPaid: number;      // Cuánto entregó el cliente (ej: $500 billete)
  change: number;         // Cambio (ej: $60)
  method: PaymentMethod;  // 'cash', 'card' o 'mixed'
  amountPaid: number;     // El costo real cubierto (ej: $440)
  cardFee?: number;
  
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
  shiftId?: string;

  branchId: string;
}