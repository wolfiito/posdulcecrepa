// src/store/useShiftStore.ts
import { create } from 'zustand';
import { shiftService, type Shift } from '../services/shiftService';

interface ShiftState {
  currentShift: Shift | null;
  isLoading: boolean;
  
  // Acciones
  checkCurrentShift: () => Promise<void>;
  openShift: (amount: number) => Promise<void>;
  closeShift: (finalCount: number) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  isLoading: false,

  checkCurrentShift: async () => {
    set({ isLoading: true });
    try {
      const shift = await shiftService.getCurrentShift();
      set({ currentShift: shift });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  openShift: async (amount) => {
    set({ isLoading: true });
    await shiftService.openShift(amount);
    await get().checkCurrentShift(); // Recargar estado
    set({ isLoading: false });
  },

  closeShift: async (finalCount) => {
    const { currentShift } = get();
    if (!currentShift) return;

    set({ isLoading: true });
    // 1. Calcular métricas finales
    const metrics = await shiftService.getShiftMetrics(currentShift);
    // 2. Cerrar en BD
    await shiftService.closeShift(currentShift.id, finalCount, metrics);
    // 3. Limpiar estado
    set({ currentShift: null, isLoading: false });
  }
}));