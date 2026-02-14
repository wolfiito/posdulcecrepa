// src/store/useShiftStore.ts
import { create } from 'zustand';
import { 
    db, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot, 
    Timestamp 
} from '../firebase';
import { shiftService, type Shift } from '../services/shiftService';
import { useAuthStore } from './useAuthStore';

interface ShiftState {
  currentShift: Shift | null;
  isLoading: boolean;
  unsubscribeShift: (() => void) | null; // Para detener la escucha al salir
  
  // Acciones
  startListeningToShift: () => void;
  stopListeningToShift: () => void;
  openShift: (amount: number) => Promise<void>;
  closeShift: (finalCount: number) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  isLoading: false,
  unsubscribeShift: null,

  // 1. ESCUCHA EN TIEMPO REAL (La clave de la solución)
  startListeningToShift: () => {
      // Evitar dobles suscripciones
      if (get().unsubscribeShift) return;

      const { activeBranchId } = useAuthStore.getState();
      if (!activeBranchId) return;

      set({ isLoading: true });

      // Query para buscar MI caja abierta
      const q = query(
        collection(db, 'shifts'),
        where('branchId', '==', activeBranchId), 
        where('isOpen', '==', true),
        orderBy('openedAt', 'desc'),
        limit(1)
    );

      // onSnapshot se ejecuta cada vez que cambia algo en la BD
      const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
              const docData = snapshot.docs[0].data();
              const safeShift = {
                  id: snapshot.docs[0].id,
                  ...docData,
                  openedAt: docData.openedAt instanceof Timestamp ? docData.openedAt.toDate() : docData.openedAt
              } as Shift;
              
              console.log("🟢 CAJA DETECTADA ABIERTA:", safeShift.id);
              set({ currentShift: safeShift, isLoading: false });
          } else {
              console.log("🔴 CAJA CERRADA O INEXISTENTE");
              set({ currentShift: null, isLoading: false });
          }
      }, (error) => {
          console.error("Error escuchando turno:", error);
          set({ isLoading: false });
      });

      set({ unsubscribeShift: unsubscribe });
  },

  stopListeningToShift: () => {
      const { unsubscribeShift } = get();
      if (unsubscribeShift) {
          unsubscribeShift();
          set({ unsubscribeShift: null, currentShift: null });
      }
  },

  openShift: async (amount) => {
    const { currentUser, activeBranchId } = useAuthStore.getState();
    if (!currentUser?.id || !activeBranchId) {
        throw new Error("Faltan datos de usuario o sucursal");
    }
    await shiftService.openShift(
        amount, 
        currentUser.id, 
        currentUser.name || 'Cajero', 
        activeBranchId
    );
  },

  closeShift: async (finalCount) => {
    const { currentShift } = get();
    if (!currentShift) return;
    
    const metrics = await shiftService.getShiftMetrics(currentShift);
    await shiftService.closeShift(currentShift.id, finalCount, metrics);
  }
}));