// src/services/movementService.ts
import { db, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, deleteDoc, doc } from '../firebase';

export type MovementType = 'IN' | 'OUT'; // Entrada o Salida
export type MovementCategory = 'INSUMO' | 'SERVICIO' | 'NOMINA' | 'MANTENIMIENTO' | 'RETIRO' | 'FONDO_EXTRA' | 'OTRO';

export interface Movement {
  id: string;
  type: MovementType;
  category: MovementCategory;
  amount: number;
  description: string;
  createdAt: any;
  shiftId?: string; // Opcional: Para ligarlo al turno actual
}

export const movementService = {
  // 1. Registrar un movimiento
  async addMovement(type: MovementType, category: MovementCategory, amount: number, description: string) {
    try {
      await addDoc(collection(db, "movements"), {
        type,
        category,
        amount,
        description,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      throw error;
    }
  },

  // 2. Obtener movimientos del día (o turno)
  async getDailyMovements(date: Date = new Date()): Promise<Movement[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "movements"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Movement));
  },

  // 3. Eliminar un movimiento (por si se equivocaron)
  async deleteMovement(id: string) {
    await deleteDoc(doc(db, "movements", id));
  }
};