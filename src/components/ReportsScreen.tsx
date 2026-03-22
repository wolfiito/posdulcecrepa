// src/components/ReportsScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { toast } from 'sonner';
import { Timestamp } from '../firebase';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Servicios y Stores
import { reportService } from '../services/reportService';
import { orderService } from '../services/orderService';
import { printService } from '../services/printService';
import { useAuthStore } from '../store/useAuthStore'; // <--- IMPORTANTE

import type { DailyReportData } from '../types/report';
import type { Order, PaymentMethod } from '../types/order';
import { excelExportService } from '../services/excelExportService';

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
    if (method === 'cash') return '💵';
    if (method === 'card') return '💳';
    if (method === 'transfer') return '📱';
    if (method === 'mixed') return '🔀';
    return '❓';
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
                    🧮 Balance Financiero Detallado
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
                                <span className="opacity-70">💵 Efectivo</span>
                                <span className="font-mono font-bold">${data.cashTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">💳 Tarjeta</span>
                                <span className="font-mono font-bold">${data.cardTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="opacity-70">📱 Transferencia</span>
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
  const { activeBranchId } = useAuthStore(); // <--- OBTENER SUCURSAL
  
  // Eliminamos 'inventario' de las opciones de tab
  const [tab, setTab] = useState<'ventas' | 'tickets'>('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyReportData | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const handleRefund = async () => {
      if (!selectedOrder || !selectedOrder.id) return;
      // VALIDACIÓN IMPORTANTE: Pasamos branchId para restaurar stock en la sucursal correcta
      if (!activeBranchId) {
          toast.error("Error: No hay sucursal activa para procesar devolución");
          return;
      }
      
      const confirm = window.confirm(`¿Estás seguro de DEVOLVER el ticket #${selectedOrder.orderNumber}? \n\nEsta acción cancelará la venta y restaurará el inventario.`);
      if (!confirm) return;

      try {
          setLoading(true);
          await orderService.cancelOrder(activeBranchId, selectedOrder.id, selectedOrder.items);
          
          toast.success("Ticket devuelto y stock restaurado");
          setSelectedOrder(null); 
          handleSearch(); 
      } catch (error) {
          console.error(error);
          toast.error("Error al procesar la devolución");
      } finally {
          setLoading(false);
      }
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
                        <span className="text-lg">📊</span> <span className="hidden sm:inline">Excel Pro</span>
                    </button>
                )}
            </div>
            
            <div role="tablist" className="tabs tabs-boxed bg-base-200 shadow-sm">
                <a role="tab" className={`tab flex-1 ${tab === 'ventas' ? 'tab-active bg-white shadow font-bold' : ''}`} onClick={() => setTab('ventas')}>💰 Finanzas</a>
                <a role="tab" className={`tab flex-1 ${tab === 'tickets' ? 'tab-active bg-white shadow font-bold' : ''}`} onClick={() => setTab('tickets')}>🧾 Tickets</a>
                {/* PESTAÑA INVENTARIO ELIMINADA */}
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
                    <span className="opacity-40">➜</span>
                    <input type="date" className="input input-xs md:input-sm input-ghost w-full font-mono" value={endDate} onChange={e => { setEndDate(e.target.value); setActiveRange('custom'); }} />
                    <button onClick={handleSearch} className="btn btn-primary btn-sm btn-square shadow-sm" disabled={loading}>
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : '🔍'}
                    </button>
                </div>
            </div>
        </div>

        {/* --- VISTA 1: DASHBOARD --- */}
        {tab === 'ventas' && data && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard title="Ventas" value={`$${data.totalSales.toFixed(2)}`} subValue={`${data.totalOrders} ventas`} icon="💰" color="border-success"/>
                    <StatCard title="Gastos" value={`-$${data.totalExpenses.toFixed(2)}`} subValue={`${data.expenses.length} salidas`} icon="📉" color="border-error"/>
                    <StatCard title="Utilidad" value={`$${data.netBalance.toFixed(2)}`} subValue={data.netBalance >= 0 ? 'Rentable' : 'Pérdida'} icon="🏦" color={data.netBalance >= 0 ? "border-primary" : "border-warning"}/>
                    <StatCard title="Ticket Prom" value={`$${averageTicket.toFixed(2)}`} subValue="Por cliente" icon="🧾" color="border-info"/>
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
                            <h3 className="font-bold text-sm uppercase opacity-70 mb-2">⭐ Top Productos</h3>
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

        {/* --- MODAL DE DETALLE DE TICKET --- */}
        {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    
                    <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/50 rounded-t-2xl">
                        <div>
                            <h3 className="font-black text-lg">Ticket #{selectedOrder.orderNumber}</h3>
                            <div className="text-xs opacity-60">{formatDateSafe(selectedOrder.createdAt)}</div>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="btn btn-circle btn-sm btn-ghost">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        
                        {selectedOrder.status === 'cancelled' && (
                            <div className="alert alert-error text-white text-sm py-2">
                                🚫 TICKET CANCELADO / DEVUELTO
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
                            🖨️ Reimprimir
                        </button>
                        
                        {selectedOrder.status !== 'cancelled' && (
                            <button 
                                onClick={handleRefund}
                                className="btn btn-error btn-outline flex-1 gap-2"
                                disabled={loading}
                            >
                                {loading ? <span className="loading loading-spinner loading-xs"></span> : '💸 Devolución'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};