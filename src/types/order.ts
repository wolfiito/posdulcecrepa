// src/types/order.ts
import { FieldValue, Timestamp } from '../firebase';
import type { TicketItem } from './menu';

export type OrderMode = 'Mesa 1' | 'Mesa 2' | 'Para Llevar';
export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

// NUEVO: Estado exclusivo para cocina
export type KitchenStatus = 'queued' | 'preparing' | 'ready' | 'delivered';

export interface PaymentDetails {
  method: PaymentMethod;
  amountPaid: number;
  change: number;
  cardFee?: number;
}

export interface Order {
  id?: string;
  items: TicketItem[];
  total: number;
  mode: OrderMode;
  
  status: OrderStatus;        // Estatus Financiero
  kitchenStatus: KitchenStatus; // Estatus Operativo (NUEVO)
  
  orderNumber: number;
  customerName?: string;
  
  createdAt: Timestamp | FieldValue | Date; 
  payment?: PaymentDetails;
  cashier?: string;
}