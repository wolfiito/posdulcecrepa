// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';
import { authService } from '../services/authService';

interface AuthState {
  // Estado
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => void;
  // Mantenemos esta por si necesitas setear usuario manualmente en pruebas
  setUser: (user: User) => void; 
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acción que conecta la pantalla de Login con Firebase
      loginWithPin: async (pin: string) => {
        set({ isLoading: true, error: null });
        try {
            const user = await authService.loginWithPin(pin);
            console.log("✅ Usuario logueado:", user);
            
            set({ 
              currentUser: user, 
              isAuthenticated: true, 
              isLoading: false 
            });
        } catch (err: any) {
            console.error("❌ Error Login:", err);
            set({ 
              error: err.message || 'PIN incorrecto', 
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