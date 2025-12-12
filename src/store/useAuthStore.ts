// src/store/useAuthStore.ts
import { create } from 'zustand';
import { useUIStore } from './useUIStore';
import { authService } from '../services/authService'; // <--- Usamos el servicio
import type { User } from '../types/user'; // <--- Usamos los tipos

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
      // Delegamos la lógica de DB al servicio
      const user = await authService.loginWithPin(pin);
      
      // Si llegamos aquí, es que el login fue exitoso
      useUIStore.getState().setSection('pos');
      
      set({ 
        currentUser: user, 
        isLoading: false 
      });

    } catch (err: any) {
      console.error("Login error:", err);
      set({ 
          error: err.message || 'Error al iniciar sesión', 
          isLoading: false 
      });
    }
  },

  logout: () => {
    set({ currentUser: null });
    useUIStore.getState().setSection('pos'); 
  }
}));