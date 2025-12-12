import { db, collection, addDoc, updateDoc, getDocs, query, where, orderBy, limit, serverTimestamp, doc, Timestamp } from '../firebase';
import { reportService } from './reportService';

// Interfaz corregida: Sin 'any'
export interface Shift {
  id: string;
  isOpen: boolean;
  openedBy: string;
  openedAt: Timestamp | Date; // <--- Tipado correcto
  initialFund: number;
  closedAt?: Timestamp | Date;
  finalCount?: number; 
  totalSalesCash?: number;
  totalExpenses?: number;
  expectedCash?: number; 
  difference?: number;   
}

export const shiftService = {
  async getCurrentShift(): Promise<Shift | null> {
    const q = query(collection(db, 'shifts'), where('isOpen', '==', true), orderBy('openedAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    // Forzamos el tipado seguro al devolver
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Shift;
  },

  async openShift(initialFund: number, user: string): Promise<string> {
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

  async getShiftMetrics(shift: Shift) {
    // Manejo robusto de fechas: Si es Timestamp de Firebase lo convertimos, si es Date lo usamos
    const startDate = shift.openedAt instanceof Timestamp ? shift.openedAt.toDate() : (shift.openedAt as Date);
    const endDate = new Date(); 

    const report = await reportService.getReportByDateRange(startDate, endDate); 
    
    // Calculamos efectivo esperado: Caja Inicial + Ventas Efectivo - Gastos
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