// src/store/useInventoryStore.ts
import { create } from 'zustand';
import { db, collection, onSnapshot } from '../firebase';
import type { SupplyStock } from '../types/inventory';

interface InventoryState {
  // Existencias de insumos de la sucursal activa, por id de insumo
  stockData: Record<string, SupplyStock>;
  startListeningInventory: (branchId: string) => () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stockData: {},
  startListeningInventory: (branchId: string) => {
    if (!branchId) return () => {};

    const unsub = onSnapshot(collection(db, "branches", branchId, "supplies_stock"), (snap) => {
       const newStock: Record<string, SupplyStock> = {};
       snap.docs.forEach(doc => {
           newStock[doc.id] = doc.data() as SupplyStock;
       });
       set({ stockData: newStock });
    });

    return unsub;
  }
}));
