// src/services/shiftService.ts
import { db, collection, addDoc, updateDoc, getDocs, query, where, orderBy, limit, serverTimestamp, doc, Timestamp } from '../firebase';
// Importamos el reporte
import { reportService } from './reportService';

export interface Shift {
  // ... (Mismos tipos que tenías, no cambies nada aquí)
  id: string;
  isOpen: boolean;
  openedBy: string;
  openedAt: any; 
  initialFund: number;
  closedAt?: any;
  finalCount?: number; 
  totalSalesCash?: number;
  totalExpenses?: number;
  expectedCash?: number; 
  difference?: number;   
}

export const shiftService = {
  // ... getCurrentShift y openShift quedan IGUAL ...
  async getCurrentShift(): Promise<Shift | null> {
    const q = query(collection(db, 'shifts'), where('isOpen', '==', true), orderBy('openedAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Shift;
  },

  async openShift(initialFund: number, user: string = 'Cajero #1'): Promise<string> {
    const current = await this.getCurrentShift();
    if (current) throw new Error("Ya hay un turno abierto.");
    const docRef = await addDoc(collection(db, 'shifts'), {
      isOpen: true,
      openedBy: user,
      openedAt: serverTimestamp(),
      initialFund: initialFund
    });
    return docRef.id;
  },

  // --- AQUÍ ESTÁ EL CAMBIO CRÍTICO PARA LA MADRUGADA ---
  async getShiftMetrics(shift: Shift) {
    // 1. Hora de Inicio Exacta (ej. 17:03 PM)
    const startDate = shift.openedAt instanceof Timestamp ? shift.openedAt.toDate() : new Date();
    
    // 2. Hora de Fin Exacta (Ahora mismo)
    const endDate = new Date(); 

    // 3. Pedimos reporte EXACTO entre esas dos horas (cruza días sin problema)
    const report = await reportService.getReportByDateRange(startDate, endDate); 
    
    // Calculamos efectivo esperado
    const expectedCash = shift.initialFund + report.cashTotal - report.totalExpenses;
    
    return {
      salesCash: report.cashTotal,
      expenses: report.totalExpenses,
      expectedCash
    };
  },

  async closeShift(shiftId: string, finalCount: number, metrics: { salesCash: number, expenses: number, expectedCash: number }) {
    const shiftRef = doc(db, 'shifts', shiftId);
    const difference = finalCount - metrics.expectedCash;

    await updateDoc(shiftRef, {
      isOpen: false,
      closedAt: serverTimestamp(),
      finalCount,
      totalSalesCash: metrics.salesCash,
      totalExpenses: metrics.expenses,
      expectedCash: metrics.expectedCash,
      difference
    });
  }
};