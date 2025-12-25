// src/services/userService.ts
import { db, collection, getDocs, addDoc, deleteDoc, doc, query, where } from '../firebase';
import type { User, UserRole } from '../types/user';

export const userService = {
  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  async createUser(name: string, username: string, pass: string, role: UserRole) {
    // 1. VALIDACIÓN ANTI-DUPLICADOS
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`El usuario "${username}" ya está registrado.`);
    }

    // 2. Si no existe, procedemos a crear
    await addDoc(collection(db, 'users'), {
      name,
      username,
      password: pass,
      role
    });
  },

  async deleteUser(userId: string) {
    await deleteDoc(doc(db, 'users', userId));
  }
};