// src/services/reportService.ts
import { db, collection, query, where, orderBy, getDocs } from '../firebase';
import type { Modifier } from '../types/menu';
import type { Order } from '../types/order'; 
import type { DailyReportData, Expense, ProductSummary } from '../types/report';

export const reportService = {
  // --- FUNCIÓN NÚCLEO: Genera reporte entre dos momentos EXACTOS ---
  async getReportByDateRange(start: Date, end: Date): Promise<DailyReportData> {
    try {
      // 1. Consultar Ventas (Orders)
      const qOrders = query(
        collection(db, "orders"),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "asc")
      );

      // 2. Consultar Gastos (Movements tipo OUT)
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
        const data = { id: doc.id, ...doc.data() } as Order;
        
        if (data.status === 'paid') {
            orders.push(data);
            
            // Sumamos al total general
            totalSales += data.total;

            // --- CORRECCIÓN AQUÍ: LÓGICA DE PAGO MIXTO ---
            const payment = data.payment;

            // CASO 1: Es un pago dividido (Mixto)
            if (payment?.transactions && Array.isArray(payment.transactions)) {
                payment.transactions.forEach((tx: any) => {
                    const amount = Number(tx.amount) || 0;
                    if (tx.method === 'cash') cashTotal += amount;
                    if (tx.method === 'card') cardTotal += amount;
                    if (tx.method === 'transfer') transferTotal += amount;
                });
            } 
            // CASO 2: Es un pago simple (Legacy / Normal)
            else if (payment) {
                // Usamos el total de la orden para evitar errores de campos faltantes
                let finalAmount = Number(data.total);
                
                // Backup por si acaso
                if (!finalAmount || finalAmount === 0) {
                     finalAmount = Number(payment.amountPaid) || 0;
                }

                if (payment.method === 'cash') cashTotal += finalAmount;
                else if (payment.method === 'card') cardTotal += finalAmount;
                else if (payment.method === 'transfer') transferTotal += finalAmount;
            }

            // Desglose de Productos e Ingredientes (Esto sigue igual)
            data.items.forEach((item) => {
                const variantSuffix = item.details?.variantName ? ` (${item.details.variantName})` : '';
                const fullName = item.baseName + variantSuffix;
                
                const existing = productMap.get(fullName);
                if (existing) {
                    existing.quantity += 1;
                    existing.total += item.finalPrice;
                } else {
                    productMap.set(fullName, { name: fullName, quantity: 1, total: item.finalPrice });
                }

                if (item.details?.selectedModifiers) {
                    item.details.selectedModifiers.forEach(mod => {
                        const currentCount = ingredientMap.get(mod.name) || 0;
                        ingredientMap.set(mod.name, currentCount + 1);
                    });
                }
            });
        }
      });

      // Procesamiento de Gastos
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

  // Helpers de fechas
  async getDailyReport(date: Date = new Date()): Promise<DailyReportData> {
    return this.getRangeReport(date, date);
  },

  async getRangeReport(startDate: Date, endDate: Date): Promise<DailyReportData> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.getReportByDateRange(start, end);
  },
  
  async getInventoryReport(): Promise<Modifier[]> {
    try {
      const q = query(collection(db, "modifiers"), where("trackStock", "==", true));
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Modifier));

      return items.sort((a, b) => (a.currentStock || 0) - (b.currentStock || 0));
    } catch (error) {
      console.error("Error obteniendo inventario:", error);
      return [];
    }
  }
};