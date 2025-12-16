// src/components/ShiftsScreen.tsx
import React, { useState } from 'react'; // Ya no necesitamos useEffect aquí
import { useShiftStore } from '../store/useShiftStore';
import { useAuthStore } from '../store/useAuthStore';
import { shiftService } from '../services/shiftService';
import { PinPadModal } from './PinPadModal';
import { Timestamp } from '../firebase';

export const ShiftsScreen: React.FC = () => {
  // 1. QUITAMOS 'checkCurrentShift' DEL DESTRUCTURING
  // El store ya se actualiza solo gracias al listener en PosPage
  const { currentShift, isLoading, openShift, closeShift } = useShiftStore();
  const { currentUser } = useAuthStore();

  const [initialAmount, setInitialAmount] = useState('');
  const [finalCount, setFinalCount] = useState('');
  const [closingSummary, setClosingSummary] = useState<{salesCash: number, expenses: number, expectedCash: number} | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // 2. ELIMINAMOS EL USEEFFECT QUE LLAMABA A checkCurrentShift()
  // useEffect(() => { checkCurrentShift(); }, []); <--- BORRAR ESTA LÍNEA

  const handleOpenClick = () => {
    if (!initialAmount) return;
    setShowAuth(true); 
  };

  const handleAuthorizedOpen = () => {
      openShift(parseFloat(initialAmount));
  };

  const handlePreClose = async () => {
    if (!currentShift) return;
    const metrics = await shiftService.getShiftMetrics(currentShift);
    setClosingSummary(metrics);
  };

  const handleConfirmClose = async () => {
    if (!finalCount) return;
    await closeShift(parseFloat(finalCount));
    setClosingSummary(null);
    setFinalCount('');
    setInitialAmount('');
  };

  const formatShiftDate = (dateOrTimestamp: any) => {
      if (!dateOrTimestamp) return '';
      if (dateOrTimestamp instanceof Timestamp) {
          return dateOrTimestamp.toDate().toLocaleTimeString();
      }
      return new Date(dateOrTimestamp).toLocaleTimeString();
  };

  if (isLoading) return <div className="flex justify-center p-20"><span className="loading loading-spinner text-primary"></span></div>;

  // --- VISTA 1: CAJA CERRADA ---
  if (!currentShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="card w-96 bg-base-100 shadow-xl border border-base-200">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-2 text-3xl">🔒</div>
            <h2 className="card-title">Caja Cerrada</h2>
            <p className="text-sm opacity-60">Se requiere autorización para abrir.</p>
            
            <div className="form-control w-full mt-4">
              <label className="label"><span className="label-text font-bold">Fondo Inicial</span></label>
              <input 
                type="number" placeholder="$0.00" className="input input-bordered input-lg text-center font-mono text-xl" 
                value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} autoFocus
              />
            </div>
            
            <button onClick={handleOpenClick} disabled={!initialAmount} className="btn btn-primary btn-block mt-6">
              Abrir Turno
            </button>
          </div>
        </div>
        <PinPadModal 
            isOpen={showAuth}
            onClose={() => setShowAuth(false)}
            onSuccess={handleAuthorizedOpen}
            title="Autorizar Apertura"
            requireAdmin={true}
        />
      
      </div>
    );
  }

  // --- VISTA 2: CAJA ABIERTA (Resumen de Cierre) ---
  if (closingSummary) {
      const counted = parseFloat(finalCount) || 0;
      const difference = counted - closingSummary.expectedCash;
      return (
        <div className="max-w-lg mx-auto mt-10 animate-fade-in">
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body">
                    <h2 className="card-title text-error justify-center mb-6">🛑 Cerrar Turno</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-base-200 p-4 rounded-box">
                        <div className="opacity-70">Fondo Inicial:</div>
                        <div className="text-right font-mono font-bold">${currentShift.initialFund.toFixed(2)}</div>
                        <div className="opacity-70 text-success">(+) Ventas Efectivo:</div>
                        <div className="text-right font-mono font-bold text-success">${closingSummary.salesCash.toFixed(2)}</div>
                        <div className="opacity-70 text-error">(-) Gastos Efectivo:</div>
                        <div className="text-right font-mono font-bold text-error">-${closingSummary.expenses.toFixed(2)}</div>
                        <div className="col-span-2 divider my-1"></div>
                        <div className="font-black">DEBERÍA HABER:</div>
                        <div className="text-right font-black text-lg">${closingSummary.expectedCash.toFixed(2)}</div>
                    </div>
                    <div className="form-control w-full mb-6">
                        <label className="label"><span className="label-text font-bold text-lg">¿Cuánto dinero contaste?</span></label>
                        <input type="number" className="input input-bordered input-lg text-center font-mono text-2xl bg-base-100 border-primary" placeholder="$0.00" value={finalCount} onChange={e => setFinalCount(e.target.value)} autoFocus />
                    </div>
                    {finalCount && (
                        <div className={`alert ${difference >= 0 ? 'alert-success' : 'alert-error'} mb-6`}>
                            <div className="flex-1">
                                <label className="text-xs font-bold uppercase">Diferencia</label>
                                <div className="text-xl font-black">{difference >= 0 ? `+ $${difference.toFixed(2)} (Sobra)` : `- $${Math.abs(difference).toFixed(2)} (Falta)`}</div>
                            </div>
                        </div>
                    )}
                    <div className="card-actions flex-col gap-3">
                        <button onClick={handleConfirmClose} className="btn btn-error btn-block btn-lg text-white">CONFIRMAR CIERRE</button>
                        <button onClick={() => setClosingSummary(null)} className="btn btn-ghost btn-block">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- VISTA 3: CAJA ABIERTA (Info General) ---
  return (
    <div className="max-w-4xl mx-auto mt-6 animate-fade-in">
        <div className="grid md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-md border border-base-200">
                <div className="card-body">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="card-title text-success">🟢 Turno Abierto</h2>
                            <p className="text-xs opacity-60 mt-1">Abierto por: {currentShift.openedBy}</p>
                            <p className="text-xs opacity-60">Hora: {formatShiftDate(currentShift.openedAt)}</p>
                        </div>
                        <div className="text-4xl">🔓</div>
                    </div>
                    <div className="stats stats-vertical shadow mt-6 bg-base-200/50">
                        <div className="stat"><div className="stat-title">Fondo Inicial</div><div className="stat-value text-2xl">${currentShift.initialFund.toFixed(2)}</div></div>
                    </div>
                </div>
            </div>
            <div className="card bg-base-100 shadow-md border border-base-200 flex items-center justify-center">
                <div className="card-body items-center w-full">
                    <p className="text-center opacity-70 mb-6">Al finalizar el día, realiza el conteo de efectivo y cierra la caja.</p>
                    <button 
                        onClick={handlePreClose} 
                        className="btn btn-outline btn-error btn-wide"
                        disabled={currentUser?.id !== currentShift.userId && currentUser?.role !== 'ADMIN'}
                    >
                        Realizar Corte de Caja
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};