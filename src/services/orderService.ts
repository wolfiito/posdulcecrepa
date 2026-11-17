// src/services/orderService.ts
import { db, collection, serverTimestamp, runTransaction, doc, writeBatch } from '../firebase';
import type { WriteBatch } from 'firebase/firestore';
import { printService } from './printService';
import { logger } from './loggerService';
import type { TicketItem } from '../types/menu';
import type { PaymentDetails, OrderMode, KitchenStatus } from '../types/order';
import { applySupplyUsage, inventoryService, recordPreparedWaste } from './inventoryService';
import { sumSupplyUsage } from '../utils/inventory';

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

// 'restore' = no se preparó, los insumos regresan; 'waste' = ya se preparó, es merma
export type ReturnMode = 'restore' | 'waste';

export interface ReturnOptions {
    user?: string;
    mode?: ReturnMode;
    orderNumber?: number;
}

// Órdenes anteriores al inventario por insumo no traen supplyUsage: no mueven nada
const returnSupplies = async (batch: WriteBatch, branchId: string, usage: Record<string, number>, opts: ReturnOptions) => {
    if (Object.keys(usage).length === 0) return;
    const supplyNames = await inventoryService.getSupplyNames();
    const info = { user: opts.user || 'Sistema', supplyNames, orderNumber: opts.orderNumber };
    if (opts.mode === 'waste') {
        recordPreparedWaste(batch, branchId, usage, { ...info, note: 'Devolución de algo ya preparado' });
    } else {
        applySupplyUsage(batch, branchId, usage, 1, { ...info, type: 'cancel', note: 'Devolución sin preparar' });
    }
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

    // 1. HARDENING: Si es una mesa y no hay nombre, el nombre ES la mesa
    const isMesa = mode.startsWith('Mesa ');
    const finalCustomerName = (isMesa && !customerName) ? mode : (customerName || 'Cliente Anónimo');

    // Consumo de insumos ya calculado en cada artículo (supplyUsage)
    const usage = sumSupplyUsage(items);
    const supplyNames = Object.keys(usage).length > 0 ? await inventoryService.getSupplyNames() : {};

    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db,"branches", branchId, "counters", "orders");

        const counterSnap = await transaction.get(counterRef);

        // --- CREAR NUEVA ORDEN (SIEMPRE NUEVA PARA EL KDS) ---
        let currentCount = 0;
        if (counterSnap.exists()) {
            currentCount = counterSnap.data().count || 0;
        }
        finalOrderNumber = currentCount + 1;
        transaction.set(counterRef, { count: finalOrderNumber }, { merge: true });

        const cleanItems = cleanUndefined(items);
        const cleanPayment = payment ? cleanUndefined(payment) : undefined;
        
        const firebaseOrderData: any = {
            branchId: branchId || 'sin-sucursal',
            items: cleanItems,
            total: total || 0,
            mode: mode || 'Para Llevar',
            status: initialStatus,
            kitchenStatus: initialKitchenStatus,
            orderNumber: finalOrderNumber,
            customerName: finalCustomerName,
            createdAt: serverTimestamp(),
            cashier: cashierName || 'Cajero',
        };

        if (cleanPayment) firebaseOrderData.payment = cleanPayment;
        if (shiftId) firebaseOrderData.shiftId = shiftId;
        
        const newOrderRef = doc(collection(db, "orders")); 
        transaction.set(newOrderRef, firebaseOrderData);
        
        // --- INVENTARIO: descuenta los insumos de las recetas (puede quedar negativo) ---
        if (Object.keys(usage).length > 0) {
            applySupplyUsage(transaction, branchId, usage, -1, {
                type: 'sale', user: cashierName || 'Cajero', supplyNames, orderNumber: finalOrderNumber
            });
        }
      });

      if (shouldPrint) {
        printService.printReceipt({
            branchId,
            items,
            total,
            mode,
            status: initialStatus,
            kitchenStatus: initialKitchenStatus,
            orderNumber: finalOrderNumber,
            customerName: finalCustomerName,
            createdAt: new Date(),
            payment,
            cashier: cashierName
        });
    }

    return finalOrderNumber;

    } catch (error) {
      logger.error("Error crítico al crear orden", error, { context: 'orderService.createOrder' });
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

  async cancelOrder(branchId: string, orderId: string, items: TicketItem[], opts: ReturnOptions = {}) {
    try {
        const batch = writeBatch(db);
        const orderRef = doc(db, "orders", orderId);

        // 1. Marcar como cancelada
        batch.update(orderRef, { 
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            cancelMode: opts.mode || 'restore'
        });

        // 2. Regresar los insumos o registrarlos como merma
        await returnSupplies(batch, branchId, sumSupplyUsage(items), opts);

        await batch.commit();
        return true;
    } catch (error) {
        logger.error("Error al cancelar orden", error, { context: 'orderService.cancelOrder' });
        throw error;
    }
  },

  async removeItemFromOrder(branchId: string, orderId: string, itemToRemove: TicketItem, remainingItems: TicketItem[], newTotal: number, opts: ReturnOptions = {}) {
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

        // 2. Regresar los insumos de la unidad eliminada o registrarlos como merma
        await returnSupplies(batch, branchId, sumSupplyUsage([itemToRemove]), opts);

        await batch.commit();
        return true;
    } catch (error) {
        logger.error("Error al eliminar item de orden", error, { context: 'orderService.removeItemFromOrder' });
        throw error;
    }
  }
};