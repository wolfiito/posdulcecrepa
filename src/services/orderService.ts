// src/services/orderService.ts
import { db, collection, serverTimestamp, runTransaction, doc, writeBatch } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';
import type { Order, PaymentDetails, OrderMode, KitchenStatus } from '../types/order';
import type { DocumentReference } from 'firebase/firestore'; // Importamos el tipo estricto
import { shiftService } from './shiftService';

// Interfaz interna para asegurar que no usamos 'any'
interface StockUpdate {
    ref: DocumentReference;
    newStock: number;
}

export const orderService = {
  async createOrder(
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
        // --- 1. LECTURAS (Todo lo que se lee debe ser antes de escribir) ---
        
        // A. Referencias
        const counterRef = doc(db, "counters", "orders");
        
        // B. Preparar lecturas de stock
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
        const modRefs = uniqueModIds.map(id => doc(db, "modifiers", id));

        // C. EJECUCIÓN DE LECTURAS EN PARALELO (Optimización clave)
        // Leemos el contador y todos los modificadores al mismo tiempo
        const [counterSnap, ...modSnaps] = await Promise.all([
            transaction.get(counterRef),
            ...modRefs.map(ref => transaction.get(ref))
        ]);

        // --- 2. LÓGICA DE NEGOCIO ---

        // D. Calcular Stock y Validar
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

        // E. Calcular Folio
        let currentCount = 100;
        if (counterSnap.exists()) {
            const data = counterSnap.data();
            currentCount = data.count || 100;
        }
        finalOrderNumber = currentCount + 1;

        // F. Preparar Objeto
        const firebaseOrderData: Order = {
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

        // --- 3. ESCRITURAS ---
        const newOrderRef = doc(collection(db, "orders")); 
        
        transaction.set(newOrderRef, firebaseOrderData);
        transaction.set(counterRef, { count: finalOrderNumber }, { merge: true });
        
        updates.forEach(update => {
            transaction.update(update.ref, { currentStock: update.newStock });
        });
      });

      // --- 4. EFECTOS SECUNDARIOS (Fuera de transacción) ---
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
      throw error; // Re-lanzamos para que la UI muestre el error (ej: "Stock insuficiente")
    }
  },

  async payOrders(orderIds: string[], payment: PaymentDetails, shiftId?: string) {
      const batch = writeBatch(db);

      orderIds.forEach(id => {
        const ref = doc(db, "orders", id);
          
        const updateData: any = {
            status: 'paid',
            payment: payment,
            paidAt: serverTimestamp(), // Guardamos cuándo se pagó realmente
        };
        if (shiftId) {
            updateData.shiftId = shiftId; 
        }

        batch.update(ref, updateData);
      });
      await batch.commit();
  }
};