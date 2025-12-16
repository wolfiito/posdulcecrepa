// src/services/movementService.ts
import { 
  db, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp,
} from '../firebase';
import type { Movement, MovementType, MovementCategory } from '../types/movement';

export const movementService = {
  // 1. Obtener movimientos del día (Desde las 00:00 hrs)
  async getDailyMovements(): Promise<Movement[]> {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const q = query(
          collection(db, 'movements'),
          where('createdAt', '>=', startOfDay),
          orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Movement));
  },

  // 2. Registrar nuevo movimiento
  async addMovement(
      type: MovementType, 
      category: MovementCategory, 
      amount: number, 
      description: string,
      shiftId?: string,
      userName?: string
  ) {
      await addDoc(collection(db, 'movements'), {
          type,
          category,
          amount,
          description,
          createdAt: serverTimestamp(),
          date: serverTimestamp(), // Redundancia útil para reportes
          shiftId: shiftId || null, // Importante para el corte de caja
          registeredBy: userName || 'Sistema'
      });
  },

  // 3. Eliminar movimiento
  async deleteMovement(id: string) {
      await deleteDoc(doc(db, 'movements', id));
  }
};