// src/components/PaymentModal.tsx
import React, { useState, useEffect } from 'react';
import type { PaymentMethod, PaymentDetails, PaymentTransaction } from '../types/order';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (details: PaymentDetails) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, onClose, total, onConfirm 
}) => {
  const [isMixedMode, setIsMixedMode] = useState(false);

  // Estados
  const [amountReceived, setAmountReceived] = useState<string>(''); 
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  
  // Estados Mixtos
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmountReceived('');
      setCashAmount('');
      setCardAmount('');
      setTransferAmount('');
      setIsMixedMode(false);
      setSelectedMethod('cash');
    }
  }, [isOpen, total]);

  // Cálculos
  const numTotal = Number(total);
  const valCash = parseFloat(cashAmount) || 0;
  const valCard = parseFloat(cardAmount) || 0;
  const valTransfer = parseFloat(transferAmount) || 0;
  const totalCovered = valCash + valCard + valTransfer;
  const remaining = Math.max(0, numTotal - totalCovered);
  const mixedChange = Math.max(0, totalCovered - numTotal);

  const numReceived = parseFloat(amountReceived) || 0;
  const simpleChange = selectedMethod === 'cash' ? Math.max(0, numReceived - numTotal) : 0;

  const handleConfirm = () => {
    if (isMixedMode) {
      if (remaining > 0.5) { 
        toast.error(`Faltan $${remaining.toFixed(2)} por cubrir`);
        return;
      }
      const transactions: PaymentTransaction[] = [];
      if (valCash > 0) transactions.push({ method: 'cash', amount: valCash });
      if (valCard > 0) transactions.push({ method: 'card', amount: valCard });
      if (valTransfer > 0) transactions.push({ method: 'transfer', amount: valTransfer });

      onConfirm({
        method: 'mixed',
        totalPaid: totalCovered,
        amountPaid: numTotal,
        change: mixedChange,
        transactions
      });
    } else {
      if (selectedMethod === 'cash' && numReceived < numTotal) {
        toast.error("El monto recibido es menor al total");
        return;
      }
      onConfirm({
        method: selectedMethod,
        totalPaid: selectedMethod === 'cash' ? numReceived : numTotal,
        amountPaid: numTotal,
        change: simpleChange,
      });
    }
  };

  if (!isOpen) return null;

  return (
    // CAMBIO CLAVE: h-[100dvh] fuerza al modal a respetar el tamaño REAL visible (sin teclado)
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-base-100 sm:bg-black/60 sm:backdrop-blur-sm h-[100dvh]">
      
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-base-100 sm:rounded-3xl sm:shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER (Fijo Arriba) */}
        <div className="flex-none bg-base-100 px-4 py-3 text-center border-b border-base-200 z-20 shadow-sm">
            <div className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">Total a Pagar</div>
            <div className="text-4xl font-black text-primary tracking-tight">
                ${numTotal.toFixed(2)}
            </div>
        </div>

        {/* BODY (Flexible) */}
        <div className="flex-1 overflow-y-auto px-4 py-2 relative">
            
            {/* TABS COMPACTOS */}
            <div className="bg-base-200 p-1 rounded-xl flex mb-4 shrink-0">
                <button 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isMixedMode ? 'bg-white shadow-sm text-base-content' : 'text-base-content/50'}`} 
                    onClick={() => setIsMixedMode(false)}
                >
                    Pago Simple
                </button>
                <button 
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isMixedMode ? 'bg-white shadow-sm text-base-content' : 'text-base-content/50'}`} 
                    onClick={() => setIsMixedMode(true)}
                >
                    Dividido
                </button>
            </div>

            {/* === PAGO SIMPLE === */}
            {!isMixedMode && (
                <div className="space-y-4 animate-fade-in pb-2">
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'cash', label: 'Efectivo', icon: '💵' },
                            { id: 'card', label: 'Tarjeta', icon: '💳' },
                            { id: 'transfer', label: 'Transf.', icon: '🏦' },
                        ].map((m) => (
                            <button 
                                key={m.id}
                                onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                                className={`
                                    flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all
                                    ${selectedMethod === m.id 
                                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                                        : 'border-transparent bg-base-200 text-base-content/70'
                                    }
                                `}
                            >
                                <span className="text-xl">{m.icon}</span>
                                <span className="text-[10px] font-bold">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {selectedMethod === 'cash' && (
                        <div className="form-control">
                            <label className="label pl-1 pt-0 pb-1"><span className="label-text font-bold text-base-content/60 text-xs">Recibido</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-base-content/40">$</span>
                                <input 
                                    type="number" 
                                    inputMode="decimal"
                                    className="input input-lg input-bordered w-full pl-10 text-2xl font-bold bg-base-200 border-transparent focus:border-primary focus:bg-base-100 rounded-2xl h-14" 
                                    placeholder="0.00"
                                    autoFocus
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                />
                            </div>
                            
                            <div className={`mt-2 p-2 px-3 rounded-xl flex justify-between items-center transition-all ${numReceived >= numTotal ? 'bg-success/10 text-success' : 'bg-base-200/50 text-base-content/30'}`}>
                                <span className="font-bold text-xs">Cambio</span>
                                <span className="font-black text-xl">${simpleChange.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === PAGO MIXTO === */}
            {isMixedMode && (
                <div className="space-y-2 animate-fade-in pb-2">
                    {[
                        { label: 'Efectivo', val: cashAmount, set: setCashAmount, icon: '💵' },
                        { label: 'Tarjeta', val: cardAmount, set: setCardAmount, icon: '💳' },
                        { label: 'Transf.', val: transferAmount, set: setTransferAmount, icon: '🏦' },
                    ].map((field) => (
                        <div key={field.label} className="flex items-center gap-2">
                            <div className="w-20 flex items-center gap-1.5 font-bold text-base-content/70 shrink-0">
                                <span>{field.icon}</span> <span className="text-xs">{field.label}</span>
                            </div>
                            
                            <input 
                                type="number" 
                                inputMode="decimal"
                                className="input input-sm input-bordered flex-1 min-w-0 rounded-lg focus:border-primary bg-base-200 focus:bg-base-100 font-bold text-right h-10 text-lg" 
                                placeholder="0.00"
                                value={field.val}
                                onChange={(e) => field.set(e.target.value)}
                            />
                        </div>
                    ))}
                    
                    <div className="divider my-1"></div>
                    <div className="flex justify-between items-center px-1">
                        <div className="text-xs font-bold text-base-content/60">
                            {remaining > 0 ? 'Falta Pagar' : (mixedChange > 0 ? 'Dar Cambio' : 'Estado')}
                        </div>
                        
                        {remaining > 0 ? (
                            <div className="text-xl font-black text-error">
                                ${remaining.toFixed(2)}
                            </div>
                        ) : mixedChange > 0 ? (
                            // NUEVO: Mostrar el cambio a devolver en verde gigante
                            <div className="text-2xl font-black text-success animate-pulse">
                                ${mixedChange.toFixed(2)}
                            </div>
                        ) : (
                            <div className="text-xl font-black text-success">
                                ¡Cubierto Exacto!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER (Fijo Abajo) */}
        <div className="flex-none p-3 bg-base-100 border-t border-base-200 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-30">
            <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-lg btn-ghost rounded-2xl font-bold h-12 min-h-0 text-sm" onClick={onClose}>
                    Cancelar
                </button>
                <button 
                    className="btn btn-lg btn-primary rounded-2xl shadow-lg border-none h-12 min-h-0 text-base"
                    onClick={handleConfirm}
                    disabled={isMixedMode && remaining > 0.5}
                >
                    COBRAR
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};