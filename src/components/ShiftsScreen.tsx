// src/components/ShiftsScreen.tsx
import React, { useState } from 'react'; 
import { useShiftStore } from '../store/useShiftStore';
import { useAuthStore } from '../store/useAuthStore';
import { shiftService, type ShiftMetrics } from '../services/shiftService';
import { PinPadModal } from './PinPadModal'; // <--- CAMBIO: Usamos el Modal Premium
import { ZReportTemplate } from './ZReportTemplate';
import { Timestamp } from '../firebase';
import { toast } from 'sonner';

export const ShiftsScreen: React.FC = () => {
  const { currentShift, isLoading, openShift, closeShift } = useShiftStore();
  const { currentUser } = useAuthStore();

  const [inputAmount, setInputAmount] = useState(''); 
  const [closingSummary, setClosingSummary] = useState<ShiftMetrics | null>(null);
  const [printZReport, setPrintZReport] = useState(false);
  
  // Control de Modales
  const [isPinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'OPEN' | 'PRE_CLOSE' | 'CONFIRM_CLOSE' | null>(null);
  
  // Helpers UI
  const handleNumber = (num: string) => {
    if (inputAmount.length >= 8) return; 
    if (num === '.' && inputAmount.includes('.')) return; 
    setInputAmount(prev => prev + num);
  };
  const handleBackspace = () => setInputAmount(prev => prev.slice(0, -1));

  // --- LÓGICA DE TUYA (INTACTA) ---
  const requestAction = (action: 'OPEN' | 'PRE_CLOSE' | 'CONFIRM_CLOSE') => {
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'GERENTE') {
          handleAuthSuccess(currentUser.name, action);
      } else {
          setPendingAction(action);
          setPinModalOpen(true);
      }
  };

  const handleAuthSuccess = (authorizerName: string, actionOverride?: string) => {
      const action = actionOverride || pendingAction;

      if (action === 'OPEN') executeOpen(authorizerName);
      if (action === 'PRE_CLOSE') executePreClose();
      if (action === 'CONFIRM_CLOSE') executeFinalClose();
      
      setPendingAction(null);
  };

  const executeOpen = async (authorizer: string) => {
    const amount = parseFloat(inputAmount);
    if (!inputAmount || isNaN(amount)) return toast.warning("Monto inválido");
    try {
        await openShift(amount);
        toast.success(`Caja abierta por ${currentUser?.name} (Autorizó: ${authorizer})`);
        setInputAmount('');
    } catch (error) { toast.error("Error al abrir caja"); }
  };

  const executePreClose = async () => {
      if (!currentShift) return;
      try {
          const metrics = await shiftService.getShiftMetrics(currentShift);
          setClosingSummary(metrics);
          setInputAmount(''); 
          setPrintZReport(false);
      } catch (e) { toast.error("Error calculando corte"); }
  };

  const executeFinalClose = async () => {
      if (!inputAmount || !closingSummary) return;
      const finalCash = parseFloat(inputAmount);
      
      setPrintZReport(true);
      setTimeout(async () => {
          window.print();
          await closeShift(finalCash);
          setClosingSummary(null);
          setInputAmount('');
          setPrintZReport(false);
          toast.success("Turno cerrado y Corte Z generado");
      }, 500);
  };

  const formatShiftDate = (dateOrTimestamp: any) => {
      if (!dateOrTimestamp) return '';
      if (dateOrTimestamp instanceof Timestamp) return dateOrTimestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      return new Date(dateOrTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  if (isLoading) return <div className="flex justify-center p-20"><span className="loading loading-spinner text-primary"></span></div>;

  // --- VISTA 1: ABRIR CAJA (Mejorada visualmente) ---
  if (!currentShift) {
      return (
        <div className="flex flex-col items-center justify-center p-4 animate-fade-in select-none min-h-[60vh]">
            <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200">
                <div className="card-body items-center text-center p-6">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <span className="text-4xl">🔓</span>
                    </div>
                    <h1 className="text-2xl font-black text-base-content">Abrir Caja</h1>
                    <p className="text-sm font-medium opacity-60 mb-6">Hola, {currentUser?.name}</p>

                    {/* Display Monto */}
                    <div className="w-full mb-6">
                        <div className="bg-base-200 rounded-3xl p-4 text-center border-2 border-transparent focus-within:border-primary transition-all">
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Fondo Inicial</p>
                            <div className="text-4xl font-mono font-black text-base-content flex justify-center items-center h-12 tracking-tight">
                                <span className="text-primary mr-1 text-2xl">$</span>
                                {inputAmount ? inputAmount : <span className="opacity-20">0.00</span>}
                            </div>
                        </div>
                    </div>

                    <div className="scale-90 w-full -my-2">
                        <Numpad onNumber={handleNumber} onBackspace={handleBackspace} />
                    </div>

                    <button 
                        onClick={() => requestAction('OPEN')} 
                        disabled={!inputAmount}
                        className="btn btn-primary btn-block btn-lg rounded-2xl shadow-lg mt-4"
                    >
                        Confirmar Apertura
                    </button>
                </div>
            </div>
            {/* Usamos PinPadModal en vez de AuthModal */}
            <PinPadModal 
                isOpen={isPinModalOpen} 
                onClose={() => setPinModalOpen(false)} 
                onSuccess={(name) => handleAuthSuccess(name)}
                title="Autorizar Apertura"
                requireAdmin={true} // Tu lógica pide admin/gerente
            />
        </div>
      );
  }

  // --- VISTA 2: PRE-CIERRE (Dashboard Financiero Moderno) ---
  if (closingSummary) {
      const counted = parseFloat(inputAmount) || 0;
      const difference = counted - closingSummary.expectedCash;
      
      return (
        <div className="max-w-2xl mx-auto mt-4 animate-fade-in pb-24 px-4">
            {printZReport && <ZReportTemplate shift={currentShift} metrics={closingSummary} finalCount={counted} />}

            <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-base-content">Cierre de Caja</h2>
                <p className="text-sm opacity-60">Verifica los montos antes de confirmar</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* TARJETA 1: Resumen Ventas */}
                <div className="bg-base-100 p-5 rounded-3xl border border-base-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-base-content/40 uppercase tracking-wider">Ventas por Método</h3>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2"><span className="text-lg">💵</span> <span className="font-bold text-sm">Efectivo</span></div>
                        <span className="font-mono font-bold">${closingSummary.cashTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-info">
                        <div className="flex items-center gap-2"><span className="text-lg">💳</span> <span className="font-bold text-sm">Tarjeta</span></div>
                        <span className="font-mono font-bold">${closingSummary.cardTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-warning">
                        <div className="flex items-center gap-2"><span className="text-lg">🏦</span> <span className="font-bold text-sm">Transf.</span></div>
                        <span className="font-mono font-bold">${closingSummary.transferTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="divider my-1"></div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">Total Ventas</span>
                        <span className="font-black text-lg">${closingSummary.totalSales.toFixed(2)}</span>
                    </div>
                </div>

                {/* TARJETA 2: Cálculo de Caja */}
                <div className="bg-base-100 p-5 rounded-3xl border border-base-200 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-6xl">🧮</div>
                    <h3 className="text-xs font-bold text-base-content/40 uppercase tracking-wider">Arqueo de Caja</h3>
                    
                    <div className="flex justify-between text-sm">
                        <span className="opacity-70">Fondo Inicial</span>
                        <span className="font-mono font-bold">${currentShift.initialFund.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-success">
                        <span className="font-bold">(+) Ventas Efec.</span>
                        <span className="font-mono font-bold">${closingSummary.cashTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-error">
                        <span className="font-bold">(-) Gastos/Retiros</span>
                        <span className="font-mono font-bold">-${closingSummary.totalExpenses.toFixed(2)}</span>
                    </div>

                    <div className="bg-base-200 p-3 rounded-2xl mt-2 text-center">
                        <div className="text-[10px] font-bold uppercase opacity-50">Debe haber en caja</div>
                        <div className="text-2xl font-black text-base-content">${closingSummary.expectedCash.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* ZONA DE CONTEO */}
            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-visible">
                <div className="card-body p-6">
                    <h3 className="text-center font-bold text-lg mb-2">¿Cuánto efectivo contaste?</h3>
                    
                    <div className="text-5xl font-mono font-black text-center text-primary mb-2 tracking-tight">
                         ${inputAmount || <span className="opacity-20">0</span>}
                    </div>

                    {inputAmount && (
                         <div className={`badge badge-lg gap-2 mx-auto font-bold ${difference >= 0 ? 'badge-success text-white' : 'badge-error text-white'} py-4`}>
                            {difference >= 0 ? 'SOBRA' : 'FALTA'}: ${Math.abs(difference).toFixed(2)}
                        </div>
                    )}

                    <div className="divider my-0"></div>
                    
                    <div className="scale-90">
                        <Numpad onNumber={handleNumber} onBackspace={handleBackspace} />
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button onClick={() => { setClosingSummary(null); setInputAmount(''); }} className="btn btn-ghost flex-1 rounded-2xl">Cancelar</button>
                        <button 
                            onClick={() => requestAction('CONFIRM_CLOSE')} 
                            disabled={!inputAmount}
                            className="btn btn-primary flex-[2] rounded-2xl shadow-lg"
                        >
                            CONFIRMAR CORTE Z
                        </button>
                    </div>
                </div>
            </div>

            <PinPadModal 
                isOpen={isPinModalOpen} 
                onClose={() => setPinModalOpen(false)} 
                onSuccess={(name) => handleAuthSuccess(name)}
                title="Autorizar Cierre"
                requireAdmin={true}
            />
        </div>
      );
  }

  // --- VISTA 3: DASHBOARD ACTIVO (Estilo Moderno) ---
  return (
    <div className="max-w-4xl mx-auto mt-6 animate-fade-in p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
             <div>
                <h1 className="text-3xl font-black text-base-content">Control de Turno</h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-6">
                            <span className="text-xs">{currentShift.openedBy.charAt(0)}</span>
                        </div>
                    </div>
                    <span className="text-sm font-medium opacity-60">Abierto por {currentShift.openedBy} a las {formatShiftDate(currentShift.openedAt)}</span>
                </div>
             </div>
             <div className="badge badge-success gap-2 font-bold py-4 px-4 rounded-xl shadow-sm text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                CAJA ABIERTA
             </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Tarjeta Informativa */}
            <div className="stats shadow-lg bg-base-100 border border-base-200 overflow-visible">
                <div className="stat relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 text-9xl text-primary rotate-12">💰</div>
                    <div className="stat-title font-bold uppercase tracking-wider opacity-60">Fondo Inicial</div>
                    <div className="stat-value text-primary font-black text-5xl tracking-tight">
                        ${currentShift.initialFund.toFixed(2)}
                    </div>
                    <div className="stat-desc mt-2 font-medium">Dinero base en cajón</div>
                </div>
            </div>

            {/* Tarjeta de Acción */}
            <div className="card bg-base-100 shadow-lg border border-base-200 hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => requestAction('PRE_CLOSE')}
            >
                <div className="card-body items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-error/5 group-hover:bg-error/10 transition-colors"></div>
                    <div className="w-16 h-16 bg-error/20 text-error rounded-2xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                        🏁
                    </div>
                    <h2 className="card-title text-error">Cerrar Turno</h2>
                    <p className="text-sm opacity-60 max-w-xs">
                        Finaliza las operaciones del día y genera el Corte Z.
                    </p>
                </div>
            </div>
        </div>

        <PinPadModal 
            isOpen={isPinModalOpen} 
            onClose={() => setPinModalOpen(false)} 
            onSuccess={(name) => handleAuthSuccess(name)}
            title="Autorizar Corte"
            requireAdmin={true}
        />
    </div>
  );
};

// Componente Teclado
const Numpad = ({ onNumber, onBackspace }: { onNumber: (n:string)=>void, onBackspace: ()=>void }) => (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => onNumber(num.toString())} className="btn btn-circle btn-lg text-2xl font-light bg-base-100 shadow-sm border-base-200 hover:border-primary">{num}</button>
        ))}
        <button onClick={() => onNumber('.')} className="btn btn-circle btn-lg text-xl font-bold bg-base-100">.</button>
        <button onClick={() => onNumber('0')} className="btn btn-circle btn-lg text-2xl font-light bg-base-100 shadow-sm">0</button>
        <button onClick={onBackspace} className="btn btn-ghost btn-circle btn-lg text-xl text-error bg-error/5 hover:bg-error/20">⌫</button>
    </div>
);