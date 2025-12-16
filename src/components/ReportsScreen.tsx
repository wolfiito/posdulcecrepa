import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { toast } from 'sonner';
import { Timestamp } from '../firebase';

// Servicios y Tipos
import { reportService } from '../services/reportService';
import type { DailyReportData } from '../types/report';
import type { Modifier } from '../types/menu';

export const ReportsScreen: React.FC = () => {
  const [inventory, setInventory] = useState<Modifier[]>([]);
  const [tab, setTab] = useState<'ventas' | 'tickets' | 'inventario'>('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyReportData | null>(null);

  // Fechas: Por defecto HOY
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadInventory = () => {
      setLoading(true);
      reportService.getInventoryReport()
          .then(setInventory)
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
  };

  const handleSearch = () => {
      setLoading(true);
      const start = new Date(startDate + 'T00:00:00'); 
      const end = new Date(endDate + 'T23:59:59');

      reportService.getRangeReport(start, end)
          .then(setData)
          .catch(err => toast.error("Error al cargar datos"))
          .finally(() => setLoading(false));
  };

  const setDateRange = (range: 'today' | 'yesterday' | 'month') => {
      const today = new Date();
      const endStr = today.toISOString().split('T')[0];
      let startStr = endStr;

      if (range === 'yesterday') {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          startStr = y.toISOString().split('T')[0];
          setEndDate(startStr); 
      } else if (range === 'month') {
          const m = new Date();
          m.setDate(1);
          startStr = m.toISOString().split('T')[0];
          setEndDate(endStr);
      } else {
          setEndDate(endStr);
      }
      setStartDate(startStr);
  };

  useEffect(() => { handleSearch(); }, [startDate, endDate]);
  useEffect(() => { if (tab === 'inventario') loadInventory(); }, [tab]);

  const formatDateSafe = (dateVal: any) => {
      if (!dateVal) return '-';
      const date = dateVal instanceof Timestamp ? dateVal.toDate() : new Date(dateVal);
      return date.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
  };

  const getStockStatus = (stock: number) => {
      if (stock <= 5) return { label: 'URGENTE', color: 'badge-error text-white animate-pulse', icon: '🚨' };
      if (stock <= 20) return { label: 'Bajo', color: 'badge-warning', icon: '⚠️' };
      return { label: 'OK', color: 'badge-success text-white', icon: '✅' };
  };

  // Datos para gráfica de pastel (Métodos de Pago)
  const paymentData = data ? [
      { name: 'Efectivo', value: data.cashTotal, color: '#22c55e' },
      { name: 'Tarjeta', value: data.cardTotal, color: '#3b82f6' },
      { name: 'Transf.', value: data.transferTotal, color: '#a855f7' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20">
        
        {/* NAVEGACIÓN SUPERIOR */}
        <div role="tablist" className="tabs tabs-boxed bg-base-200 p-2 mb-6 shadow-sm">
            <a role="tab" className={`tab tab-lg flex-1 ${tab === 'ventas' ? 'tab-active bg-white font-bold shadow' : ''}`} onClick={() => setTab('ventas')}>
                📊 Financiero
            </a>
            <a role="tab" className={`tab tab-lg flex-1 ${tab === 'tickets' ? 'tab-active bg-white font-bold shadow' : ''}`} onClick={() => setTab('tickets')}>
                🧾 Historial Tickets
            </a>
            <a role="tab" className={`tab tab-lg flex-1 ${tab === 'inventario' ? 'tab-active bg-white font-bold shadow' : ''}`} onClick={() => setTab('inventario')}>
                📦 Inventario
            </a>
        </div>

        {/* FILTROS DE FECHA */}
        {tab !== 'inventario' && (
            <div className="bg-base-100 p-4 rounded-box shadow-sm border border-base-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <button onClick={() => setDateRange('today')} className="btn btn-xs btn-ghost">Hoy</button>
                    <button onClick={() => setDateRange('yesterday')} className="btn btn-xs btn-ghost">Ayer</button>
                    <button onClick={() => setDateRange('month')} className="btn btn-xs btn-ghost">Este Mes</button>
                </div>
                <div className="flex items-center gap-2">
                    <input type="date" className="input input-bordered input-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="opacity-50">a</span>
                    <input type="date" className="input input-bordered input-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    
                    <button onClick={handleSearch} className="btn btn-primary btn-sm btn-square" disabled={loading}>
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : '🔍'}
                    </button>
                </div>
            </div>
        )}

        {/* --- VISTA 1: FINANCIERO COMPLETO --- */}
        {tab === 'ventas' && data && (
            <div className="space-y-6 animate-fade-in">
                
                {/* 1. COMPARATIVA FINANCIERA (TABLA DE BALANCE) */}
                <div className="card bg-base-100 shadow border border-base-200">
                    <div className="card-body p-5">
                        <h3 className="card-title text-sm uppercase opacity-70 border-b border-base-200 pb-2 mb-4">Balance Financiero</h3>
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* Lado Izquierdo: La Tabla Matemática */}
                            <div className="bg-base-200/50 p-4 rounded-box">
                                <div className="flex justify-between items-center mb-2 text-lg">
                                    <span className="font-bold text-success">(+) Ventas Totales</span>
                                    <span className="font-mono font-black">${data.totalSales.toFixed(2)}</span>
                                </div>
                                <div className="pl-4 text-sm opacity-70 space-y-1 mb-4 border-l-2 border-base-300">
                                    <div className="flex justify-between"><span>Efectivo:</span> <span>${data.cashTotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Tarjeta:</span> <span>${data.cardTotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Transferencia:</span> <span>${data.transferTotal.toFixed(2)}</span></div>
                                </div>
                                
                                <div className="flex justify-between items-center mb-2 text-lg">
                                    <span className="font-bold text-error">(-) Gastos Operativos</span>
                                    <span className="font-mono font-black text-error">-${data.totalExpenses.toFixed(2)}</span>
                                </div>

                                <div className="divider my-1"></div>
                                
                                <div className="flex justify-between items-center text-xl bg-base-100 p-2 rounded border border-base-300 shadow-sm">
                                    <span className="font-black">= UTILIDAD NETA</span>
                                    <span className={`font-mono font-black ${data.netBalance >= 0 ? 'text-primary' : 'text-warning'}`}>
                                        ${data.netBalance.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Lado Derecho: Gráfica de Pastel */}
                            <div className="h-48 w-full flex flex-col items-center">
                                <h4 className="text-xs font-bold uppercase opacity-50 mb-2">Distribución de Ingresos</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={paymentData} 
                                            cx="50%" cy="50%" 
                                            innerRadius={40} outerRadius={60} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `$${value}`} />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SECCIÓN TOP PRODUCTOS (GRÁFICA + LISTA) */}
                <div className="card bg-base-100 shadow border border-base-200 p-4">
                    <h3 className="card-title text-sm uppercase opacity-70 mb-4 px-2">⭐ Top 5 Favoritos</h3>
                    <div className="flex flex-col md:flex-row gap-6 h-64">
                        {/* Gráfica */}
                        <div className="flex-1">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={data.productBreakdown.slice(0, 5)} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                                    <Bar dataKey="quantity" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>
                                        {data.productBreakdown.slice(0, 5).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#fbbf24' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Lista Lateral */}
                        <div className="w-full md:w-64 border-l border-base-200 pl-4 overflow-y-auto">
                            <ul className="space-y-3">
                                {data.productBreakdown.slice(0, 5).map((p, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm p-2 bg-base-200/30 rounded-lg">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${i===0 ? 'bg-warning' : i===1 ? 'bg-gray-400' : i===2 ? 'bg-orange-700' : 'bg-base-300 text-base-content'}`}>
                                            #{i+1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate font-bold">{p.name}</div>
                                            <div className="text-xs opacity-60">{p.quantity} ventas</div>
                                        </div>
                                        <div className="font-mono font-bold text-success">
                                            ${p.total.toFixed(0)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 3. TABLAS DETALLADAS */}
                <div className="grid lg:grid-cols-2 gap-6">
                    
                    {/* TABLA DE GASTOS */}
                    <div className="card bg-base-100 shadow border border-base-200 overflow-hidden h-fit">
                        <div className="bg-error/10 p-3 border-b border-base-200 flex justify-between items-center">
                            <span className="font-bold text-sm uppercase text-error flex items-center gap-2">
                                💸 Desglose de Gastos
                            </span>
                            <span className="badge badge-error badge-sm text-white font-mono">
                                -${data.totalExpenses.toFixed(2)}
                            </span>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="table table-xs table-pin-rows">
                                <thead>
                                    <tr className="bg-base-200/50">
                                        <th>Hora</th>
                                        <th>Concepto</th>
                                        <th className="text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.expenses.length > 0 ? (
                                        data.expenses.map((exp, i) => (
                                            <tr key={i} className="hover:bg-base-200/30">
                                                <td className="opacity-60 whitespace-nowrap">{formatDateSafe(exp.createdAt).split(',')[1]}</td>
                                                <td>
                                                    <div className="font-bold">{exp.category}</div>
                                                    <div className="text-[10px] opacity-70">{exp.description}</div>
                                                </td>
                                                <td className="text-right font-bold text-error font-mono">
                                                    -${exp.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="text-center py-8 opacity-40">Sin gastos registrados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* TABLA DE PRODUCTOS VENDIDOS */}
                    <div className="card bg-base-100 shadow border border-base-200 overflow-hidden h-fit">
                        <div className="bg-primary/10 p-3 border-b border-base-200 flex justify-between items-center">
                            <span className="font-bold text-sm uppercase text-primary flex items-center gap-2">
                                📦 Todos los Productos
                            </span>
                            <span className="badge badge-primary badge-sm text-white font-mono">
                                {data.productBreakdown.reduce((acc, p) => acc + p.quantity, 0)} items
                            </span>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="table table-xs table-pin-rows">
                                <thead>
                                    <tr className="bg-base-200/50">
                                        <th className="text-center w-12">Cant.</th>
                                        <th>Producto</th>
                                        <th className="text-right">Total Generado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.productBreakdown.length > 0 ? (
                                        data.productBreakdown.map((p, i) => (
                                            <tr key={i} className="hover:bg-base-200/30">
                                                <td className="text-center font-bold bg-base-200/50">
                                                    {p.quantity}
                                                </td>
                                                <td className="font-medium">{p.name}</td>
                                                <td className="text-right font-mono opacity-80">
                                                    ${p.total.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="text-center py-8 opacity-40">No hubo ventas</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- VISTA 2: HISTORIAL DE TICKETS --- */}
        {tab === 'tickets' && data && (
            <div className="animate-fade-in card bg-base-100 shadow border border-base-200">
                <div className="card-body p-0">
                    <div className="p-4 border-b border-base-200 bg-base-200/30">
                        <h3 className="font-bold text-sm uppercase">Bitácora de Ventas</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr className="bg-base-200">
                                    <th>Folio</th>
                                    <th>Hora</th>
                                    <th>Cliente / Mesa</th>
                                    <th>Total</th>
                                    <th>Pago</th>
                                    <th>Cajero</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.orders && data.orders.length > 0 ? (
                                    data.orders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-base-100">
                                            <td className="font-mono font-bold">#{order.orderNumber}</td>
                                            <td className="text-xs opacity-70">{formatDateSafe(order.createdAt).split(',')[1]}</td>
                                            <td>
                                                <div className="font-bold">{order.customerName}</div>
                                                <div className="text-[10px] badge badge-ghost badge-sm">{order.mode}</div>
                                            </td>
                                            <td className="font-bold text-success">${order.total.toFixed(2)}</td>
                                            <td className="text-xs uppercase">
                                                {order.payment?.method === 'cash' && '💵 Efec.'}
                                                {order.payment?.method === 'card' && '💳 Tarjeta'}
                                                {order.payment?.method === 'transfer' && '📱 Transf.'}
                                            </td>
                                            <td className="text-xs opacity-50">{order.cashier}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 opacity-50">No se encontraron tickets en este rango.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- VISTA 3: INVENTARIO --- */}
        {tab === 'inventario' && (
            <div className="card bg-base-100 shadow border border-base-200 animate-fade-in">
                <div className="card-body p-0">
                    <div className="flex justify-between items-center p-4 border-b border-base-200 bg-base-200/30">
                        <h3 className="font-bold text-sm uppercase">Niveles de Stock</h3>
                        <button onClick={loadInventory} className="btn btn-xs btn-ghost gap-1">🔄 Actualizar</button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="table table-sm table-zebra w-full">
                            <thead>
                                <tr>
                                    <th>Ingrediente</th>
                                    <th>Grupo</th>
                                    <th className="text-center">Existencia</th>
                                    <th className="text-center">Estatus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => {
                                    const stock = item.currentStock || 0;
                                    const status = getStockStatus(stock);
                                    return (
                                        <tr key={item.id}>
                                            <td className="font-bold">{item.name}</td>
                                            <td><span className="badge badge-ghost badge-xs">{item.group}</span></td>
                                            <td className="text-center font-mono text-base font-bold">{stock}</td>
                                            <td className="text-center">
                                                <div className={`badge ${status.color} badge-sm gap-2 font-bold shadow-sm min-w-[90px]`}>
                                                    {status.icon} {status.label}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};