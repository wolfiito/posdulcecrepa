// src/store/useInventoryStore.ts
import { create } from 'zustand';
import { db, collection, onSnapshot } from '../firebase';

interface InventoryState {
  stockData: Record<string, { trackStock?: boolean; currentStock?: number }>;
  startListeningInventory: (branchId: string) => () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stockData: {},
  startListeningInventory: (branchId: string) => {
    if (!branchId) return () => {};
    
    // Escuchamos el inventario específico de esta sucursal
    const unsub = onSnapshot(collection(db, "branches", branchId, "inventory"), (snap) => {
       const newStock: Record<string, any> = {};
       snap.docs.forEach(doc => {
           newStock[doc.id] = doc.data(); // Guardamos { trackStock: true, currentStock: 5 }
       });
       set({ stockData: newStock });
    });
    
    return unsub;
  }
}));