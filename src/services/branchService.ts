// src/services/branchService.ts
import { db, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from '../firebase';
import { inventoryService } from './inventoryService';
import type { Branch } from '../types/branch';

export const branchService = {
  
  // Obtener todas las sucursales
  async getBranches(): Promise<Branch[]> {
    const snapshot = await getDocs(collection(db, 'branches'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
  },

  // Crear nueva sucursal + Inicializar su inventario
  async createBranch(name: string, address: string): Promise<string> {
    try {
      // 1. Crear el documento de la sucursal
      const docRef = await addDoc(collection(db, 'branches'), {
        name,
        address,
        isActive: true,
        createdAt: serverTimestamp()
      });

      // 2. Mágicamente crearle su inventario base (con stock 0)
      // Esto usa la función que creamos en el paso anterior
      await inventoryService.initializeBranchInventory(docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("Error creando sucursal:", error);
      throw error;
    }
  },

  // Editar sucursal
  async updateBranch(id: string, data: Partial<Branch>) {
    const ref = doc(db, 'branches', id);
    await updateDoc(ref, data);
  }
};