import React, { useEffect, useState } from 'react';
import { reportService, type DailyReportData } from '../services/reportService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import type { Modifier } from '../types/menu'; // Asegúrate de importar el tipo

export const ReportsScreen: React.FC = () => {
  // 1. ESTADOS (Todos juntos al inicio para evitar errores)
  const [inventory, setInventory] = useState<Modifier[]>([]);
  const [tab, setTab] = useState<'ventas' | 'inventario'>('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyReportData | null>(null);

  // Fechas
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); 
      return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 2. FUNCIONES DE CARGA
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
          .catch(err => alert("Error al cargar datos"))
          .finally(() => setLoading(false));
  };

  // 3. EFECTOS
  useEffect(() => {
      handleSearch(); // Cargar ventas al inicio
  }, []);

  useEffect(() => {
      if (tab === 'inventario') loadInventory(); // Cargar inventario al cambiar pestaña
  }, [tab]);

  // 4. HELPER DE SEMÁFORO
  const getStockStatus = (stock: number) => {
      if (stock <= 25) return { label: 'URGENTE', color: 'badge-error text-white animate-pulse', icon: '🚨' };
      if (stock <= 50) return { label: 'Comprar', color: 'badge-warning', icon: '⚠️' };
      return { label: 'OK', color: 'badge-success text-white', icon: 'mV' };
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20">
        
        {/* 5. NAVEGACIÓN DE PESTAÑAS (Esto te faltaba) */}
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
                {/* Barra de Filtros */}
                <div className="bg-base-100 p-4 rounded-box shadow-sm border border-base-200 mb-6 flex flex-wrap gap-4 items-end">
                    <div className="form-control">
                        <label className="label py-1 text-xs font-bold">Fecha Inicio</label>
                        <input type="date" className="input input-bordered input-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-control">
                        <label className="label py-1 text-xs font-bold">Fecha Fin</label>
                        <input type="date" className="input input-bordered input-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <button onClick={handleSearch} className="btn btn-primary btn-sm px-6" disabled={loading}>
                        {loading ? 'Cargando...' : 'Consultar'}
                    </button>
                </div>

                {/* Contenido de Ventas (Gráficas y Tablas) */}
                {data && (
                    <div className="space-y-6">
                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="stat bg-base-100 shadow border border-base-200 rounded-box">
                                <div className="stat-title text-xs uppercase font-bold">Ventas Totales</div>
                                <div className="stat-value text-success text-2xl">${data.totalSales.toFixed(2)}</div>
                                <div className="stat-desc">{data.totalOrders} órdenes</div>
                            </div>
                            <div className="stat bg-base-100 shadow border border-base-200 rounded-box">
                                <div className="stat-title text-xs uppercase font-bold">Gastos Totales</div>
                                <div className="stat-value text-error text-2xl">-${data.totalExpenses.toFixed(2)}</div>
                                <div className="stat-desc">{data.expenses.length} movimientos</div>
                            </div>
                            <div className="stat bg-base-100 shadow border border-base-200 rounded-box md:col-span-2 bg-gradient-to-r from-base-100 to-base-200">
                                <div className="stat-title text-xs uppercase font-bold">Utilidad Neta</div>
                                <div className={`stat-value text-4xl ${data.netBalance >= 0 ? 'text-primary' : 'text-warning'}`}>
                                    ${data.netBalance.toFixed(2)}
                                </div>
                                <div className="stat-desc text-xs font-bold opacity-60">Ganancia real (Ventas - Gastos)</div>
                            </div>
                        </div>

                        {/* Gráficas */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="card bg-base-100 shadow border border-base-200 p-4">
                                <h3 className="font-bold mb-4 text-center text-sm uppercase opacity-70">Balance Financiero</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[{ name: 'Ingresos', monto: data.totalSales }, { name: 'Gastos', monto: data.totalExpenses }]}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value}`} />
                                            <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                                                {[{ name: 'Ingresos', color: '#4ade80' }, { name: 'Gastos', color: '#f87171' }].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="card bg-base-100 shadow border border-base-200 p-4">
                                <h3 className="font-bold mb-4 text-center text-sm uppercase opacity-70">Top 5 Productos</h3>
                                <div className="h-64 w-full text-xs">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={data.productBreakdown.slice(0, 5)} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                                            <Tooltip />
                                            <Bar dataKey="quantity" fill="#8884d8" radius={[0, 4, 4, 0]} name="Cantidad" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Tablas Detalle */}
                        <div className="divider opacity-50">DETALLES</div>
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Gastos */}
                            <div className="card bg-base-100 shadow border border-base-200 overflow-hidden">
                                <div className="bg-error/10 p-3 border-b border-base-200 flex justify-between items-center">
                                    <span className="font-bold text-xs uppercase text-error">💸 Desglose de Gastos</span>
                                    <span className="badge badge-error badge-sm text-white font-bold">-${data.totalExpenses.toFixed(2)}</span>
                                </div>
                                <div className="overflow-x-auto h-80">
                                    <table className="table table-xs table-pin-rows">
                                        <thead><tr className="bg-base-200"><th>Fecha</th><th>Descripción</th><th className="text-right">Monto</th></tr></thead>
                                        <tbody>
                                            {data.expenses.map((exp, i) => (
                                                <tr key={i}>
                                                    <td className="opacity-70">{exp.createdAt?.toDate().toLocaleDateString()}</td>
                                                    <td>{exp.description}</td>
                                                    <td className="text-right font-bold text-error">-${exp.amount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Productos */}
                            <div className="card bg-base-100 shadow border border-base-200 overflow-hidden">
                                <div className="bg-success/10 p-3 border-b border-base-200 flex justify-between items-center">
                                    <span className="font-bold text-xs uppercase text-success">📦 Desglose de Ventas</span>
                                    <span className="badge badge-success badge-sm text-white font-bold">${data.totalSales.toFixed(2)}</span>
                                </div>
                                <div className="overflow-x-auto h-80">
                                    <table className="table table-xs table-pin-rows">
                                        <thead><tr className="bg-base-200"><th>Producto</th><th className="text-center">Cant.</th><th className="text-right">Total</th></tr></thead>
                                        <tbody>
                                            {data.productBreakdown.map((p, i) => (
                                                <tr key={i}>
                                                    <td className="font-medium">{p.name}</td>
                                                    <td className="text-center font-bold">{p.quantity}</td>
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

        {/* --- VISTA DE INVENTARIO (Esto te faltaba) --- */}
        {tab === 'inventario' && (
            <div className="card bg-base-100 shadow border border-base-200 animate-fade-in">
                <div className="card-body p-0">
                    <div className="flex justify-between items-center p-4 border-b border-base-200">
                        <h3 className="font-bold text-lg">Estado de Almacén</h3>
                        <button onClick={loadInventory} className="btn btn-sm btn-ghost">🔄 Actualizar</button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead className="bg-base-200">
                                <tr>
                                    <th>Ingrediente</th>
                                    <th>Grupo</th>
                                    <th className="text-center">Existencia</th>
                                    <th className="text-center">Estado</th>
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
                                            <td className="text-center font-mono text-lg">{stock}</td>
                                            <td className="text-center">
                                                <span className={`badge ${status.color} font-bold gap-2 p-3 min-w-[100px]`}>
                                                    {status.icon} {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {inventory.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 opacity-50">
                                            No hay ingredientes con control de stock activado.
                                            <br/><span className="text-xs">Ve al "Editor de Menú" y activa el switch en algún ingrediente.</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};