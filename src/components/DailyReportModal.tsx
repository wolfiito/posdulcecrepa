// src/components/DailyReportModal.tsx
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { reportService, type DailyReportData } from '../services/reportService';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '95%',
    maxWidth: '500px',
    padding: '0',
    border: 'none',
    borderRadius: '1rem',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 }
};

Modal.setAppElement('#root');

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'products' | 'ingredients'>('summary');
  
  // Estado para el formulario de gastos
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReport = () => {
    setLoading(true);
    reportService.getDailyReport()
      .then(setData)
      .catch(err => { console.error(err); alert("Error cargando reporte"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) loadReport();
  }, [isOpen]);

  const handleAddExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!expenseDesc || !expenseAmount) return;
      
      setIsSubmitting(true);
      try {
          await reportService.addExpense(expenseDesc, parseFloat(expenseAmount));
          setExpenseDesc('');
          setExpenseAmount('');
          loadReport(); // Recargar datos para ver el nuevo balance
      } catch (error) {
          alert("Error al guardar gasto");
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles} contentLabel="Corte de Caja">
      <div className="bg-neutral text-neutral-content p-4 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold">Corte del Día</h2>
        <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm">✕</button>
      </div>

      <div className="p-6 bg-base-100 overflow-y-auto flex-1">
        {loading && !data ? (
          <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg text-primary"></span></div>
        ) : data ? (
          <div className="space-y-4">
            
            {/* TABS SUPERIORES */}
            <div role="tablist" className="tabs tabs-boxed bg-base-200 p-1 mb-2">
              <a role="tab" className={`tab flex-1 ${activeTab === 'summary' ? 'tab-active bg-white shadow-sm font-bold' : ''}`} onClick={() => setActiveTab('summary')}>💰 Balance</a>
              <a role="tab" className={`tab flex-1 ${activeTab === 'products' ? 'tab-active bg-white shadow-sm font-bold' : ''}`} onClick={() => setActiveTab('products')}>🍔 Ventas</a>
              <a role="tab" className={`tab flex-1 ${activeTab === 'ingredients' ? 'tab-active bg-white shadow-sm font-bold' : ''}`} onClick={() => setActiveTab('ingredients')}>🥦 Insumos</a>
            </div>

            {/* --- PESTAÑA 1: BALANCE Y GASTOS --- */}
            {activeTab === 'summary' && (
                <div className="animate-fade-in space-y-4">
                    {/* Tarjeta Principal de Balance */}
                    <div className="stats shadow w-full bg-base-100 border border-base-300">
                        <div className="stat place-items-center py-2">
                            <div className="stat-title text-xs uppercase font-bold">Ventas</div>
                            <div className="stat-value text-success text-2xl">+${data.totalSales.toFixed(2)}</div>
                        </div>
                        <div className="stat place-items-center py-2">
                            <div className="stat-title text-xs uppercase font-bold">Gastos</div>
                            <div className="stat-value text-error text-2xl">-${data.totalExpenses.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div className={`alert ${data.netBalance >= 0 ? 'alert-success' : 'alert-warning'} shadow-sm py-2 justify-center`}>
                        <span className="font-bold text-lg">
                            Utilidad del Día: ${data.netBalance.toFixed(2)}
                        </span>
                    </div>

                    {/* Desglose de Métodos de Pago */}
                    <div className="collapse collapse-arrow border border-base-200 bg-base-100">
                        <input type="checkbox" /> 
                        <div className="collapse-title font-medium text-sm">
                            Ver desglose por forma de pago
                        </div>
                        <div className="collapse-content">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-2 bg-base-200 rounded">💵 Efec: <br/><b>${data.cashTotal.toFixed(2)}</b></div>
                                <div className="p-2 bg-base-200 rounded">💳 Tarj: <br/><b>${data.cardTotal.toFixed(2)}</b></div>
                                <div className="p-2 bg-base-200 rounded">🏦 Transf: <br/><b>${data.transferTotal.toFixed(2)}</b></div>
                            </div>
                        </div>
                    </div>

                    <div className="divider m-0 text-xs opacity-50">REGISTRAR GASTOS</div>

                    {/* Formulario de Gastos */}
                    <form onSubmit={handleAddExpense} className="flex gap-2 items-end bg-base-200 p-3 rounded-box">
                        <div className="flex-1">
                            <label className="label py-0"><span className="label-text-alt">Concepto</span></label>
                            <input 
                                type="text" 
                                placeholder="Ej. Hielos" 
                                className="input input-sm input-bordered w-full" 
                                value={expenseDesc}
                                onChange={e => setExpenseDesc(e.target.value)}
                            />
                        </div>
                        <div className="w-24">
                            <label className="label py-0"><span className="label-text-alt">Monto</span></label>
                            <input 
                                type="number" 
                                placeholder="$0" 
                                className="input input-sm input-bordered w-full" 
                                value={expenseAmount}
                                onChange={e => setExpenseAmount(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-sm btn-circle btn-error text-white" disabled={isSubmitting || !expenseAmount}>
                            {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : '+'}
                        </button>
                    </form>

                    {/* Lista de Gastos Recientes */}
                    {data.expenses.length > 0 && (
                        <div className="overflow-x-auto max-h-40 border border-base-200 rounded-lg">
                            <table className="table table-xs table-pin-rows">
                                <thead>
                                    <tr className="bg-base-200"><th>Gasto</th><th className="text-right">Monto</th></tr>
                                </thead>
                                <tbody>
                                    {data.expenses.map((exp, i) => (
                                        <tr key={i}>
                                            <td>{exp.description}</td>
                                            <td className="text-right font-bold text-error">-${exp.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- PESTAÑA 2: PRODUCTOS --- */}
            {activeTab === 'products' && (
              <div className="overflow-x-auto border border-base-200 rounded-lg animate-fade-in">
                <table className="table table-xs w-full table-zebra">
                  <thead>
                    <tr className="bg-base-200">
                      <th className="pl-4">Producto</th>
                      <th className="text-center w-12">#</th>
                      <th className="text-right pr-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productBreakdown.map((item, index) => (
                        <tr key={index}>
                            <td className="pl-4 font-medium">{item.name}</td>
                            <td className="text-center font-bold">{item.quantity}</td>
                            <td className="text-right pr-4 opacity-70">${item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- PESTAÑA 3: INSUMOS --- */}
            {activeTab === 'ingredients' && (
              <div className="overflow-x-auto border border-base-200 rounded-lg animate-fade-in">
                <table className="table table-xs w-full table-zebra">
                  <thead>
                    <tr className="bg-base-200"><th className="pl-4">Ingrediente</th><th className="text-center pr-4">Cant.</th></tr>
                  </thead>
                  <tbody>
                    {data.ingredientBreakdown.map((item, index) => (
                        <tr key={index}>
                          <td className="pl-4 font-medium text-primary">{item.name}</td>
                          <td className="text-center font-bold pr-4">{item.quantity}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="divider m-0"></div>
            <button onClick={onClose} className="btn btn-block">Cerrar</button>
          </div>
        ) : <p className="text-center py-10">Sin datos</p>}
      </div>
    </Modal>
  );
};