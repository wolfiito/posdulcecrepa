// src/components/ShiftsScreen.tsx
import React, { useState } from 'react'; 
import { useShiftStore } from '../store/useShiftStore';
import { useAuthStore } from '../store/useAuthStore';
import { shiftService, type ShiftMetrics } from '../services/shiftService';
import { AuthModal } from './AuthModal'; // <--- El nuevo componente de seguridad
import { ZReportTemplate } from './ZReportTemplate';
import { Timestamp } from '../firebase';
import { toast } from 'sonner';

export const ShiftsScreen: React.FC = () => {
  const { currentShift, isLoading, openShift, closeShift } = useShiftStore();
  const { currentUser } = useAuthStore();

  // Estados
  const [inputAmount, setInputAmount] = useState(''); // Usado para Apertura Y Cierre (teclado)
  const [closingSummary, setClosingSummary] = useState<ShiftMetrics | null>(null);
  const [printZReport, setPrintZReport] = useState(false);
  
  // Control de Modales y Flujo
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'OPEN' | 'PRE_CLOSE' | 'CONFIRM_CLOSE' | null>(null);
  const [adminName, setAdminName] = useState<string>(''); // Para guardar quién autorizó

  // --- LÓGICA DEL TECLADO NUMÉRICO (Reutilizable) ---
  const handleNumber = (num: string) => {
    if (inputAmount.length >= 8) return; 
    if (num === '.' && inputAmount.includes('.')) return; 
    setInputAmount(prev => prev + num);
  };
  const handleBackspace = () => setInputAmount(prev => prev.slice(0, -1));

  // --- FLUJO DE AUTORIZACIÓN ---
  const requestAction = (action: 'OPEN' | 'PRE_CLOSE' | 'CONFIRM_CLOSE') => {
      // Regla: Si es Admin/Gerente pasa directo. Si no, pide permiso.
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'GERENTE') {
          handleAuthSuccess(currentUser.name, action);
      } else {
          setPendingAction(action);
          setAuthModalOpen(true);
      }
  };

  const handleAuthSuccess = (authorizerName: string, actionOverride?: string) => {
      const action = actionOverride || pendingAction;
      setAdminName(authorizerName);

      if (action === 'OPEN') executeOpen(authorizerName);
      if (action === 'PRE_CLOSE') executePreClose();
      if (action === 'CONFIRM_CLOSE') executeFinalClose();
      
      setPendingAction(null);
  };

  // --- ACCIONES PRINCIPALES ---

  // 1. ABRIR CAJA
  const executeOpen = async (authorizer: string) => {
    const amount = parseFloat(inputAmount);
    if (!inputAmount || isNaN(amount)) return toast.warning("Monto inválido");

    try {
        await openShift(amount);
        toast.success(`Caja abierta por ${currentUser?.name} (Autorizó: ${authorizer})`);
        setInputAmount('');
    } catch (error) {
        toast.error("Error al abrir caja");
    }
  };

  // 2. PREPARAR CIERRE (Calcular métricas)
  const executePreClose = async () => {
      if (!currentShift) return;
      try {
          const metrics = await shiftService.getShiftMetrics(currentShift);
          setClosingSummary(metrics);
          setInputAmount(''); // Limpiamos el input para usarlo ahora como "Conteo Final"
          setPrintZReport(false);
      } catch (e) {
          toast.error("Error calculando corte");
      }
  };

  // 3. CONFIRMAR CIERRE E IMPRIMIR
  const executeFinalClose = async () => {
      if (!inputAmount || !closingSummary) return;
      const finalCash = parseFloat(inputAmount);
      
      setPrintZReport(true); // Activar template invisible

      setTimeout(async () => {
          window.print(); // Diálogo de impresión
          
          await closeShift(finalCash);
          
          setClosingSummary(null);
          setInputAmount('');
          setPrintZReport(false);
          toast.success("Turno cerrado y Corte Z generado");
      }, 500);
  };

  // Helper de Fechas
  const formatShiftDate = (dateOrTimestamp: any) => {
      if (!dateOrTimestamp) return '';
      if (dateOrTimestamp instanceof Timestamp) return dateOrTimestamp.toDate().toLocaleTimeString();
      return new Date(dateOrTimestamp).toLocaleTimeString();
  };

  // ---------------- RENDER ----------------

  if (isLoading) return <div className="flex justify-center p-20"><span className="loading loading-spinner text-primary"></span></div>;

  // VISTA 1: CAJA CERRADA (TECLADO DE APERTURA)
  if (!currentShift) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fade-in select-none">
            <div className="card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200">
                <div className="card-body items-center text-center p-0 sm:p-8">
                    
                    <div className="mb-6 mt-6">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">🔓</div>
                        <h1 className="text-2xl font-bold">Abrir Caja</h1>
                        <p className="text-xs opacity-60">Hola, {currentUser?.name}</p>
                    </div>

                    {/* Display Monto */}
                    <div className="w-full mb-6 px-4">
                        <div className="bg-base-200 rounded-2xl p-6 text-center border-2 focus-within:border-primary">
                            <p className="text-xs font-bold opacity-40 uppercase mb-1">Fondo Inicial</p>
                            <div className="text-4xl font-mono font-bold text-base-content flex justify-center items-center h-12">
                                <span className="text-primary mr-2">$</span>
                                {inputAmount ? inputAmount : <span className="opacity-20">0</span>}
                            </div>
                        </div>
                    </div>

                    {/* Teclado */}
                    <Numpad onNumber={handleNumber} onBackspace={handleBackspace} />

                    <div className="w-full px-4 mb-6">
                        <button 
                            onClick={() => requestAction('OPEN')} 
                            disabled={!inputAmount}
                            className="btn btn-primary btn-block btn-lg shadow-lg"
                        >
                            Confirmar Apertura
                        </button>
                    </div>
                </div>
            </div>
            
            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setAuthModalOpen(false)} 
                onSuccess={(name) => handleAuthSuccess(name)}
                title="Autorizar Apertura"
            />
        </div>
      );
  }

  // VISTA 2: RESUMEN DE CIERRE (MÉTRICAS + CONTEO FINAL)
  if (closingSummary) {
      const counted = parseFloat(inputAmount) || 0;
      const difference = counted - closingSummary.expectedCash;
      
      return (
        <div className="max-w-lg mx-auto mt-10 animate-fade-in pb-20">
            {/* Ticket Invisible */}
            {printZReport && (
                <ZReportTemplate shift={currentShift} metrics={closingSummary} finalCount={counted} />
            )}

            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-0 sm:p-8">
                    <h2 className="card-title text-error justify-center mb-6 mt-4">🛑 Cerrar Turno</h2>

                    {/* Tabla de Métricas (Tu lógica original) */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4 bg-base-200 p-4 rounded-box mx-4">
                        <div className="opacity-70">Fondo Inicial:</div>
                        <div className="text-right font-mono font-bold">${currentShift.initialFund.toFixed(2)}</div>
                        
                        <div className="opacity-70 text-success font-bold">(+) Efec. Ventas:</div>
                        <div className="text-right font-mono font-bold text-success">${closingSummary.cashTotal.toFixed(2)}</div>
                        
                        {/* --- NUEVAS FILAS --- */}
                        <div className="opacity-70 text-info">(+) Tarjeta:</div>
                        <div className="text-right font-mono font-bold text-info">${closingSummary.cardTotal.toFixed(2)}</div>

                        <div className="opacity-70 text-warning">(+) Transferencia:</div>
                        <div className="text-right font-mono font-bold text-warning">${closingSummary.transferTotal.toFixed(2)}</div>
                        {/* -------------------- */}

                        <div className="opacity-70 text-error">(-) Efec. Gastos:</div>
                        <div className="text-right font-mono font-bold text-error">-${closingSummary.totalExpenses.toFixed(2)}</div>
                        
                        <div className="col-span-2 divider my-1"></div>
                        
                        <div className="opacity-70 font-bold">Total Ventas:</div>
                        <div className="text-right font-bold">${closingSummary.totalSales.toFixed(2)}</div>

                        <div className="font-black text-lg mt-2">EFECTIVO EN CAJA:</div>
                        <div className="text-right font-black text-lg mt-2 border-b-2 border-base-content">${closingSummary.expectedCash.toFixed(2)}</div>
                        <div className="col-span-2 text-[10px] text-center opacity-50 uppercase tracking-widest mb-1">(Solo billetes y monedas)</div>
                    </div>

                    {/* Input de Conteo (Usando el mismo estado inputAmount y Teclado) */}
                    <div className="px-4 text-center mb-4">
                        <label className="label justify-center"><span className="label-text font-bold text-lg">¿Cuánto efectivo hay?</span></label>
                        <div className="text-4xl font-mono font-bold text-base-content border-b-2 border-base-300 pb-2">
                            ${inputAmount || '0'}
                        </div>
                    </div>

                    {/* Diferencia en tiempo real */}
                    {inputAmount && (
                         <div className={`mx-4 alert ${difference >= 0 ? 'alert-success' : 'alert-error'} mb-4 py-2`}>
                            <div className="flex-1 text-center">
                                <div className="text-xs font-bold uppercase">Diferencia</div>
                                <div className="text-xl font-black">{difference >= 0 ? `+ $${difference.toFixed(2)}` : `- $${Math.abs(difference).toFixed(2)}`}</div>
                            </div>
                        </div>
                    )}

                    {/* Teclado para el conteo */}
                    <div className="scale-90 origin-top">
                        <Numpad onNumber={handleNumber} onBackspace={handleBackspace} />
                    </div>

                    <div className="card-actions flex-col gap-3 px-4 mb-4">
                        <button 
                            onClick={() => requestAction('CONFIRM_CLOSE')} 
                            disabled={!inputAmount}
                            className="btn btn-error btn-block btn-lg text-white shadow-lg"
                        >
                            CONFIRMAR CORTE Z 🖨️
                        </button>
                        <button onClick={() => { setClosingSummary(null); setInputAmount(''); }} className="btn btn-ghost btn-block">Cancelar</button>
                    </div>
                </div>
            </div>

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setAuthModalOpen(false)} 
                onSuccess={(name) => handleAuthSuccess(name)}
                title="Autorizar Corte Z"
            />
        </div>
      );
  }

  // VISTA 3: DASHBOARD (TURNO ABIERTO)
  return (
    <div className="max-w-4xl mx-auto mt-6 animate-fade-in p-4">
        <div className="flex justify-between items-center mb-6">
             <div>
                <h1 className="text-3xl font-bold">Control de Caja</h1>
                <p className="text-sm opacity-60">Turno de: {currentShift.openedBy}</p>
             </div>
             <div className="badge badge-success gap-2 font-bold p-3">🟢 ABIERTO</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Info Card */}
            <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body text-center">
                    <div className="text-5xl mb-2">💰</div>
                    <h2 className="text-lg opacity-60 font-bold uppercase">Fondo Inicial</h2>
                    <p className="text-4xl font-mono font-bold text-primary">${currentShift.initialFund.toFixed(2)}</p>
                    <p className="text-xs mt-2 opacity-40">Abierto a las {formatShiftDate(currentShift.openedAt)}</p>
                </div>
            </div>

            {/* Action Card */}
            <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body items-center justify-center">
                    <p className="text-center opacity-70 mb-6">
                        Para finalizar el turno, realiza el conteo de efectivo.
                    </p>
                    <button 
                        onClick={() => requestAction('PRE_CLOSE')} // Llama a la autorización/cálculo
                        className="btn btn-error btn-wide shadow-md"
                    >
                        Realizar Corte de Caja
                    </button>
                </div>
            </div>
        </div>

        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setAuthModalOpen(false)} 
            onSuccess={(name) => handleAuthSuccess(name)}
            title="Autorizar Corte"
        />
    </div>
  );
};

// Componente Local de Teclado (Para no repetir código)
const Numpad = ({ onNumber, onBackspace }: { onNumber: (n:string)=>void, onBackspace: ()=>void }) => (
    <div className="grid grid-cols-3 gap-3 w-full px-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => onNumber(num.toString())} className="btn btn-circle btn-lg text-2xl font-light bg-base-100 shadow-sm">{num}</button>
        ))}
        <button onClick={() => onNumber('.')} className="btn btn-circle btn-lg text-xl font-bold">.</button>
        <button onClick={() => onNumber('0')} className="btn btn-circle btn-lg text-2xl font-light bg-base-100 shadow-sm">0</button>
        <button onClick={onBackspace} className="btn btn-ghost btn-circle btn-lg text-xl text-error">⌫</button>
    </div>
);