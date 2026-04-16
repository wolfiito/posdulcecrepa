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
  // 1. Obtener movimientos (Hoy o por Turno específico)
  async getDailyMovements(branchId?: string, shiftId?: string): Promise<Movement[]> {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Si tenemos shiftId, es mejor filtrar por él directamente (más eficiente e index-ready)
      if (shiftId) {
        const qShift = query(
            collection(db, 'movements'),
            where('shiftId', '==', shiftId),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(qShift);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Movement));
      }

      // De lo contrario, buscamos los del día en la sucursal
      let q = query(
          collection(db, 'movements'),
          where('createdAt', '>=', startOfDay),
          orderBy('createdAt', 'desc')
      );

      if (branchId) {
          q = query(
              collection(db, 'movements'),
              where('branchId', '==', branchId),
              where('createdAt', '>=', startOfDay),
              orderBy('createdAt', 'desc')
          );
      }

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
      userName?: string,
      branchId?: string
  ) {
      await addDoc(collection(db, 'movements'), {
          type,
          category,
          amount,
          description,
          createdAt: serverTimestamp(),
          date: serverTimestamp(), // Redundancia útil para reportes
          shiftId: shiftId || null, // Importante para el corte de caja
          registeredBy: userName || 'Sistema',
          branchId: branchId || null // <--- FIX CLAVE PARA REPORTES
      });
  },

  // 3. Eliminar movimiento
  async deleteMovement(id: string) {
      await deleteDoc(doc(db, 'movements', id));
  }
};