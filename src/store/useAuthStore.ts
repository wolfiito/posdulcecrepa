// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';
import { authService } from '../services/authService';

interface AuthState {

  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  loginWithCredentials: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void; 
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Se conecta el Login con Firebase
      loginWithCredentials: async (username: string, pass: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.loginWithCredentials(username, pass);                      
          set({ currentUser: user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            set({ 
              error: err.message || 'Credenciales incorrectas', 
              isLoading: false 
            });
        }
      },

      logout: () => set({ 
        currentUser: null, 
        isAuthenticated: false, 
        error: null 
      }),

      setUser: (user: User) => set({ 
        currentUser: user, 
        isAuthenticated: true 
      }),
    }),
    {
      name: 'auth-storage',
      // Solo guardamos el usuario y si está autenticado, no el estado de carga o errores
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        isAuthenticated: state.isAuthenticated 
      }), 
    }
  )
);