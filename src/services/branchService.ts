// src/services/branchService.ts
import { db, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from '../firebase';
import { inventoryService } from './inventoryService';
import type { Branch } from '../types/branch';
import { getDoc } from 'firebase/firestore';

export const branchService = {
  async getBranches(): Promise<Branch[]> {
    const snapshot = await getDocs(collection(db, 'branches'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
  },

  async createBranch(name: string, address: string, tableCount: number = 10): Promise<string> {
    try {
      
      const docRef = await addDoc(collection(db, 'branches'), {
        name,
        address,
        tableCount,
        isActive: true,
        createdAt: serverTimestamp()
      });

      await inventoryService.initializeBranchInventory(docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("Error creando sucursal:", error);
      throw error;
    }
  },
  async updateBranch(id: string, data: Partial<Branch>) {
    const ref = doc(db, 'branches', id);
    await updateDoc(ref, data);
  },

  async getBranchById(id: string): Promise<Branch | null> {
    const ref = doc(db, 'branches', id);
    const snap = await getDoc(ref);
    if (snap.exists()){
      return { id: snap.id, ...snap.data() } as Branch;
    }
    return null;
  }
};