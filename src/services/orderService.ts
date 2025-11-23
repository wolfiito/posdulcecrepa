// src/services/orderService.ts
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface PaymentDetails {
  method: PaymentMethod;
  amountPaid: number;
  change: number;
  cardFee?: number;
}

export interface Order {
  items: TicketItem[];
  total: number;
  mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar';
  status: 'pending' | 'paid' | 'cancelled';
  orderNumber: number;
  createdAt: any;
  payment?: PaymentDetails;
}

export const orderService = {
  // Quitamos el "Promise<string>" porque no vamos a esperar el ID para imprimir
  async createOrder(
    items: TicketItem[], 
    total: number, 
    mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar', 
    orderNumber: number,
    payment?: PaymentDetails 
  ): Promise<void> {
    
    const initialStatus = mode === 'Para Llevar' ? 'paid' : 'pending';

    // 1. Preparamos la orden
    // Usamos "new Date()" para la impresión inmediata (Firebase reemplazará con serverTimestamp al guardar)
    const printOrderData: Order = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: { toDate: () => new Date() }, // Truco para que el ticket tenga fecha ya
      payment
    };

    const firebaseOrderData = {
      ...printOrderData,
      createdAt: serverTimestamp() // Para la BD usamos el del servidor
    };

    // 2. ¡IMPRIMIR PRIMERO! (Crítico para iOS)
    // Lanzamos la impresión inmediatamente mientras tenemos el "permiso" del clic
    if (initialStatus === 'paid') {
      console.log("🚀 Imprimiendo ticket inmediatamente...");
      // No usamos await aquí para que sea instantáneo
      printService.printReceipt(printOrderData);
    } else {
      // Si es para cocina, también imprimimos ya
      printService.printReceipt(printOrderData); 
    }

    // 3. GUARDAR EN FIREBASE (En segundo plano)
    // Como tenemos persistencia offline, esto es seguro. Si no hay red, se guarda local y se sube luego.
    try {
      addDoc(collection(db, "orders"), firebaseOrderData)
        .then((docRef) => console.log("Orden guardada con ID:", docRef.id))
        .catch((err) => console.error("Error guardando en background:", err));
      
      // No hacemos "await" para no bloquear la UI
    } catch (error) {
      console.error("Error al iniciar guardado:", error);
      // Incluso si falla el inicio del guardado, el ticket ya salió.
      // En un POS real, esto es preferible a cobrar y no dar ticket.
    }
  }
};