import { db, collection, serverTimestamp, runTransaction, doc, writeBatch } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';
import type { Order, PaymentDetails, OrderMode, KitchenStatus } from '../types/order';

export const orderService = {
  async createOrder(
    items: TicketItem[], 
    total: number, 
    mode: OrderMode, 
    cashierName: string, 
    customerName: string,
    payment?: PaymentDetails 
  ): Promise<number> {

    const initialStatus = payment ? 'paid' : 'pending';
    const initialKitchenStatus: KitchenStatus = 'queued';
    try {
      let finalOrderNumber = 0;

      await runTransaction(db, async (transaction) => {
        // A. Lectura de Contador
        const counterRef = doc(db, "counters", "orders");
        const counterSnap = await transaction.get(counterRef);

        // B. Lectura de Stocks (Para validar inventario)
        const modifiersToDeduct = new Map<string, number>();
        const modRefsToRead = new Set<string>();

        items.forEach(item => {
            if (item.details?.selectedModifiers) {
                item.details.selectedModifiers.forEach(mod => {
                    const currentQty = modifiersToDeduct.get(mod.id) || 0;
                    modifiersToDeduct.set(mod.id, currentQty + 1);
                    modRefsToRead.add(mod.id);
                });
            }
        });

        const updates: any[] = [];
        for (const modId of Array.from(modRefsToRead)) {
            const modRef = doc(db, "modifiers", modId);
            const snap = await transaction.get(modRef);
            if (snap.exists()) {
                const data = snap.data();
                if (data.trackStock) {
                    const qty = modifiersToDeduct.get(modId) || 0;
                    const newStock = (data.currentStock || 0) - qty;
                    updates.push({ ref: modRef, newStock });
                }
            }
        }

        // C. Calcular Folio
        let currentCount = 100;
        if (counterSnap.exists()) currentCount = counterSnap.data().count || 100;
        finalOrderNumber = currentCount + 1;

        // D. Preparar Datos
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
          ...(payment && { payment }) 
        };

        // E. Escrituras
        const newOrderRef = doc(collection(db, "orders")); 
        transaction.set(newOrderRef, firebaseOrderData);
        transaction.set(counterRef, { count: finalOrderNumber }, { merge: true });
        
        updates.forEach(update => {
            transaction.update(update.ref, { currentStock: update.newStock });
        });
      });

      // F. Impresión
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

      return finalOrderNumber;

    } catch (error) {
      console.error("Error al crear orden:", error);
      throw error; 
    }
  },

  // 2. NUEVA FUNCIÓN: Cobrar múltiples órdenes a la vez
  // Esto soluciona que "Juan" tenga 3 tickets separados pero pague una sola vez.
  async payOrders(orders: Order[], payment: PaymentDetails) {
      const batch = writeBatch(db);

      orders.forEach(order => {
          if (!order.id) return;
          const ref = doc(db, "orders", order.id);
          batch.update(ref, {
              status: 'paid', // Cerramos la cuenta
              payment: payment // Registramos cómo se pagó
          });
      });

      await batch.commit();

      // Imprimir un "Ticket de Pago Total" (Opcional, pero recomendado)
      // Podrías sumar todo e imprimir un comprobante final aquí.
  }
};