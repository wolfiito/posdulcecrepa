import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { toast } from 'sonner';
import { Timestamp } from '../firebase'; // Import necesario para validar fechas

// Tipos y Servicios
import { reportService } from '../services/reportService';
import type { DailyReportData } from '../types/report';
import type { Modifier } from '../types/menu';

export const ReportsScreen: React.FC = () => {
  const [inventory, setInventory] = useState<Modifier[]>([]);
  const [tab, setTab] = useState<'ventas' | 'inventario'>('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyReportData | null>(null);

  // Fechas por defecto: 1ro del mes al día de hoy
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); 
      return d.toISOString().split('T')[0];
  });
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
      // Convertimos los strings del input type="date" a objetos Date
      // T es necesario para asegurar formato ISO
      const start = new Date(startDate + 'T00:00:00'); 
      const end = new Date(endDate + 'T23:59:59');

      reportService.getRangeReport(start, end)
          .then(setData)
          .catch(err => toast.error("Error al cargar datos"))
          .finally(() => setLoading(false));
  };

  useEffect(() => {
      handleSearch(); 
  }, []);

  useEffect(() => {
      if (tab === 'inventario') loadInventory(); 
  }, [tab]);

  // Helper para mostrar fechas sin errores
  const formatDateSafe = (dateVal: any) => {
      if (!dateVal) return '-';
      const date = dateVal instanceof Timestamp ? dateVal.toDate() : dateVal;
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const getStockStatus = (stock: number) => {
      if (stock <= 5) return { label: 'URGENTE', color: 'badge-error text-white animate-pulse', icon: '🚨' };
      if (stock <= 20) return { label: 'Bajo', color: 'badge-warning', icon: '⚠️' };
      return { label: 'OK', color: 'badge-success text-white', icon: '✅' };
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20">
        
        {/* PESTAÑAS */}
        <div role="tablist" className="tabs tabs-boxed bg-base-200 p-2 mb-6">
            <a role="tab" className={`tab tab-lg flex-1 ${tab === 'ventas' ? 'tab-active bg-white font-bold shadow-sm' : ''}`} onClick={() => setTab('ventas')}>
                📊 Reporte de Ventas
            </a>
            <a role="tab" className={`tab tab-lg flex-1 ${tab === 'inventario' ? 'tab-active bg-white font-bold shadow-sm' : ''}`} onClick={() => setTab('inventario')}>
                📦 Inventario
            </a>
        </div>

        {/* --- VISTA DE VENTAS --- */}
        {tab === 'ventas' && (
            <div className="animate-fade-in">
                {/* Filtros */}
                <div className="bg-base-100 p-4 rounded-box shadow-sm border border-base-200 mb-6 flex flex-wrap gap-4 items-end">
                    <div className="form-control">
                        <label className="label py-1 text-xs font-bold">Desde</label>
                        <input type="date" className="input input-bordered input-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-control">
                        <label className="label py-1 text-xs font-bold">Hasta</label>
                        <input type="date" className="input input-bordered input-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <button onClick={handleSearch} className="btn btn-primary btn-sm px-6" disabled={loading}>
                        {loading ? '...' : 'Consultar'}
                    </button>
                </div>

                {data && (
                    <div className="space-y-6">
                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="stat bg-base-100 shadow border border-base-200 rounded-box p-3">
                                <div className="stat-title text-[10px] uppercase font-bold tracking-wider">Ventas</div>
                                <div className="stat-value text-success text-2xl">${data.totalSales.toFixed(2)}</div>
                                <div className="stat-desc text-xs">{data.totalOrders} tickets</div>
                            </div>
                            <div className="stat bg-base-100 shadow border border-base-200 rounded-box p-3">
                                <div className="stat-title text-[10px] uppercase font-bold tracking-wider">Gastos</div>
                                <div className="stat-value text-error text-2xl">-${data.totalExpenses.toFixed(2)}</div>
                                <div className="stat-desc text-xs">{data.expenses.length} movimientos</div>
                            </div>
                            <div className="stat bg-base-100 shadow border border-base-200 rounded-box md:col-span-2 bg-gradient-to-r from-base-100 to-base-200 p-3">
                                <div className="stat-title text-[10px] uppercase font-bold tracking-wider">Utilidad Neta</div>
                                <div className={`stat-value text-3xl ${data.netBalance >= 0 ? 'text-primary' : 'text-warning'}`}>
                                    ${data.netBalance.toFixed(2)}
                                </div>
                                <div className="stat-desc text-xs font-bold opacity-60">Ganancia Real (Antes de Impuestos)</div>
                            </div>
                        </div>

                        {/* Gráficas */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="card bg-base-100 shadow border border-base-200 p-4">
                                <h3 className="font-bold mb-4 text-center text-xs uppercase opacity-70">Balance</h3>
                                <div className="h-56 w-full font-sans text-xs">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[{ name: 'Ingresos', monto: data.totalSales }, { name: 'Gastos', monto: data.totalExpenses }]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                                            <YAxis tickFormatter={(val) => `$${val}`} tick={{fontSize: 10}} />
                                            <Tooltip formatter={(value) => `$${value}`} cursor={{fill: 'transparent'}} />
                                            <Bar dataKey="monto" radius={[4, 4, 0, 0]} barSize={50}>
                                                {[{ name: 'Ingresos', color: '#22c55e' }, { name: 'Gastos', color: '#ef4444' }].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="card bg-base-100 shadow border border-base-200 p-4">
                                <h3 className="font-bold mb-4 text-center text-xs uppercase opacity-70">Top Productos</h3>
                                <div className="h-56 w-full text-xs">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={data.productBreakdown.slice(0, 5)} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 10}} />
                                            <Tooltip cursor={{fill: '#f3f4f6'}} />
                                            <Bar dataKey="quantity" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Tablas Detalle */}
                        <div className="divider text-xs opacity-50 uppercase tracking-widest">Desglose Detallado</div>
                        
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Tabla Gastos */}
                            <div className="card bg-base-100 shadow border border-base-200 overflow-hidden">
                                <div className="bg-error/5 p-3 border-b border-base-200 flex justify-between items-center">
                                    <span className="font-bold text-xs uppercase text-error">💸 Salidas de Dinero</span>
                                </div>
                                <div className="overflow-x-auto h-72">
                                    <table className="table table-xs table-pin-rows">
                                        <thead><tr className="bg-base-200/50"><th>Fecha</th><th>Concepto</th><th className="text-right">Monto</th></tr></thead>
                                        <tbody>
                                            {data.expenses.map((exp, i) => (
                                                <tr key={i} className="hover:bg-base-200/30">
                                                    <td className="opacity-70 whitespace-nowrap">{formatDateSafe(exp.createdAt)}</td>
                                                    <td className="font-medium">{exp.description}</td>
                                                    <td className="text-right font-bold text-error">-${exp.amount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {data.expenses.length === 0 && (
                                                <tr><td colSpan={3} className="text-center py-10 opacity-40">Sin gastos en este periodo</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tabla Productos */}
                            <div className="card bg-base-100 shadow border border-base-200 overflow-hidden">
                                <div className="bg-success/5 p-3 border-b border-base-200 flex justify-between items-center">
                                    <span className="font-bold text-xs uppercase text-success">📦 Productos Vendidos</span>
                                </div>
                                <div className="overflow-x-auto h-72">
                                    <table className="table table-xs table-pin-rows">
                                        <thead><tr className="bg-base-200/50"><th>Producto</th><th className="text-center">Cant.</th><th className="text-right">Total</th></tr></thead>
                                        <tbody>
                                            {data.productBreakdown.map((p, i) => (
                                                <tr key={i} className="hover:bg-base-200/30">
                                                    <td className="font-medium">{p.name}</td>
                                                    <td className="text-center font-bold bg-base-200/50 rounded">{p.quantity}</td>
                                                    <td className="text-right opacity-70">${p.total.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- VISTA DE INVENTARIO --- */}
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