// src/services/orderService.ts
import { db, collection, serverTimestamp, runTransaction, doc, writeBatch, increment } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';
import type { PaymentDetails, OrderMode, KitchenStatus } from '../types/order';
import type { DocumentReference } from 'firebase/firestore'; 

interface StockUpdate {
    ref: DocumentReference;
    newStock: number;
}

const cleanUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(cleanUndefined);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => [key, cleanUndefined(value)])
        );
    }
    return obj;
};

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
    let finalOrderNumber = 0;

    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db,"branches", branchId, "counters", "orders");

        const modifiersToDeduct = new Map<string, number>();
        const modIdsToRead = new Set<string>();

        items.forEach(item => {
            // 1. Deducir el producto base si existe en inventario
            const baseId = item.details?.itemId || item.productId;
            if (baseId) {
                const currentQty = modifiersToDeduct.get(baseId) || 0;
                modifiersToDeduct.set(baseId, currentQty + (item.quantity || 1));
                modIdsToRead.add(baseId);
            }

            // 2. Deducir los modificadores
            if (item.details?.selectedModifiers) {
                item.details.selectedModifiers.forEach(mod => {
                    const currentQty = modifiersToDeduct.get(mod.id) || 0;
                    modifiersToDeduct.set(mod.id, currentQty + (item.quantity || 1));
                    modIdsToRead.add(mod.id);
                });
            }
        });

        const uniqueModIds = Array.from(modIdsToRead);
        const invRefs = uniqueModIds.map(id => doc(db, "branches", branchId, "inventory", id));

        // Descargamos como invSnaps
        const [counterSnap, ...invSnaps] = await Promise.all([
            transaction.get(counterRef),
            ...invRefs.map(ref => transaction.get(ref))
        ]);

        const updates: StockUpdate[] = [];
        
        // 5. Procesar los resultados del inventario
        invSnaps.forEach((snap, index) => {
            const modId = uniqueModIds[index];
            const qtyToDeduct = modifiersToDeduct.get(modId) || 0;

            if (snap.exists()) {
                const data = snap.data();
                const isTracked = data.trackStock !== false;
                
                if (isTracked) {
                    const currentStock = Number(data.currentStock) || 0;
                    const newStock = currentStock - qtyToDeduct;

                    // HARDENING: Evitar stock negativo si está activado el rastreo
                    if (newStock < 0) {
                        throw new Error(`Stock insuficiente: ${data.name || 'Ingrediente'} (Disponible: ${currentStock}, Necesario: ${qtyToDeduct})`);
                    }

                    updates.push({ ref: snap.ref, newStock });
                }
            } else {
                // Si el documento de inventario local no existe, 
                // simplemente no lo descontamos (se asume que no se rastrea en esta sucursal)
                console.log(`Inventory doc missing for ${modId}, skipping deduction.`);
            }
        });

        let currentCount = 0;
        if (counterSnap.exists()) {
            currentCount = counterSnap.data().count || 0;
        }
        finalOrderNumber = currentCount + 1;

        const cleanItems = cleanUndefined(items);
        const cleanPayment = payment ? cleanUndefined(payment) : undefined;
        
        // F. Preparar Objeto
        const firebaseOrderData: any = {
            branchId: branchId || 'sin-sucursal',
            items: cleanItems,
            total: total || 0,
            mode: mode || 'Para Llevar',
            status: initialStatus,
            kitchenStatus: initialKitchenStatus,
            orderNumber: finalOrderNumber,
            customerName: customerName || 'Cliente Anónimo',
            createdAt: serverTimestamp(),
            cashier: cashierName || 'Cajero',
        };

        if (cleanPayment) firebaseOrderData.payment = cleanPayment;
        if (shiftId) firebaseOrderData.shiftId = shiftId;
        
        const newOrderRef = doc(collection(db, "orders")); 
        transaction.set(newOrderRef, firebaseOrderData);
        transaction.set(counterRef, { count: finalOrderNumber }, { merge: true });
        
        updates.forEach(update => {
            transaction.update(update.ref, { currentStock: update.newStock });
        });
      });

      // Fuera de la transacción para no bloquear la BD si la impresora falla
      if (shouldPrint) {
        printService.printReceipt({
            branchId,
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
            const qty = item.quantity || 1;

            // Restaurar Base
            const baseId = item.details?.itemId || item.productId;
            if (baseId) {
                const invRef = doc(db, "branches", branchId, "inventory", baseId);
                batch.set(invRef, {
                    currentStock: increment(qty)
                }, { merge: true });
            }

            // Restaurar Modificadores
            if (item.details?.selectedModifiers) {
                item.details.selectedModifiers.forEach(mod => {
                    if (mod.id) {
                        const invRef = doc(db, "branches", branchId, "inventory", mod.id);
                        batch.set(invRef, {
                            currentStock: increment(qty)
                        }, { merge: true });
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
  },

  async removeItemFromOrder(branchId: string, orderId: string, itemToRemove: TicketItem, remainingItems: TicketItem[], newTotal: number) {
    try {
        const batch = writeBatch(db);
        const orderRef = doc(db, "orders", orderId);

        // 1. Actualizar la orden
        if (remainingItems.length === 0) {
            batch.update(orderRef, { 
                status: 'cancelled',
                cancelledAt: serverTimestamp(),
                items: [],
                total: 0
            });
        } else {
            batch.update(orderRef, { 
                items: remainingItems,
                total: newTotal
            });
        }

        // 2. Restaurar Stock del item eliminado
        const qty = itemToRemove.quantity || 1;
        const baseId = itemToRemove.details?.itemId || itemToRemove.productId;
        if (baseId) {
            const invRef = doc(db, "branches", branchId, "inventory", baseId);
            batch.set(invRef, { currentStock: increment(qty) }, { merge: true });
        }
        if (itemToRemove.details?.selectedModifiers) {
            itemToRemove.details.selectedModifiers.forEach(mod => {
                const invRef = doc(db, "branches", branchId, "inventory", mod.id);
                batch.set(invRef, { currentStock: increment(qty) }, { merge: true });
            });
        }

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error al eliminar item de orden:", error);
        throw error;
    }
  }
};