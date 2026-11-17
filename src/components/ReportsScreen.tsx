// src/components/ReportsScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
  AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';
import { Timestamp } from '../firebase';

// Servicios y Stores
import { reportService } from '../services/reportService';
import { orderService } from '../services/orderService';
import { printService } from '../services/printService';
import { useAuthStore } from '../store/useAuthStore'; // <--- IMPORTANTE

import type { DailyReportData } from '../types/report';
import type { Order, PaymentMethod } from '../types/order';
import { excelExportService } from '../services/excelExportService';
import { ReturnInventoryModal, type PendingReturn } from './ReturnInventoryModal';
import { Banknote, CreditCard, Smartphone, Shuffle, CircleDollarSign, Calculator, FileSpreadsheet, Receipt, Brain, ArrowRight, Search, TrendingDown, Landmark, Star, Lightbulb, Sparkles, Medal, ClipboardList, Trophy, ListChecks, X, Ban, Printer, Undo2, CircleQuestionMark } from 'lucide-react';

// --- HELPER PARA FECHA LOCAL ---
const getLocalToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- HELPER DE ETIQUETAS DE PAGO ---
const getPaymentLabel = (method?: PaymentMethod) => {
    if (!method) return '-';
    if (method === 'cash') return 'Efectivo';
    if (method === 'card') return 'Tarjeta';
    if (method === 'transfer') return 'Transferencia';
    if (method === 'mixed') return 'Mixto';
    return 'Otro';
};

const getPaymentIcon = (method?: PaymentMethod) => {
    if (method === 'cash') return <Banknote size={12} className="shrink-0" />;
    if (method === 'card') return <CreditCard size={12} className="shrink-0" />;
    if (method === 'transfer') return <Smartphone size={12} className="shrink-0" />;
    if (method === 'mixed') return <Shuffle size={12} className="shrink-0" />;
    return <CircleQuestionMark size={12} className="shrink-0" />;
};

// --- COMPONENTES UI INTERNOS ---
const StatCard = ({ title, value, subValue, color, icon }: any) => (
  <div className={`card bg-base-100 shadow-sm border border-base-200 p-4 ${color ? `border-l-4 ${color}` : ''}`}>
    <div className="flex justify-between items-start">
        <div>
             <div className="text-xs uppercase font-bold opacity-60 mb-1 tracking-wider">{title}</div>
             <div className="text-2xl font-black font-mono leading-tight">{value}</div>
             {subValue && <div className="text-xs opacity-70 mt-1 font-medium">{subValue}</div>}
        </div>
        <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-xl flex-shrink-0">
            {icon}
        </div>
    </div>
  </div>
);

const BalanceCard = ({ data }: { data: DailyReportData }) => {
    return (
        <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
            <div className="bg-base-200/40 p-3 border-b border-base-200">
                <h3 className="font-bold text-sm uppercase opacity-70 flex items-center gap-2">
                    <Calculator size={16} className="shrink-0" /> Balance Financiero Detallado
                </h3>
            </div>
            <div className="card-body p-0">
                <div className="grid md:grid-cols-2">
                    {/* INGRESOS */}
                    <div className="p-5 border-b md:border-b-0 md:border-r border-base-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-success flex items-center gap-2 text-lg">
                                (+) Ingresos Totales
                            </span>
                            <span className="font-mono font-black text-xl tracking-tight">
                                ${data.totalSales.toFixed(2)}
                            </span>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-success/20">
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70 flex items-center gap-2"><Banknote size={14} className="shrink-0" /> Efectivo</span>
                                <span className="font-mono font-bold">${data.cashTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70 flex items-center gap-2"><CreditCard size={14} className="shrink-0" /> Tarjeta</span>
                                <span className="font-mono font-bold">${data.cardTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70 flex items-center gap-2"><Smartphone size={14} className="shrink-0" /> Transferencia</span>
                                <span className="font-mono font-bold">${data.transferTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* EGRESOS Y RESULTADO */}
                    <div className="p-5 flex flex-col justify-between h-full bg-base-100">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-error flex items-center gap-2 text-lg">
                                    (-) Gastos Operativos
                                </span>
                                <span className="font-mono font-black text-xl text-error tracking-tight">
                                    -${data.totalExpenses.toFixed(2)}
                                </span>
                            </div>
                            <div className="pl-4 border-l-2 border-error/20 text-xs opacity-60 italic mb-4">
                                {data.expenses.length} movimientos registrados en caja
                            </div>
                        </div>

                        <div className={`mt-auto pt-4 border-t border-base-200`}>
                            <div className="flex justify-between items-end">
                                <span className="font-black text-sm uppercase opacity-50">Utilidad Neta</span>
                                <span className={`font-mono font-black text-3xl ${data.netBalance >= 0 ? 'text-primary' : 'text-warning'}`}>
                                    ${data.netBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ReportsScreen: React.FC = () => {
  const { activeBranchId, currentUser } = useAuthStore(); // <--- OBTENER SUCURSAL
  
  // Eliminamos 'inventario' de las opciones de tab
  const [tab, setTab] = useState<'ventas' | 'tickets' | 'analisis'>('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyReportData | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingReturn, setPendingReturn] = useState<PendingReturn | null>(null);

  const [startDate, setStartDate] = useState(getLocalToday);
  const [endDate, setEndDate] = useState(getLocalToday);
  const [activeRange, setActiveRange] = useState<'today' | 'yesterday' | 'month' | 'custom'>('today');
  const [isExporting, setIsExporting] = useState(false);

  const getSafeDate = (val: any): Date => {
      if (!val) return new Date(); 
      if (val instanceof Timestamp) return val.toDate(); 
      if (val instanceof Date) return val; 
      return new Date(); 
  };

  const handleReprint = async () => {
      if (!selectedOrder) return;
      try {
          await printService.printReceipt(selectedOrder);
          toast.success("Enviando a impresora...");
      } catch (error) {
          toast.error("Error al reimprimir");
      }
  };

  const handleRefund = () => {
      if (!selectedOrder || !selectedOrder.id) return;
      // El inventario se mueve en la sucursal donde se vendió, no en la que está activa
      const branchId = selectedOrder.branchId || activeBranchId;
      if (!branchId) {
          toast.error("Error: No se sabe la sucursal del ticket");
          return;
      }
      const order = selectedOrder;
      setPendingReturn({
          title: `Devolver ticket #${order.orderNumber}`,
          items: order.items,
          run: async (mode) => {
              try {
                  setLoading(true);
                  await orderService.cancelOrder(branchId, order.id!, order.items, {
                      user: currentUser?.name, mode, orderNumber: order.orderNumber
                  });
                  const hasUsage = order.items.some(i => Object.keys(i.supplyUsage || {}).length > 0);
                  toast.success(!hasUsage ? "Ticket devuelto"
                      : mode === 'waste' ? "Ticket devuelto; insumos registrados como merma"
                      : "Ticket devuelto; insumos regresados al inventario");
                  setSelectedOrder(null);
                  handleSearch();
              } catch (error) {
                  console.error(error);
                  toast.error("Error al procesar la devolución");
              } finally {
                  setLoading(false);
              }
          }
      });
  };

  // --- EXPORTAR EXCEL ---
  const exportToExcel = async () => {
    setIsExporting(true);
    toast.info("Generando archivo multidimensional...", { duration: 3000 });
    
    try {
        await excelExportService.downloadGlobalReport(startDate, endDate);
        toast.success("Excel Profesional generado correctamente");
    } catch (error) {
        console.error("Error al exportar a Excel:", error);
        toast.error("Ocurrió un error al armar el Excel");
    } finally {
        setIsExporting(false);
    }
  };

  const handleSearch = () => {
      // VALIDACIÓN: Si no hay sucursal, no cargamos nada
      if (!activeBranchId) return;

      setLoading(true);
      const start = new Date(startDate + 'T00:00:00'); 
      const end = new Date(endDate + 'T23:59:59');

      // IMPORTANTE: Aquí debemos pasar activeBranchId al servicio
      // Nota: Necesitas actualizar getRangeReport en reportService para aceptar branchId
      reportService.getRangeReport(start, end, activeBranchId) 
          .then(setData)
          .catch(() => toast.error("Error al cargar datos"))
          .finally(() => setLoading(false));
  };

  const setDateRange = (range: 'today' | 'yesterday' | 'month') => {
      setActiveRange(range);
      const today = new Date();
      const todayStr = getLocalToday(); 

      if (range === 'today') {
          setStartDate(todayStr);
          setEndDate(todayStr);
      } else if (range === 'yesterday') {
          today.setDate(today.getDate() - 1);
          const y = today.getFullYear();
          const m = String(today.getMonth() + 1).padStart(2, '0');
          const d = String(today.getDate()).padStart(2, '0');
          const yesterdayStr = `${y}-${m}-${d}`;

          setStartDate(yesterdayStr); 
          setEndDate(yesterdayStr); 
      } else if (range === 'month') {
          const y = today.getFullYear();
          const m = String(today.getMonth() + 1).padStart(2, '0');
          
          const monthStart = `${y}-${m}-01`; 
          setStartDate(monthStart);
          setEndDate(todayStr);
      }
  };

  useEffect(() => { handleSearch(); }, [startDate, endDate, activeBranchId]); // Se recarga si cambia sucursal

  // Datos de sucursal listos para el encabezado del ticket al reimprimir
  useEffect(() => { printService.preloadBranch(activeBranchId); }, [activeBranchId]);

  const formatDateSafe = (dateVal: any) => {
      const date = getSafeDate(dateVal);
      return date.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
  };

  const paymentData = data ? [
      { name: 'Efectivo', value: data.cashTotal, color: '#22c55e' },
      { name: 'Tarjeta', value: data.cardTotal, color: '#3b82f6' },
      { name: 'Transf.', value: data.transferTotal, color: '#a855f7' },
  ].filter(d => d.value > 0) : [];

  const averageTicket = data && data.totalOrders > 0 ? data.totalSales / data.totalOrders : 0;

  const analyticsData = useMemo(() => {
      if (!data || !data.orders) return null;

      // --- 1. Combinaciones de ingredientes (solo crepas personalizadas) ---
      const combosMap = new Map<string, number>();
      data.orders.forEach(order => {
          if (order.status !== 'paid') return;
          order.items.forEach((item: any) => {
              // Solo analizamos items CUSTOM ("Arma tu Crepa") para detectar combinaciones reales
              if (item.type === 'CUSTOM' && item.details?.selectedModifiers && item.details.selectedModifiers.length > 0) {
                  const mods = item.details.selectedModifiers.map((m: any) => m.name).sort();
                  const comboName = mods.join(' + ');
                  if (comboName) combosMap.set(comboName, (combosMap.get(comboName) || 0) + (item.quantity || 1));
              }
          });
      });
      const topCombinations = Array.from(combosMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

      // --- 2. Productos menos vendidos ---
      const allProducts = [...data.productBreakdown].sort((a, b) => a.quantity - b.quantity);
      const worstProducts = allProducts.filter(p => p.quantity > 0).slice(0, 5);

      // --- 3. Ventas por hora ---
      const hourMap = new Map<number, { ventas: number; total: number }>();
      for (let h = 8; h <= 22; h++) hourMap.set(h, { ventas: 0, total: 0 });
      data.orders.forEach(order => {
          if (order.status !== 'paid') return;
          const d = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt as any);
          const h = d.getHours();
          const cur = hourMap.get(h) || { ventas: 0, total: 0 };
          cur.ventas += 1;
          cur.total += order.total;
          hourMap.set(h, cur);
      });
      const salesByHour = Array.from(hourMap.entries())
          .map(([hour, vals]) => ({ hora: `${hour}:00`, ventas: vals.ventas, total: Math.round(vals.total) }))
          .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

      // --- 4. Top ingredientes individuales ---
      const topIngredients = data.ingredientBreakdown.slice(0, 10);

      // --- 5. Revenue por producto (top 8) ---
      const revenueByProduct = [...data.productBreakdown]
          .sort((a, b) => b.total - a.total)
          .slice(0, 8)
          .map(p => ({ name: p.name, ingresos: Math.round(p.total), cantidad: p.quantity }));

      // --- 6. Propuestas de crepas especiales ---
      const proposedSpecials = topCombinations.slice(0, 3).map((combo, idx) => {
          const creativeNames = ['La Favorita', 'La Consentida', 'La Clásica'];
          return {
              nombre: creativeNames[idx] || `Especial ${idx + 1}`,
              ingredientes: combo.name,
              popularidad: combo.count,
          };
      });

      // --- 7. Hora pico ---
      const peakHour = salesByHour.reduce((best, cur) => cur.ventas > best.ventas ? cur : best, salesByHour[0]);

      // --- 8. Modo de venta más frecuente ---
      const modeMap = new Map<string, number>();
      data.orders.forEach(o => { if (o.status === 'paid') modeMap.set(o.mode, (modeMap.get(o.mode) || 0) + 1); });
      const topMode = Array.from(modeMap.entries()).sort((a, b) => b[1] - a[1])[0];

      // --- 9. Recomendaciones inteligentes ---
      const recommendations: string[] = [];
      if (topCombinations.length > 0 && topCombinations[0].count >= 2) {
          recommendations.push(`Tu combinación estrella es "${topCombinations[0].name}" con ${topCombinations[0].count} pedidos. ¡Créala como crepa especial del menú!`);
      }
      if (topCombinations.length >= 2) {
          recommendations.push(`La 2da combinación más popular es "${topCombinations[1].name}". Podría ser tu segunda crepa especial.`);
      }
      if (worstProducts.length > 0) {
          recommendations.push(`"${worstProducts[0].name}" tiene solo ${worstProducts[0].quantity} ventas. Considera una promo o retíralo del menú.`);
      }
      if (peakHour && peakHour.ventas > 0) {
          recommendations.push(`⏰ Tu hora pico es a las ${peakHour.hora} con ${peakHour.ventas} ventas. Refuerza personal o insumos en ese horario.`);
      }
      if (data.totalSales > 0 && data.netBalance < data.totalSales * 0.25) {
         recommendations.push(`Tu margen neto es menor al 25%. Revisa tus gastos operativos urgentemente.`);
      }
      if (averageTicket > 0) {
          recommendations.push(`Ticket promedio: $${averageTicket.toFixed(2)}. Ofrece extras (Nutella, frutas, bebida) para subirlo.`);
      }
      if (topMode) {
          recommendations.push(`El modo "${topMode[0]}" representa ${topMode[1]} de ${data.totalOrders} ventas (${((topMode[1]/data.totalOrders)*100).toFixed(0)}%).`);
      }
      if (topIngredients.length > 0) {
          recommendations.push(`Tu ingrediente más usado es "${topIngredients[0].name}" (${topIngredients[0].quantity} veces). Asegúrate de tener stock suficiente.`);
      }

      return { topCombinations, worstProducts, salesByHour, topIngredients, revenueByProduct, proposedSpecials, recommendations };
  }, [data, averageTicket]);

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto pb-24 px-2 md:px-4">
        
        {/* HEADER & CONTROL */}
        <div className="flex flex-col gap-4 mb-6 mt-2">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-base-content">
                    Reportes 
                    {/* Indicador visual de la sucursal activa */}
                    <span className="ml-2 text-sm font-normal text-primary opacity-80 border border-primary/20 px-2 py-0.5 rounded-full">
                         {activeBranchId ? 'Sucursal Activa' : 'Sin Sucursal'}
                    </span>
                </h2>
                {data && (
                    <button onClick={exportToExcel} className="btn btn-success btn-sm text-white gap-2 shadow-sm font-bold">
                        <FileSpreadsheet size={18} className="shrink-0" /> <span className="hidden sm:inline">Excel Pro</span>
                    </button>
                )}
            </div>
            
            <div role="tablist" className="tabs tabs-boxed bg-base-200 shadow-sm">
                <a role="tab" className={`tab flex-1 ${tab === 'ventas' ? 'tab-active bg-white shadow font-bold' : ''}`} onClick={() => setTab('ventas')}><span className="flex items-center gap-2"><CircleDollarSign size={16} className="shrink-0" /> Finanzas</span></a>
                <a role="tab" className={`tab flex-1 ${tab === 'tickets' ? 'tab-active bg-white shadow font-bold' : ''}`} onClick={() => setTab('tickets')}><span className="flex items-center gap-2"><Receipt size={16} className="shrink-0" /> Tickets</span></a>
                <a role="tab" className={`tab flex-1 ${tab === 'analisis' ? 'tab-active bg-white shadow font-bold' : ''}`} onClick={() => setTab('analisis')}><span className="flex items-center gap-2"><Brain size={16} className="shrink-0" /> Análisis</span></a>
            </div>
        </div>

        <div className="bg-base-100 p-3 rounded-xl shadow-sm border border-base-200 mb-6">
             <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex w-full lg:w-auto gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                    {['today', 'yesterday', 'month'].map((r: any) => (
                         <button key={r} onClick={() => setDateRange(r)} className={`btn btn-sm rounded-full capitalize ${activeRange === r ? 'btn-primary' : 'btn-ghost'}`}>
                            {r === 'today' ? 'Hoy' : r === 'yesterday' ? 'Ayer' : 'Mes'}
                         </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto bg-base-200/50 p-1.5 rounded-lg">
                    <input type="date" className="input input-xs md:input-sm input-ghost w-full font-mono" value={startDate} onChange={e => { setStartDate(e.target.value); setActiveRange('custom'); }} />
                    <ArrowRight size={16} className="opacity-40 shrink-0" />
                    <input type="date" className="input input-xs md:input-sm input-ghost w-full font-mono" value={endDate} onChange={e => { setEndDate(e.target.value); setActiveRange('custom'); }} />
                    <button onClick={handleSearch} className="btn btn-primary btn-sm btn-square shadow-sm" disabled={loading}>
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : <Search size={16} />}
                    </button>
                </div>
            </div>
        </div>

        {/* --- VISTA 1: DASHBOARD --- */}
        {tab === 'ventas' && data && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard title="Ventas" value={`$${data.totalSales.toFixed(2)}`} subValue={`${data.totalOrders} ventas`} icon={<CircleDollarSign size={20} />} color="border-success"/>
                    <StatCard title="Gastos" value={`-$${data.totalExpenses.toFixed(2)}`} subValue={`${data.expenses.length} salidas`} icon={<TrendingDown size={20} />} color="border-error"/>
                    <StatCard title="Utilidad" value={`$${data.netBalance.toFixed(2)}`} subValue={data.netBalance >= 0 ? 'Rentable' : 'Pérdida'} icon={<Landmark size={20} />} color={data.netBalance >= 0 ? "border-primary" : "border-warning"}/>
                    <StatCard title="Ticket Prom" value={`$${averageTicket.toFixed(2)}`} subValue="Por cliente" icon={<Receipt size={20} />} color="border-info"/>
                </div>
                <BalanceCard data={data} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-4">
                            <h3 className="font-bold text-sm uppercase opacity-70">Pagos</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{paymentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer></div>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow border border-base-200 lg:col-span-2">
                        <div className="card-body p-4">
                            <h3 className="font-bold text-sm uppercase opacity-70 mb-2 flex items-center gap-2"><Star size={16} className="shrink-0" /> Top Productos</h3>
                            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.productBreakdown.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} /><Tooltip formatter={(value: number) => [value, 'Vendidos']} /><Bar dataKey="quantity" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>{data.productBreakdown.slice(0, 5).map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 0 ? '#fbbf24' : '#6366f1'} />))}</Bar></BarChart></ResponsiveContainer></div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- VISTA 2: TICKETS --- */}
        {tab === 'tickets' && data && (
            <div className="animate-fade-in space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.orders && data.orders.length > 0 ? (
                        data.orders.map((order: any) => (
                            <div 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                className={`card bg-base-100 shadow-sm border border-base-200 p-3 hover:shadow-md transition-all cursor-pointer active:scale-95 ${order.status === 'cancelled' ? 'opacity-60 bg-base-200' : ''}`}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`badge ${order.status === 'cancelled' ? 'badge-error text-white' : 'badge-neutral'} font-mono text-[10px]`}>
                                                {order.status === 'cancelled' ? 'CANCELADO' : `#${order.orderNumber}`}
                                            </span>
                                            <span className="text-xs opacity-50">{formatDateSafe(order.createdAt).split(',')[1]}</span>
                                        </div>
                                        <div className={`badge ${order.mode && order.mode.includes('Mesa') ? 'badge-primary' : 'badge-secondary'} badge-outline badge-sm text-[10px]`}>
                                            {order.mode}
                                        </div>
                                    </div>
                                    
                                    <div className={`font-bold text-sm leading-tight break-words line-clamp-2 ${order.status === 'cancelled' ? 'line-through' : ''}`} title={order.customerName}>
                                        {order.customerName || 'Cliente General'}
                                    </div>

                                    <div className="flex justify-between items-end pt-2 border-t border-base-200 mt-1">
                                        <div className="text-[10px] uppercase font-bold opacity-60 flex items-center gap-1">
                                            {getPaymentIcon(order.payment?.method)} {getPaymentLabel(order.payment?.method)}
                                        </div>
                                        <div className="text-xl font-black text-success font-mono">
                                            ${order.total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 opacity-50">No hay tickets.</div>
                    )}
                </div>
            </div>
        )}

        {/* --- VISTA 3: ANÁLISIS AVANZADO --- */}
        {tab === 'analisis' && data && analyticsData && (
            <div className="space-y-6 animate-fade-in">

                {/* === BLOQUE 1: RECOMENDACIONES INTELIGENTES === */}
                <div className="card bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg border border-primary/10">
                    <div className="card-body p-5">
                        <h3 className="font-black text-lg mb-3 flex items-center gap-2"><Lightbulb size={20} className="shrink-0" /> Insights y Recomendaciones</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {analyticsData.recommendations.map((rec, idx) => (
                                <div key={idx} className="bg-base-100 p-4 rounded-xl border border-base-200 text-sm shadow-sm hover:shadow-md transition-shadow">
                                    {rec}
                                </div>
                            ))}
                            {analyticsData.recommendations.length === 0 && (
                                <div className="col-span-full opacity-50 p-4 text-center">No hay suficientes datos para generar recomendaciones.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === BLOQUE 2: PROPUESTAS DE CREPAS ESPECIALES === */}
                {analyticsData.proposedSpecials.length > 0 && (
                    <div className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-5">
                            <h3 className="font-black text-lg mb-3 flex items-center gap-2"><Sparkles size={20} className="shrink-0" /> Propuestas de Crepas Especiales</h3>
                            <p className="text-xs opacity-60 mb-4">Basado en las combinaciones más pedidas, te sugerimos crear estas crepas como productos fijos del menú.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {analyticsData.proposedSpecials.map((sp, idx) => (
                                    <div key={idx} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-700/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Medal size={24} className={`shrink-0 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-orange-700'}`} />
                                            <span className="font-black text-lg">"{sp.nombre}"</span>
                                        </div>
                                        <div className="text-sm opacity-80 mb-2 flex items-start gap-2"><ClipboardList size={14} className="shrink-0 mt-0.5" /> {sp.ingredientes}</div>
                                        <div className="text-xs font-mono font-bold text-primary">{sp.popularidad} pedidos con este mix</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* === BLOQUE 3: VENTAS POR HORA (ÁREA) === */}
                <div className="card bg-base-100 shadow border border-base-200">
                    <div className="card-body p-4">
                        <h3 className="font-bold text-sm uppercase opacity-70 mb-2">⏰ Flujo de Ventas por Hora</h3>
                        <p className="text-xs opacity-50 mb-3">Identifica tus horas pico y los momentos con menos actividad.</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData.salesByHour} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(value: number, name: string) => [name === 'ventas' ? `${value} ventas` : `$${value}`, name === 'ventas' ? 'Cantidad' : 'Ingresos']} />
                                    <Area type="monotone" dataKey="ventas" stroke="#6366f1" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* === BLOQUE 4: COMBINACIONES ESTRELLA === */}
                    <div className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-4">
                            <h3 className="font-bold text-sm uppercase opacity-70 mb-4 flex items-center gap-2"><Trophy size={16} className="shrink-0" /> Combinaciones Estrella</h3>
                            {analyticsData.topCombinations.length > 0 ? (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.topCombinations} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                                            <Tooltip formatter={(value: number) => [`${value} pedidos`, 'Mix']} />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                                                {analyticsData.topCombinations.map((_entry, index) => (
                                                    <Cell key={`combo-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#10b981' : '#6366f1'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center opacity-50 p-6 text-sm">No hay combinaciones registradas.</div>
                            )}
                        </div>
                    </div>

                    {/* === BLOQUE 5: PRODUCTOS CON MENOS SALIDA === */}
                    <div className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-4">
                            <h3 className="font-bold text-sm uppercase opacity-70 mb-4 flex items-center gap-2"><TrendingDown size={16} className="shrink-0" /> Productos con Menos Salida</h3>
                            {analyticsData.worstProducts.length > 0 ? (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.worstProducts} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(value: number) => [`${value} vendidos`, 'Cantidad']} />
                                            <Bar dataKey="quantity" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={18} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center opacity-50 p-6 text-sm">No hay datos suficientes.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* === BLOQUE 6: TOP INGREDIENTES INDIVIDUALES === */}
                    <div className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-4">
                            <h3 className="font-bold text-sm uppercase opacity-70 mb-4 flex items-center gap-2"><ListChecks size={16} className="shrink-0" /> Top Ingredientes Más Usados</h3>
                            {analyticsData.topIngredients.length > 0 ? (
                                <div className="space-y-2">
                                    {analyticsData.topIngredients.map((ing, idx) => {
                                        const maxQty = analyticsData.topIngredients[0].quantity;
                                        const pct = maxQty > 0 ? (ing.quantity / maxQty) * 100 : 0;
                                        return (
                                            <div key={idx} className="flex items-center gap-3 text-sm">
                                                <span className="w-6 text-right font-mono text-xs opacity-50">#{idx + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-medium truncate">{ing.name}</span>
                                                        <span className="font-mono font-bold text-xs">{ing.quantity}</span>
                                                    </div>
                                                    <div className="w-full bg-base-200 rounded-full h-2">
                                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center opacity-50 p-6 text-sm">No hay ingredientes registrados.</div>
                            )}
                        </div>
                    </div>

                    {/* === BLOQUE 7: INGRESOS POR PRODUCTO === */}
                    <div className="card bg-base-100 shadow border border-base-200">
                        <div className="card-body p-4">
                            <h3 className="font-bold text-sm uppercase opacity-70 mb-4 flex items-center gap-2"><CircleDollarSign size={16} className="shrink-0" /> Ingresos por Producto (Top 8)</h3>
                            {analyticsData.revenueByProduct.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-xs w-full">
                                        <thead>
                                            <tr className="text-xs uppercase opacity-60">
                                                <th>#</th>
                                                <th>Producto</th>
                                                <th className="text-right">Vendidos</th>
                                                <th className="text-right">Ingresos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsData.revenueByProduct.map((p, idx) => (
                                                <tr key={idx} className="hover">
                                                    <td className="font-mono text-xs opacity-50">{idx + 1}</td>
                                                    <td className="font-medium text-sm truncate max-w-[140px]">{p.name}</td>
                                                    <td className="text-right font-mono text-sm">{p.cantidad}</td>
                                                    <td className="text-right font-mono font-bold text-sm text-success">${p.ingresos}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center opacity-50 p-6 text-sm">Sin datos.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL DE DETALLE DE TICKET --- */}
        {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    
                    <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/50 rounded-t-2xl">
                        <div>
                            <h3 className="font-black text-lg">Ticket #{selectedOrder.orderNumber}</h3>
                            <div className="text-xs opacity-60">{formatDateSafe(selectedOrder.createdAt)}</div>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="btn btn-circle btn-sm btn-ghost"><X size={16} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        
                        {selectedOrder.status === 'cancelled' && (
                            <div className="alert alert-error text-white text-sm py-2">
                                <Ban size={16} className="shrink-0" /> TICKET CANCELADO / DEVUELTO
                            </div>
                        )}

                        <div className="flex justify-between bg-base-200 p-3 rounded-lg text-sm">
                            <div>
                                <div className="opacity-60 text-xs">Cliente</div>
                                <div className="font-bold">{selectedOrder.customerName || 'Mostrador'}</div>
                            </div>
                            <div className="text-right">
                                <div className="opacity-60 text-xs">Modo</div>
                                <div className="font-bold badge badge-neutral badge-sm">{selectedOrder.mode}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase opacity-50 mb-2 border-b border-base-200 pb-1">Productos</h4>
                            <ul className="space-y-3">
                                {selectedOrder.items.map((item: any, idx: number) => (
                                    <li key={idx} className="flex justify-between items-start text-sm">
                                        <div className="flex-1">
                                            <div className="font-bold">
                                                <span className="opacity-50 mr-2">{item.quantity}x</span> 
                                                {item.baseName} {item.details?.variantName && `(${item.details.variantName})`}
                                            </div>
                                            {item.details?.selectedModifiers && item.details.selectedModifiers.length > 0 && (
                                                <div className="text-xs opacity-60 pl-6">
                                                    {item.details.selectedModifiers.map((mod: any) => `+ ${mod.name}`).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-mono font-bold">
                                            ${item.finalPrice.toFixed(2)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="border-t border-dashed border-base-300 pt-4 mt-4">
                             <div className="flex justify-between items-center text-xl font-black">
                                <span>TOTAL</span>
                                <span className="text-success">${selectedOrder.total.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-right opacity-60 uppercase mt-1">
                                Pagado con {getPaymentLabel(selectedOrder.payment?.method)}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-base-200 bg-base-100 rounded-b-2xl flex gap-3">
                        <button 
                            onClick={handleReprint}
                            className="btn btn-neutral flex-1 gap-2"
                        >
                            <Printer size={16} className="shrink-0" /> Reimprimir
                        </button>
                        
                        {selectedOrder.status !== 'cancelled' && (
                            <button 
                                onClick={handleRefund}
                                className="btn btn-error btn-outline flex-1 gap-2"
                                disabled={loading}
                            >
                                {loading ? <span className="loading loading-spinner loading-xs"></span> : <><Undo2 size={16} className="shrink-0" /> Devolución</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
        <ReturnInventoryModal pending={pendingReturn} onClose={() => setPendingReturn(null)} />
    </div>
  );
};