// src/services/movementService.ts
import { db, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, deleteDoc, doc } from '../firebase';
import type { Movement, MovementCategory, MovementType } from '../types/movement';

export const movementService = {
  // 1. Registrar un movimiento (Ahora pedimos shiftId y usuario)
  async addMovement(
      type: MovementType, 
      category: MovementCategory, 
      amount: number, 
      description: string,
      shiftId?: string,     // <--- IMPORTANTE: ID del turno actual
      userName?: string     // <--- IMPORTANTE: Quién lo hizo
  ) {
    try {
      // Creamos el objeto limpio
      const newMovement = {
        type,
        category,
        amount,
        description,
        createdAt: serverTimestamp(),
        ...(shiftId && { shiftId }),        // Solo lo agrega si existe
        ...(userName && { registeredBy: userName }) 
      };

      await addDoc(collection(db, "movements"), newMovement);
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      throw error;
    }
  },

  // 2. Obtener movimientos del día
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
    // Mapeamos forzando el tipo Movement para que TS no llore
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Movement));
  },

  // 3. Eliminar un movimiento
  async deleteMovement(id: string) {
    await deleteDoc(doc(db, "movements", id));
  }
};