// src/services/orderService.ts
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';
import { useAuthStore } from '../store/useAuthStore'; 

export type PaymentMethod = 'cash' | 'card' | 'transfer';

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
  mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar';
  status: 'pending' | 'paid' | 'cancelled';
  orderNumber: number;
  createdAt: any;
  payment?: PaymentDetails;
  cashier?: string;
}

export const orderService = {
  async createOrder(
    items: TicketItem[], 
    total: number, 
    mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar', 
    orderNumber: number,
    payment?: PaymentDetails 
  ): Promise<void> {
    
    const initialStatus = payment ? 'paid' : 'pending';

    const currentUser = useAuthStore.getState().currentUser;
    const cashierName = currentUser ? currentUser.name : 'Cajero';

    // Objeto para imprimir (Local)
    const printOrderData: Order = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: { toDate: () => new Date() },
      payment, // Aquí no importa si es undefined
      cashier: cashierName
    };

    // Objeto para Firebase (Nube)
    // Usamos spread condicional para evitar campos undefined
    const firebaseOrderData = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: serverTimestamp(),
      cashier: cashierName,
      // TRUCO: Solo agregamos la propiedad 'payment' si tiene valor.
      // Si es undefined, no se agrega nada al objeto.
      ...(payment && { payment }) 
    };

    // 1. Imprimir Ticket
    printService.printReceipt(printOrderData);

    // 2. Guardar en BD
    try {
      await addDoc(collection(db, "orders"), firebaseOrderData);
    } catch (error) {
      console.error("Error al guardar orden:", error);
      alert("Error crítico al guardar la orden. Revisa la consola.");
    }
  }
};