// src/services/orderService.ts
import { db, collection, serverTimestamp, runTransaction, doc } from '../firebase';
import { printService } from './printService';
import type { TicketItem } from '../types/menu';
// Importamos los nuevos tipos que acabamos de crear
import type { Order, PaymentDetails, OrderMode } from '../types/order';

export const orderService = {
  async createOrder(
    items: TicketItem[], 
    total: number, 
    mode: OrderMode, 
    orderNumber: number,
    cashierName: string, // <--- NUEVO: Recibimos el nombre del cajero aquí
    payment?: PaymentDetails 
  ): Promise<void> {
    
    const initialStatus = payment ? 'paid' : 'pending';

    // 1. Objeto para imprimir (Local - usa Date para que no falle la impresión)
    const printOrderData: Order = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: new Date(), // Fecha local para el ticket
      payment,
      cashier: cashierName
    };

    // 2. Objeto para Firebase (Base de Datos - usa serverTimestamp)
    const firebaseOrderData: Order = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: serverTimestamp(), // Marca de tiempo del servidor
      cashier: cashierName,
      ...(payment && { payment }) 
    };

    try {
      // --- INICIO DE TRANSACCIÓN DE INVENTARIO ---
      await runTransaction(db, async (transaction) => {
        
        // A. Identificar qué modificadores (ingredientes) se usaron
        const modifiersToDeduct = new Map<string, number>();

        items.forEach(item => {
            if (item.details?.selectedModifiers) {
                item.details.selectedModifiers.forEach(mod => {
                    const currentQty = modifiersToDeduct.get(mod.id) || 0;
                    modifiersToDeduct.set(mod.id, currentQty + 1);
                });
            }
        });

        // B. Leer stocks y preparar actualizaciones
        // Nota: Leemos todo antes de escribir nada (regla de Firestore)
        const updates = [];
        for (const [modId, qty] of modifiersToDeduct) {
            const modRef = doc(db, "modifiers", modId);
            const modDoc = await transaction.get(modRef);

            if (modDoc.exists()) {
                const data = modDoc.data();
                if (data.trackStock) {
                    const currentStock = data.currentStock || 0;
                    const newStock = currentStock - qty;
                    updates.push({ ref: modRef, newStock });
                }
            }
        }

        // C. Ejecutar escrituras
        // 1. Guardar la orden
        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, firebaseOrderData);

        // 2. Actualizar inventario
        updates.forEach(update => {
            transaction.update(update.ref, { currentStock: update.newStock });
        });
      });
      // --- FIN DE TRANSACCIÓN ---

      // 3. Imprimir Ticket solo si todo salió bien
      // (Opcional: podrías poner esto en un try-catch separado si no quieres 
      // que un fallo de impresora detenga el flujo, pero por ahora está bien aquí)
      printService.printReceipt(printOrderData);

    } catch (error) {
      console.error("Error crítico al procesar orden:", error);
      // YA NO hacemos alert() aquí. Lanzamos el error para que la UI lo maneje.
      throw error; 
    }
  }
};