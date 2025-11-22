// src/services/orderService.ts
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';

// --- NUEVOS TIPOS PARA PAGO ---
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface PaymentDetails {
  method: PaymentMethod;
  amountPaid: number; // Cuánto entregó el cliente (ej. $500)
  change: number;     // Cambio devuelto (ej. $50)
  cardFee?: number;   // Comisión de tarjeta (si aplica)
}

export interface Order {
  items: TicketItem[];
  total: number;
  mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar';
  status: 'pending' | 'paid' | 'cancelled';
  orderNumber: number;
  createdAt: any;
  // Agregamos esto:
  payment?: PaymentDetails;
}

export const orderService = {
  async createOrder(
    items: TicketItem[], 
    total: number, 
    mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar', 
    orderNumber: number,
    // Recibimos los detalles de pago (opcional por ahora para no romper tu código actual)
    payment?: PaymentDetails 
  ): Promise<string> {
    
    const initialStatus = mode === 'Para Llevar' ? 'paid' : 'pending';

    const newOrder: Order = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: serverTimestamp(),
      payment // Guardamos la info de pago
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), newOrder);
      
      if (initialStatus === 'paid') {
        console.log("🖨️ Imprimiendo Ticket...");
        printService.printReceipt(newOrder);
      } else {
        console.log("👨‍🍳 Imprimiendo Comanda...");
        printService.printReceipt(newOrder); 
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creando orden:", error);
      throw error;
    }
  }
};