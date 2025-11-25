// src/store/useAuthStore.ts
import { create } from 'zustand';
import { db, collection, query, where, getDocs } from '../firebase';
import { useUIStore } from './useUIStore';

export type UserRole = 'ADMIN' | 'GERENTE' | 'CAJERO' | 'MESERO';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string; 
}

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  loginWithPin: (pin: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  loginWithPin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      // Buscamos el usuario que tenga ese PIN
      const q = query(collection(db, 'users'), where('pin', '==', pin));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('PIN incorrecto');
      }

      // Tomamos el primero (los PINs deberían ser únicos)
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data() as User;
      
      useUIStore.getState().setSection('pos');
      // Guardamos el usuario con su ID
      set({ 
        currentUser: { ...userData, id: userDoc.id }, 
        isLoading: false 
      });

    } catch (err: any) {
      console.error("Login error:", err);
      set({ error: err.message || 'Error al iniciar sesión', isLoading: false });
    }
  },

  logout: () => {
    set({ currentUser: null });
    useUIStore.getState().setSection('pos'); // Reset al salir
  }
}));