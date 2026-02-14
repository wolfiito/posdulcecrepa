// src/services/inventoryService.ts
import { db, doc, collection, getDocs, setDoc, writeBatch } from '../firebase';
import type { Modifier } from '../types/menu';

export interface BranchInventoryItem {
  id: string; // El mismo ID que el modificador global
  name: string;
  currentStock: number;
  trackStock: boolean;
  lastUpdated?: any;
}

export const inventoryService = {
  // 1. Obtener el inventario COMPLETO de una sucursal
  // (Fusiona la lista de modificadores globales con el stock local)
  async getBranchInventory(branchId: string): Promise<BranchInventoryItem[]> {
    // A. Traemos todos los modificadores globales (El catálogo maestro)
    const modsSnap = await getDocs(collection(db, 'modifiers'));
    const allModifiers = modsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Modifier));

    // B. Traemos el stock local de esta sucursal
    const inventorySnap = await getDocs(collection(db, 'branches', branchId, 'inventory'));
    const localStockMap = new Map<string, number>();
    
    inventorySnap.docs.forEach(doc => {
        localStockMap.set(doc.id, doc.data().currentStock || 0);
    });

    // C. Combinamos: Si no existe registro local, asumimos stock 0
    return allModifiers.map(mod => ({
        id: mod.id,
        name: mod.name,
        trackStock: mod.trackStock || false,
        currentStock: localStockMap.get(mod.id) || 0
    }));
  },

  // 2. Actualizar el stock de un ítem específico en una sucursal
  async updateStock(branchId: string, modifierId: string, newStock: number, modifierName: string) {
    const ref = doc(db, 'branches', branchId, 'inventory', modifierId);
    
    // Usamos setDoc con merge para crear el documento si es la primera vez que se asigna stock
    await setDoc(ref, {
        currentStock: newStock,
        name: modifierName, // Guardamos el nombre por redundancia/lectura rápida
        lastUpdated: new Date()
    }, { merge: true });
  },

  // 3. Inicializar inventario masivo (Para cuando abres una sucursal nueva)
  async initializeBranchInventory(branchId: string) {
    const modsSnap = await getDocs(collection(db, 'modifiers'));
    const batch = writeBatch(db);

    modsSnap.docs.forEach(modDoc => {
        const mod = modDoc.data();
        if (mod.trackStock) {
            const ref = doc(db, 'branches', branchId, 'inventory', modDoc.id);
            batch.set(ref, {
                currentStock: 0,
                name: mod.name,
                trackStock: true
            });
        }
    });

    await batch.commit();
  }
};