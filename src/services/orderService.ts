// src/services/orderService.ts
import { db, collection, serverTimestamp, runTransaction, doc, writeBatch, increment } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';
import type { Order, PaymentDetails, OrderMode, KitchenStatus } from '../types/order';
import type { DocumentReference } from 'firebase/firestore'; // Importamos el tipo estricto

// Interfaz interna para asegurar que no usamos 'any'
interface StockUpdate {
    ref: DocumentReference;
    newStock: number;
}

export const orderService = {
  async createOrder(
    branchId: string,
    items: TicketItem[], 
    total: number, 
    mode: OrderMode, 
    cashierName: string, 
    customerName: string,
    shouldPrint: boolean,
    payment?: PaymentDetails,
    shiftId?: string
  ): Promise<number> {

    const initialStatus = payment ? 'paid' : 'pending';
    const initialKitchenStatus: KitchenStatus = 'queued';

    try {
      let finalOrderNumber = 0;

      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db,"branches", branchId, "counters", "orders");

        const modifiersToDeduct = new Map<string, number>();
        const modIdsToRead = new Set<string>();

        items.forEach(item => {
            if (item.details?.selectedModifiers) {
                item.details.selectedModifiers.forEach(mod => {
                    const currentQty = modifiersToDeduct.get(mod.id) || 0;
                    modifiersToDeduct.set(mod.id, currentQty + 1);
                    modIdsToRead.add(mod.id);
                });
            }
        });

        const uniqueModIds = Array.from(modIdsToRead);
        const invRefs = uniqueModIds.map(id => doc(db, "branches", branchId, "inventory", id));

        const [counterSnap, ...invSnaps] = await Promise.all([
            transaction.get(counterRef),
            ...invRefs.map(ref => transaction.get(ref))
        ]);

        const updates: StockUpdate[] = [];
        
        modSnaps.forEach((snap, index) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.trackStock) {
                    const modId = uniqueModIds[index];
                    const qtyToDeduct = modifiersToDeduct.get(modId) || 0;
                    const currentStock = data.currentStock || 0;
                    const newStock = currentStock - qtyToDeduct;

                    // HARDENING: Evitar stock negativo
                    if (newStock < 0) {
                        throw new Error(`Stock insuficiente: ${data.name} (Quedan: ${currentStock})`);
                    }

                    updates.push({ ref: snap.ref, newStock });
                }
            }
        });

        let currentCount = 0;
        if (counterSnap.exists()) {
            currentCount = counterSnap.data().count || 0;
        }
        finalOrderNumber = currentCount + 1;

        // F. Preparar Objeto
        const firebaseOrderData: Order = {
          branchId,
          items,
          total,
          mode,
          status: initialStatus,
          kitchenStatus: initialKitchenStatus,
          orderNumber: finalOrderNumber,
          customerName,
          createdAt: serverTimestamp(),
          cashier: cashierName,
          ...(payment && { payment }),
          ...(shiftId && { shiftId })
        };

        const newOrderRef = doc(collection(db, "orders")); 
        transaction.set(newOrderRef, firebaseOrderData);
        transaction.set(counterRef, { count: finalOrderNumber }, { merge: true });
        
        updates.forEach(update => {
            transaction.update(update.ref, { currentStock: update.newStock });
        });
      });

      if (shouldPrint) {
        printService.printReceipt({
            items,
            total,
            mode,
            status: initialStatus,
            kitchenStatus: initialKitchenStatus,
            orderNumber: finalOrderNumber,
            customerName,
            createdAt: new Date(),
            payment,
            cashier: cashierName
        });
    }

    return finalOrderNumber;

    } catch (error) {
      console.error("Error crítico al crear orden:", error);
      throw error;
    }
  },

  async payOrders(orderIds: string[], payment: PaymentDetails, shiftId?: string) {
      const batch = writeBatch(db);

      orderIds.forEach(id => {
        const ref = doc(db, "orders", id);
          
        const updateData: any = {
            status: 'paid',
            payment: payment,
            paidAt: serverTimestamp(), 
        };
        if (shiftId) {
            updateData.shiftId = shiftId; 
        }

        batch.update(ref, updateData);
      });
      await batch.commit();
  },

  async cancelOrder(branchId: string, orderId: string, items: TicketItem[]) {
    try {
        const batch = writeBatch(db);
        const orderRef = doc(db, "orders", orderId);

        // 1. Marcar como cancelada
        batch.update(orderRef, { 
            status: 'cancelled',
            cancelledAt: serverTimestamp() 
        });

        // 2. Restaurar Stock (Inventario Inverso)
        items.forEach(item => {
            if (item.details?.selectedModifiers) {
                item.details.selectedModifiers.forEach(mod => {
                    if (mod.id) {
                        const invRef = doc(db, "branches", branchId, "inventory", mod.id);
                        batch.update(invRef, {
                            currentStock: increment(1)
                        });
                    }
                });
            }
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error al cancelar orden:", error);
        throw error;
    }
  }
};

