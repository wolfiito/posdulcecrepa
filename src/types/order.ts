// src/types/order.ts
import { FieldValue, Timestamp } from 'firebase/firestore';
import type { TicketItem } from './menu';

// Definimos los valores permitidos (Enums o Union Types)
export type OrderMode = 'Mesa 1' | 'Mesa 2' | 'Para Llevar';
export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface PaymentDetails {
  method: PaymentMethod;
  amountPaid: number;
  change: number;
  cardFee?: number;
}

// Esta es la estructura OFICIAL de una orden
export interface Order {
  id?: string;
  items: TicketItem[];
  total: number;
  mode: OrderMode;
  status: OrderStatus;
  orderNumber: number;
  // Aquí solucionamos el problema del "any":
  // Al escribir usamos FieldValue (serverTimestamp)
  // Al leer usamos Timestamp
  // En local a veces usamos Date
  createdAt: Timestamp | FieldValue | Date; 
  payment?: PaymentDetails;
  cashier?: string;
}