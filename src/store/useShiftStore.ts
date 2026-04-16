// src/store/useShiftStore.ts
import { create } from 'zustand';
import { 
    db, 
    collection, 
    query, 
    where, 
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
      const { activeBranchId, currentUser } = useAuthStore.getState();
      if (!activeBranchId || !currentUser) return;

      // Si ya hay una escucha, checamos si es la misma o hay que cambiarla
      // Para simplificar, la cerramos y abrimos una nueva si se llama de nuevo
      const currentUnsubscribe = get().unsubscribeShift;
      if (currentUnsubscribe) {
          currentUnsubscribe();
      }

      set({ isLoading: true });

      // Query para buscar MI caja abierta (Filtramos por userId para aislamiento)
      // ELIMINAMOS orderBy para no requerir índice compuesto y evitar errores en dispositivos nuevos
      const q = query(
        collection(db, 'shifts'),
        where('branchId', '==', activeBranchId), 
        where('userId', '==', currentUser.id),
        where('isOpen', '==', true),
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
              
              set({ currentShift: safeShift, isLoading: false });
          } else {
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