// src/services/reportService.ts
import { db, collection, query, where, orderBy, getDocs, Timestamp } from '../firebase';
import type { Modifier } from '../types/menu';
import type { Order } from '../types/order'; 
import type { DailyReportData, Expense, ProductSummary } from '../types/report';

export const reportService = {

  // --- FUNCIÓN NÚCLEO: Genera reporte entre dos momentos EXACTOS ---
  // AHORA ACEPTA branchId OPCIONAL
  async getReportByDateRange(start: Date, end: Date, branchId?: string): Promise<DailyReportData> {
    try {
      // 1. Consultar Ventas (Orders)
      let qOrders = query(
        collection(db, "orders"),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "asc")
      );

      // Si hay branchId, agregamos el filtro
      if (branchId) {
          qOrders = query(
            collection(db, "orders"),
            where("branchId", "==", branchId), // <--- FILTRO CLAVE
            where("createdAt", ">=", start),
            where("createdAt", "<=", end),
            orderBy("createdAt", "asc")
          );
      }

      // 2. Consultar Gastos (Movements tipo OUT)
      let qExpenses = query(
        collection(db, "movements"),
        where("type", "==", "OUT"),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "asc")
      );

      // Si hay branchId, filtramos gastos también
      if (branchId) {
         qExpenses = query(
            collection(db, "movements"),
            where("branchId", "==", branchId), // <--- GASTOS POR SUCURSAL
            where("type", "==", "OUT"),
            where("createdAt", ">=", start),
            where("createdAt", "<=", end),
            orderBy("createdAt", "asc")
          );
      }

      const [snapOrders, snapExpenses] = await Promise.all([
        getDocs(qOrders),
        getDocs(qExpenses)
      ]);

      // --- PROCESAMIENTO (Igual que antes) ---
      const orders: Order[] = [];
      let totalSales = 0;
      let cashTotal = 0;
      let cardTotal = 0;
      let transferTotal = 0;
      
      const productMap = new Map<string, ProductSummary>(); // Definir tipo si tienes la interfaz
      const ingredientMap = new Map<string, number>();

      snapOrders.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as Order;
        orders.push(data);

        // SOLO sumamos dinero si la orden está PAGADA
        if (data.status === 'paid') {
            
            totalSales += data.total;

            // --- LÓGICA DE PAGO MIXTO ---
            const payment = data.payment;

            if (payment?.transactions && Array.isArray(payment.transactions)) {
                payment.transactions.forEach((tx: any) => {
                    const amount = Number(tx.amount) || 0;
                    if (tx.method === 'cash') cashTotal += amount;
                    if (tx.method === 'card') cardTotal += amount;
                    if (tx.method === 'transfer') transferTotal += amount;
                });
            } 
            else if (payment) {
                // Lógica legacy para pagos simples
                let finalAmount = Number(data.total);
                
                // Fallback si total es 0 (casos raros de migración)
                if (!finalAmount || finalAmount === 0) {
                     finalAmount = Number(payment.amountPaid) || 0;
                }

                if (payment.method === 'cash') cashTotal += finalAmount;
                else if (payment.method === 'card') cardTotal += finalAmount;
                else if (payment.method === 'transfer') transferTotal += finalAmount;
            }

            // Desglose de Productos
            data.items.forEach((item) => {
                const variantSuffix = item.details?.variantName ? ` (${item.details.variantName})` : '';
                const fullName = item.baseName + variantSuffix;
                const qty = item.quantity || 1;
                const existing = productMap.get(fullName);
                // Tipado manual simple para el acumulador
                if (existing) {
                    existing.quantity += qty; // Sumamos cantidad correcta
                    existing.total += item.finalPrice;
                } else {
                    productMap.set(fullName, { 
                        name: fullName, 
                        quantity: qty, 
                        total: item.finalPrice,
                        productId: item.productId 
                    } as any);
                }

                if (item.details?.selectedModifiers) {
                    item.details.selectedModifiers.forEach(mod => {
                        const currentCount = ingredientMap.get(mod.name) || 0;
                        ingredientMap.set(mod.name, currentCount + 1); // Aquí asumimos 1 por modificador
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
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt) 
          } as Expense);
          totalExpenses += d.amount;
      });

      // Convertir mapas a arrays para la gráfica
      const productBreakdown = Array.from(productMap.values()).sort((a: any, b: any) => b.quantity - a.quantity);
      const ingredientBreakdown = Array.from(ingredientMap.entries())
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity);

      return {
        totalSales,
        totalOrders: orders.filter(o => o.status === 'paid').length,
        cashTotal,
        cardTotal,
        transferTotal,
        totalExpenses,
        netBalance: totalSales - totalExpenses,
        orders,
        expenses,
        productBreakdown,
        ingredientBreakdown
      };

    } catch (error) {
      console.error("Error generando reporte:", error);
      throw error;
    }
  },

  // Helpers de fechas
  async getDailyReport(date: Date = new Date(), branchId?: string): Promise<DailyReportData> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return this.getReportByDateRange(start, end, branchId);
  },

  async getRangeReport(startDate: Date, endDate: Date, branchId?: string): Promise<DailyReportData> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.getReportByDateRange(start, end, branchId);
  },
  
  // INVENTARIO GLOBAL (Este se mantiene igual, ya que el inventario por sucursal lo maneja inventoryService)
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