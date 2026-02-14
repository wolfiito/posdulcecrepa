// src/services/userService.ts
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from '../firebase';
import type { User } from '../types/user';
import type { Branch } from '../types/branch';

export const userService = {
  
  async getBranches(): Promise<Branch[]> {
    const snapshot = await getDocs(collection(db, 'branches'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
  },

  async getUsers(branchId?: string): Promise<User[]> {
    let q;
    
    if (branchId) {
      // Si hay sucursal activa, traemos solo sus empleados
      q = query(collection(db, 'users'), where('branchId', '==', branchId));
    } else {
      // (Opcional) Si es SuperAdmin global, podría ver todos, 
      // pero por seguridad inicial traemos todos o manejamos lógica vacía
      q = query(collection(db, 'users'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  async createUser(user: Omit<User, 'id'>): Promise<string> {
    // Validación Anti-Duplicados
    const q = query(collection(db, 'users'), where('username', '==', user.username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`El usuario "${user.username}" ya está registrado.`);
    }

    const docRef = await addDoc(collection(db, 'users'), {
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role,
      branchId: user.branchId
    });
    
    return docRef.id;
  },

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, data);
  },

  async deleteUser(userId: string) {
    await deleteDoc(doc(db, 'users', userId));
  }
};