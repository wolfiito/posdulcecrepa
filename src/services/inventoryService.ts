// src/services/inventoryService.ts
// Inventario por insumo y sucursal. Las cantidades van en unidad base (g, ml, pza).
import { db, doc, collection, getDocs, setDoc, deleteDoc, runTransaction, serverTimestamp, increment, query, orderBy, limit } from '../firebase';
import { deleteField } from 'firebase/firestore';
import type { DocumentData, DocumentReference, SetOptions } from 'firebase/firestore';
import type { Supply, SupplyMove, SupplyMoveType } from '../types/inventory';
import { logger } from './loggerService';

const stockRef = (branchId: string, supplyId: string) => doc(db, 'branches', branchId, 'supplies_stock', supplyId);
const newMoveRef = (branchId: string) => doc(collection(db, 'branches', branchId, 'supply_moves'));

type Usage = Record<string, number>;

// Transaction o WriteBatch: ambos tienen set(ref, data, options)
type SetWriter = { set(ref: DocumentReference, data: DocumentData, options: SetOptions): unknown };

/**
 * Agrega a una transacción o batch el descuento (sign = -1) o regreso (sign = +1) de insumos,
 * con su movimiento en el historial. No lee existencias: usa increment() para no pisar
 * otras ventas que ocurran al mismo tiempo.
 */
export const applySupplyUsage = (
    writer: SetWriter,
    branchId: string,
    usage: Usage,
    sign: 1 | -1,
    info: { type: SupplyMoveType; user: string; supplyNames: Record<string, string>; orderNumber?: number; note?: string }
) => {
    Object.entries(usage).forEach(([supplyId, qty]) => {
        if (!qty) return;
        const delta = sign * qty;
        writer.set(stockRef(branchId, supplyId), { stock: increment(delta), updatedAt: serverTimestamp() }, { merge: true });
        const move: Omit<SupplyMove, 'id'> = {
            supplyId,
            supplyName: info.supplyNames[supplyId] || supplyId,
            type: info.type,
            qty: delta,
            user: info.user,
            createdAt: serverTimestamp(),
            ...(info.orderNumber !== undefined ? { orderNumber: info.orderNumber } : {}),
            ...(info.note ? { note: info.note } : {})
        };
        writer.set(newMoveRef(branchId), move, { merge: true });
    });
};

/**
 * Devolución de algo que ya se preparó: los insumos se gastaron, así que la existencia
 * no cambia (ya se descontó al vender). Se registra en el historial como cancelación
 * de la venta + merma por la misma cantidad, para que el reporte de mermas lo refleje.
 */
export const recordPreparedWaste = (
    writer: SetWriter,
    branchId: string,
    usage: Usage,
    info: { user: string; supplyNames: Record<string, string>; orderNumber?: number; note?: string }
) => {
    Object.entries(usage).forEach(([supplyId, qty]) => {
        if (!qty) return;
        (['cancel', 'waste'] as const).forEach(type => {
            const move: Omit<SupplyMove, 'id'> = {
                supplyId,
                supplyName: info.supplyNames[supplyId] || supplyId,
                type,
                qty: type === 'cancel' ? qty : -qty,
                user: info.user,
                createdAt: serverTimestamp(),
                ...(info.orderNumber !== undefined ? { orderNumber: info.orderNumber } : {}),
                ...(info.note ? { note: info.note } : {})
            };
            writer.set(newMoveRef(branchId), move, { merge: true });
        });
    });
};

export const inventoryService = {
    // --- CATÁLOGO DE INSUMOS ---
    async getSupplies(): Promise<Supply[]> {
        const snap = await getDocs(collection(db, 'supplies'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Supply)).sort((a, b) => a.name.localeCompare(b.name));
    },

    async getSupplyNames(): Promise<Record<string, string>> {
        const supplies = await this.getSupplies();
        return Object.fromEntries(supplies.map(s => [s.id, s.name]));
    },

    async saveSupply(supply: Supply): Promise<string> {
        const id = supply.id || `sup_${Date.now()}`;
        await setDoc(doc(db, 'supplies', id), { ...supply, id, name: supply.name.trim() });
        return id;
    },

    async deleteSupply(supplyId: string) {
        await deleteDoc(doc(db, 'supplies', supplyId));
    },

    // --- MOVIMIENTOS MANUALES ---
    /**
     * Entrada (+), merma (-) o conteo físico (fija la existencia).
     * En transacción para registrar antes/después sin pisar ventas simultáneas.
     */
    async registerMove(
        branchId: string,
        supply: Supply,
        type: 'entry' | 'waste' | 'count',
        qty: number,
        user: string,
        note?: string
    ) {
        try {
            await runTransaction(db, async (transaction) => {
                const ref = stockRef(branchId, supply.id);
                const snap = await transaction.get(ref);
                const before = Number(snap.data()?.stock) || 0;
                const after = type === 'count' ? qty : type === 'entry' ? before + qty : before - qty;

                transaction.set(ref, { stock: after, updatedAt: serverTimestamp() }, { merge: true });
                const move: Omit<SupplyMove, 'id'> = {
                    supplyId: supply.id,
                    supplyName: supply.name,
                    type,
                    qty: after - before,
                    before,
                    after,
                    user,
                    createdAt: serverTimestamp(),
                    ...(note?.trim() ? { note: note.trim() } : {})
                };
                transaction.set(newMoveRef(branchId), move);
            });
        } catch (error) {
            logger.error(`Error al registrar movimiento de ${supply.name}`, error, { context: 'inventoryService.registerMove' });
            throw error;
        }
    },

    async updateStockSettings(branchId: string, supplyId: string, changes: { minStock?: number | null; outOfStock?: boolean }) {
        const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
        if (changes.outOfStock !== undefined) data.outOfStock = changes.outOfStock;
        // null = sin mínimo (quita la alerta)
        if (changes.minStock !== undefined) data.minStock = changes.minStock === null ? deleteField() : changes.minStock;
        await setDoc(stockRef(branchId, supplyId), data, { merge: true });
    },

    async getRecentMoves(branchId: string, max = 200): Promise<SupplyMove[]> {
        const q = query(collection(db, 'branches', branchId, 'supply_moves'), orderBy('createdAt', 'desc'), limit(max));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyMove));
    }
};
