import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';
import { authService } from '../services/authService';

interface AuthState {

  currentUser: User | null;
  activeBranchId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  loginWithCredentials: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void; 
  setActiveBranch: (branchId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      activeBranchId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithCredentials: async (username: string, pass: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.loginWithCredentials(username, pass);                      
          set({ 
            currentUser: user, 
            activeBranchId: user.branchId || null,
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
        } catch (err: any) {
            set({ 
              error: err.message || 'Credenciales incorrectas', 
              isLoading: false 
            });
        }
      },

      logout: () => set({ 
        currentUser: null, 
        activeBranchId: null,
        isAuthenticated: false, 
        error: null 
      }),

      setUser: (user: User) => set({ 
        currentUser: user,
        activeBranchId: user.branchId || null,
        isAuthenticated: true 
      }),
      
      setActiveBranch: (branchId: string) => set ({
        activeBranchId: branchId
      }),
    }),
    {
      name: 'auth-storage',

      partialize: (state) => ({ 
        currentUser: state.currentUser,
        activeBranchId: state.activeBranchId, 
        isAuthenticated: state.isAuthenticated 
      }), 
    }
  )
);