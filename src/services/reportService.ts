// src/services/reportService.ts
import { db, collection, query, where, orderBy, getDocs } from '../firebase';
import type { Order } from './orderService';

export interface DailyReportData {
  totalSales: number;
  totalOrders: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  orders: Order[];
}

export const reportService = {
  async getDailyReport(date: Date = new Date()): Promise<DailyReportData> {
    // 1. Definir Rango de Tiempo: Desde las 00:00 hasta las 23:59 de HOY
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    try {
      // 2. Consultar Firebase
      const q = query(
        collection(db, "orders"),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      let totalSales = 0;
      let cashTotal = 0;
      let cardTotal = 0;
      let transferTotal = 0;

      // 3. Procesar cada orden
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Order;
        
        // Solo contamos lo que SÍ se pagó
        if (data.status === 'paid') {
            orders.push(data);
            totalSales += data.total;

            const method = data.payment?.method;
            // En efectivo sumamos lo que costó la orden (no lo que entregó el cliente)
            if (method === 'cash') cashTotal += data.total; 
            else if (method === 'card') cardTotal += data.total;
            else if (method === 'transfer') transferTotal += data.total;
        }
      });

      return {
        totalSales,
        totalOrders: orders.length,
        cashTotal,
        cardTotal,
        transferTotal,
        orders
      };

    } catch (error) {
      console.error("Error generando reporte:", error);
      throw error;
    }
  }
};