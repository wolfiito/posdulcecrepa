// src/services/userService.ts
import { db, collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, where } from '../firebase';
import type { User, UserRole } from '../store/useAuthStore';

export const userService = {
  // 1. Obtener todos los empleados
  async getUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, 'users'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }
  },

  // 2. Crear nuevo empleado
  async createUser(name: string, pin: string, role: UserRole) {
    // Validar que el PIN no exista ya
    const q = query(collection(db, 'users'), where('pin', '==', pin));
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("Este PIN ya está en uso por otro empleado.");
    }

    await addDoc(collection(db, 'users'), { name, pin, role });
  },

  // 3. Eliminar empleado
  async deleteUser(id: string) {
    await deleteDoc(doc(db, 'users', id));
  }
};