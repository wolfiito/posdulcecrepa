// src/services/shiftService.ts
import { db, collection, addDoc, updateDoc, getDocs, query, where, orderBy, limit, serverTimestamp, doc, Timestamp } from '../firebase';
import { reportService } from './reportService';
import type { DailyReportData } from '../types/report'; // Importamos el tipo completo

export interface Shift {
  id: string;
  userId: string;
  isOpen: boolean;
  openedBy: string;
  openedAt: Timestamp | Date;
  initialFund: number;
  closedAt?: Timestamp | Date;
  finalCount?: number; 
  totalSalesCash?: number;
  totalExpenses?: number;
  expectedCash?: number; 
  difference?: number;   
}

// Interfaz extendida para el Corte Z
export interface ShiftMetrics extends DailyReportData {
    expectedCash: number;
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
    const data = snapshot.docs[0].data();
    return { id: snapshot.docs[0].id, ...data } as Shift;
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

  // --- MEJORA CLAVE: Devolvemos métricas completas ---
  async getShiftMetrics(shift: Shift): Promise<ShiftMetrics> {
    let startDate: Date;
    if (shift.openedAt instanceof Timestamp) {
        startDate = shift.openedAt.toDate();
    } else {
        startDate = new Date(shift.openedAt as any); 
    }
    const endDate = new Date(); 

    // Obtenemos el reporte completo del rango de tiempo de la caja
    const report = await reportService.getReportByDateRange(startDate, endDate);
    
    // Calculamos lo que DEBE haber en el cajón
    // Caja Inicial + Ventas Efectivo - Salidas de Dinero
    const expectedCash = shift.initialFund + report.cashTotal - report.totalExpenses;
    
    return {
      ...report, // Esparcimos todos los datos (ventas totales, tarjetas, productos, etc.)
      expectedCash
    };
  },

  async closeShift(shiftId: string, finalCount: number, metrics: ShiftMetrics) {
    const shiftRef = doc(db, 'shifts', shiftId);
    const difference = finalCount - metrics.expectedCash;

    await updateDoc(shiftRef, {
      isOpen: false,
      closedAt: serverTimestamp(),
      finalCount,
      totalSalesCash: metrics.cashTotal,
      totalExpenses: metrics.totalExpenses,
      expectedCash: metrics.expectedCash,
      difference
    });
  }
};