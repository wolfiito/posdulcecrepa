// src/services/userService.ts
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from '../firebase';
import type { User, UserRole } from '../types/user';

export const userService = {
  // Obtener todos
  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  // Crear con validación (Tu lógica original mejorada)
  async createUser(user: Omit<User, 'id'>): Promise<string> {
    // 1. VALIDACIÓN ANTI-DUPLICADOS
    const q = query(collection(db, 'users'), where('username', '==', user.username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`El usuario "${user.username}" ya está registrado.`);
    }

    // 2. Crear
    const docRef = await addDoc(collection(db, 'users'), {
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role
    });
    
    return docRef.id;
  },

  // Editar (Nuevo)
  async updateUser(id: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', id);
    // Nota: Aquí podrías agregar validación si cambian el username, 
    // pero por simplicidad permitimos editar sin checar duplicados en edición.
    await updateDoc(userRef, data);
  },

  // Eliminar
  async deleteUser(userId: string) {
    await deleteDoc(doc(db, 'users', userId));
  }
};