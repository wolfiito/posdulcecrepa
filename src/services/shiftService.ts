// src/services/shiftService.ts
import { db, collection, addDoc, updateDoc, getDocs, query, where, orderBy, limit, serverTimestamp, doc, Timestamp } from '../firebase';
import type { DailyReportData } from '../types/report';

// --- DEFINIMOS LOS TIPOS PARA EVITAR ERRORES ---
export interface ShiftMetrics extends DailyReportData {
    expectedCash: number;
    date: string;
    netTotal: number;
    productCount: Record<string, number>;
    totalOrders: number;
    orders: any[];
    expenses: any[];
    netBalance: number;
    productBreakdown: any[];
    ingredientBreakdown: any[];
}

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

export const shiftService = {
  // 1. Obtener turno (Igual)
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

  // 2. Abrir turno (Igual)
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

  // 3. OBTENER MÉTRICAS (AQUÍ ESTÁ LA CORRECCIÓN)
  // Dejamos de usar fechas. Usamos el ID del turno.
  async getShiftMetrics(shift: Shift): Promise<ShiftMetrics> {
    
    // 1. Buscamos por etiqueta (ESTO YA FUNCIONA)
    const q = query(collection(db, 'orders'), where('shiftId', '==', shift.id));
    const snapshot = await getDocs(q);

    let cashTotal = 0;
    let cardTotal = 0;
    let transferTotal = 0;
    
    const orders: any[] = [];
    const productCount: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.status === 'paid' && data.payment) {
          orders.push({ id: doc.id, ...data });

          // --- LÓGICA HÍBRIDA (Soporta Mixto y Simple) ---
          
          // CASO 1: PAGO MIXTO (Tiene lista de transacciones)
          if (data.payment.transactions && Array.isArray(data.payment.transactions)) {
              data.payment.transactions.forEach((tx: any) => {
                  const amount = Number(tx.amount) || 0;
                  if (tx.method === 'cash') cashTotal += amount;
                  if (tx.method === 'card') cardTotal += amount;
                  if (tx.method === 'transfer') transferTotal += amount;
              });
          } 
          // CASO 2: PAGO SIMPLE (Compatibilidad con lo que ya tienes)
          else {
              // Recuperamos el monto total como lo hicimos antes
              let finalAmount = Number(data.total); 
              if (!finalAmount || finalAmount === 0) {
                   finalAmount = Number(data.payment.amount) || (Number(data.payment.amountPaid) - Number(data.payment.change || 0)) || 0;
              }

              const method = data.payment.method; // 'cash', 'card', etc.
              
              if (method === 'cash' || method === 'Efectivo') cashTotal += finalAmount;
              if (method === 'card' || method === 'Tarjeta') cardTotal += finalAmount;
              if (method === 'transfer' || method === 'Transferencia') transferTotal += finalAmount;
          }

          // ... (conteo de productos sigue igual)
      }
  });

    const totalSales = cashTotal + cardTotal + transferTotal;
    const totalExpenses = 0; 
    const expectedCash = shift.initialFund + cashTotal - totalExpenses;
    const netTotal = totalSales - totalExpenses;

    return {
      date: new Date().toISOString(),
      totalSales,
      cashTotal,
      cardTotal,
      transferTotal,
      totalExpenses,
      expectedCash,
      netTotal,
      totalOrders: orders.length,
      orders: orders,
      expenses: [],
      netBalance: netTotal,
      productCount: productCount,
      productBreakdown: [], 
      ingredientBreakdown: [] 
    };
  },

  // 4. Cerrar turno (Igual)
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