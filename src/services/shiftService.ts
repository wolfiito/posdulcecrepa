// src/services/shiftService.ts
import { db, collection, addDoc, updateDoc, getDocs, query, where, orderBy, limit, serverTimestamp, doc, Timestamp } from '../firebase';
import { reportService } from './reportService';

export interface Shift {
  id: string;
  userId: string;
  isOpen: boolean;
  openedBy: string;
  openedAt: Timestamp | Date; // Puede ser cualquiera de los dos
  initialFund: number;
  closedAt?: Timestamp | Date;
  finalCount?: number; 
  totalSalesCash?: number;
  totalExpenses?: number;
  expectedCash?: number; 
  difference?: number;   
}

export const shiftService = {
  async getCurrentShift(userId: string): Promise<Shift | null> {
    if (!userId) return null;

    const q = query(
        collection(db, 'shifts'), 
        where('userId', '==', userId), 
        where('isOpen', '==', true), 
        orderBy('openedAt', 'desc'), 
        limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    // Convertimos los datos crudos a nuestra interfaz Shift
    const data = snapshot.docs[0].data();
    return { 
        id: snapshot.docs[0].id, 
        ...data 
    } as Shift;
  },

  async openShift(initialFund: number, userId: string, userName: string): Promise<string> {
    const current = await this.getCurrentShift(userId);
    if (current) throw new Error("Ya tienes un turno abierto.");
    
    const docRef = await addDoc(collection(db, 'shifts'), {
      userId, 
      isOpen: true,
      openedBy: userName,
      openedAt: serverTimestamp(),
      initialFund: initialFund
    });
    return docRef.id;
  },

  async getShiftMetrics(shift: Shift) {
    // CORRECCIÓN 2: Validación de tipos segura para TypeScript
    // Verificamos si tiene el método toDate (es un Timestamp) o si ya es una fecha
    let startDate: Date;

    if (shift.openedAt instanceof Timestamp) {
        startDate = shift.openedAt.toDate();
    } else {
        // Si no es Timestamp, asumimos que es Date (o forzamos la conversión)
        startDate = new Date(shift.openedAt as any); 
    }

    const endDate = new Date(); 

    const report = await reportService.getReportByDateRange(startDate, endDate); 
    
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