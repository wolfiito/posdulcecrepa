// src/services/orderService.ts
import { db, collection, serverTimestamp, runTransaction, doc } from '../firebase'; // <--- IMPORTANTE: runTransaction y doc
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
    const cashierName = currentUser?.name || 'Cajero';

    // Objeto para imprimir (Local)
    const printOrderData: Order = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: { toDate: () => new Date() },
      payment,
      cashier: cashierName
    };

    // Objeto para Firebase
    const firebaseOrderData = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: serverTimestamp(),
      cashier: cashierName,
      ...(payment && { payment }) 
    };

    try {
      // --- INICIO DE TRANSACCIÓN DE INVENTARIO ---
      await runTransaction(db, async (transaction) => {
        
        // 1. Identificar qué modificadores (ingredientes) se usaron
        // Mapa: ID del modificador -> Cantidad a restar
        const modifiersToDeduct = new Map<string, number>();

        items.forEach(item => {
            if (item.details?.selectedModifiers) {
                item.details.selectedModifiers.forEach(mod => {
                    const currentQty = modifiersToDeduct.get(mod.id) || 0;
                    modifiersToDeduct.set(mod.id, currentQty + 1);
                });
            }
        });

        // 2. Leer el stock actual de esos modificadores en la BD (Lectura atómica)
        const updates = [];
        for (const [modId, qty] of modifiersToDeduct) {
            const modRef = doc(db, "modifiers", modId);
            const modDoc = await transaction.get(modRef);

            if (modDoc.exists()) {
                const data = modDoc.data();
                // Solo descontamos si tiene la bandera trackStock activa
                if (data.trackStock) {
                    const currentStock = data.currentStock || 0;
                    const newStock = currentStock - qty;
                    // Preparamos la actualización (no la ejecutamos todavía)
                    updates.push({ ref: modRef, newStock });
                }
            }
        }

        // 3. Ejecutar todas las escrituras
        
        // A. Crear la Orden
        const newOrderRef = doc(collection(db, "orders")); // Referencia nueva
        transaction.set(newOrderRef, firebaseOrderData);

        // B. Actualizar Stocks
        updates.forEach(update => {
            transaction.update(update.ref, { currentStock: update.newStock });
        });

      });
      // --- FIN DE TRANSACCIÓN ---

      // 4. Imprimir Ticket (Solo si la transacción fue exitosa)
      printService.printReceipt(printOrderData);

    } catch (error) {
      console.error("Error crítico al procesar orden e inventario:", error);
      alert("Error al guardar la orden. Revisa tu conexión.");
      throw error; // Re-lanzar para que la UI se entere
    }
  }
};