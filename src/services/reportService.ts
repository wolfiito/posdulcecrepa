// src/services/reportService.ts
import { db, collection, query, where, orderBy, getDocs, serverTimestamp, addDoc } from '../firebase';
import type { Order } from './orderService';

export interface ProductSummary {
  name: string;
  quantity: number;
  total: number;
}

export interface IngredientSummary {
  name: string;
  quantity: number;
}

export interface Expense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  createdAt: any;
}

export interface DailyReportData {
  totalSales: number;
  totalOrders: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  totalExpenses: number;
  netBalance: number;
  orders: Order[];
  expenses: Expense[];
  productBreakdown: ProductSummary[];
  ingredientBreakdown: IngredientSummary[];
}

export const reportService = {
  // --- FUNCIÓN NÚCLEO: Genera reporte entre dos momentos EXACTOS ---
  // Esta es la que usará el Corte de Caja para respetar horas de madrugada
  async getReportByDateRange(start: Date, end: Date): Promise<DailyReportData> {
    try {
      // 1. Consultar Ventas (Orders) en el rango exacto
      const qOrders = query(
        collection(db, "orders"),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "asc")
      );

      // 2. Consultar Gastos (Movements tipo OUT) en el rango exacto
      const qExpenses = query(
        collection(db, "movements"),
        where("type", "==", "OUT"),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "asc")
      );

      const [snapOrders, snapExpenses] = await Promise.all([
        getDocs(qOrders),
        getDocs(qExpenses)
      ]);

      // --- PROCESAMIENTO ---
      const orders: Order[] = [];
      let totalSales = 0;
      let cashTotal = 0;
      let cardTotal = 0;
      let transferTotal = 0;
      
      const productMap = new Map<string, ProductSummary>();
      const ingredientMap = new Map<string, number>();

      snapOrders.forEach((doc) => {
        const data = doc.data() as Order;
        if (data.status === 'paid') {
            orders.push(data);
            totalSales += data.total;

            const method = data.payment?.method;
            if (method === 'cash') cashTotal += data.total; 
            else if (method === 'card') cardTotal += data.total;
            else if (method === 'transfer') transferTotal += data.total;

            data.items.forEach((item) => {
                // Productos
                const variantSuffix = item.details?.variantName ? ` (${item.details.variantName})` : '';
                const fullName = item.baseName + variantSuffix;
                
                const existing = productMap.get(fullName);
                if (existing) {
                    existing.quantity += 1;
                    existing.total += item.finalPrice;
                } else {
                    productMap.set(fullName, { name: fullName, quantity: 1, total: item.finalPrice });
                }

                // Insumos
                if (item.details?.selectedModifiers) {
                    item.details.selectedModifiers.forEach(mod => {
                        const currentCount = ingredientMap.get(mod.name) || 0;
                        ingredientMap.set(mod.name, currentCount + 1);
                    });
                }
            });
        }
      });

      // Gastos
      const expenses: Expense[] = [];
      let totalExpenses = 0;
      snapExpenses.forEach(doc => {
          const d = doc.data();
          expenses.push({ 
            id: doc.id, 
            description: d.description,
            amount: d.amount,
            category: d.category || 'General',
            createdAt: d.createdAt 
          });
          totalExpenses += d.amount;
      });

      return {
        totalSales,
        totalOrders: orders.length,
        cashTotal,
        cardTotal,
        transferTotal,
        totalExpenses,
        netBalance: totalSales - totalExpenses,
        orders,
        expenses,
        productBreakdown: Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity),
        ingredientBreakdown: Array.from(ingredientMap.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
      };

    } catch (error) {
      console.error("Error generando reporte:", error);
      throw error;
    }
  },

  // --- HELPERS PARA REPORTES DE CALENDARIO ---
  // Estos fuerzan 00:00 a 23:59 para la pantalla de "Reportes Mensuales"
  async getDailyReport(date: Date = new Date()): Promise<DailyReportData> {
    return this.getRangeReport(date, date);
  },

  async getRangeReport(startDate: Date, endDate: Date): Promise<DailyReportData> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Forzar inicio del día
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Forzar fin del día

    return this.getReportByDateRange(start, end);
  }
};