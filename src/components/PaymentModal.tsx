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
    <div className="modal modal-open bg-base-300/80 backdrop-blur-sm z-50">
      <div className="modal-box max-w-md p-0 overflow-hidden bg-base-100 shadow-2xl rounded-3xl">
        
        {/* HEADER: Total Gigante */}
        <div className="bg-base-100 p-6 text-center border-b border-base-200">
            <div className="text-sm font-bold text-base-content/50 uppercase tracking-wide mb-1">Total a Pagar</div>
            <div className="text-5xl font-black text-primary tracking-tight">
                ${numTotal.toFixed(2)}
            </div>
        </div>

        <div className="p-6 pt-4">
            {/* TABS (Segmented Control Estilo iOS) */}
            <div className="bg-base-200 p-1 rounded-2xl flex mb-6 relative">
                <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${!isMixedMode ? 'bg-white shadow-sm text-base-content' : 'text-base-content/50 hover:bg-white/50'}`} 
                    onClick={() => setIsMixedMode(false)}
                >
                    Pago Simple
                </button>
                <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${isMixedMode ? 'bg-white shadow-sm text-base-content' : 'text-base-content/50 hover:bg-white/50'}`} 
                    onClick={() => setIsMixedMode(true)}
                >
                    Pago Dividido
                </button>
            </div>

            {/* === MODO PAGO SIMPLE === */}
            {!isMixedMode && (
                <div className="space-y-6 animate-fade-in">
                    {/* Botones Grandes de Método */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'cash', label: 'Efectivo', icon: '💵' },
                            { id: 'card', label: 'Tarjeta', icon: '💳' },
                            { id: 'transfer', label: 'Transf.', icon: '🏦' },
                        ].map((m) => (
                            <button 
                                key={m.id}
                                onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                                className={`
                                    flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 transition-all
                                    ${selectedMethod === m.id 
                                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                                        : 'border-transparent bg-base-200 text-base-content/70 hover:bg-base-300'
                                    }
                                `}
                            >
                                <span className="text-2xl">{m.icon}</span>
                                <span className="text-xs font-bold">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Input Efectivo */}
                    {selectedMethod === 'cash' && (
                        <div className="form-control">
                            <label className="label pl-1 pt-0"><span className="label-text font-bold text-base-content/60">Recibido</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-base-content/40">$</span>
                                <input 
                                    type="number" 
                                    className="input input-lg input-bordered w-full pl-10 text-2xl font-bold bg-base-200 border-transparent focus:border-primary focus:bg-base-100 rounded-2xl" 
                                    placeholder="0.00"
                                    autoFocus
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                />
                            </div>
                            
                            {/* Cambio Dinámico */}
                            <div className={`mt-3 p-3 rounded-2xl flex justify-between items-center transition-all ${numReceived >= numTotal ? 'bg-success/10 text-success' : 'bg-base-200/50 text-base-content/30'}`}>
                                <span className="font-bold text-sm">Cambio</span>
                                <span className="font-black text-2xl">${simpleChange.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === MODO PAGO MIXTO === */}
            {isMixedMode && (
                <div className="space-y-3 animate-fade-in">
                    {[
                        { label: 'Efectivo', val: cashAmount, set: setCashAmount, icon: '💵' },
                        { label: 'Tarjeta', val: cardAmount, set: setCardAmount, icon: '💳' },
                        { label: 'Transf.', val: transferAmount, set: setTransferAmount, icon: '🏦' },
                    ].map((field) => (
                        <div key={field.label} className="flex items-center gap-3">
                            <div className="w-28 flex items-center gap-2 font-bold text-base-content/70">
                                <span>{field.icon}</span> {field.label}
                            </div>
                            <input 
                                type="number" 
                                className="input input-bordered flex-1 rounded-xl focus:border-primary bg-base-200 focus:bg-base-100 font-bold text-right" 
                                placeholder="$0.00"
                                value={field.val}
                                onChange={(e) => field.set(e.target.value)}
                            />
                        </div>
                    ))}

                    <div className="divider my-2"></div>
                    
                    <div className="flex justify-between items-end">
                        <div className="text-sm font-bold text-base-content/60">Restante</div>
                        {remaining > 0 ? (
                            <div className="text-xl font-black text-error">${remaining.toFixed(2)}</div>
                        ) : (
                            <div className="text-xl font-black text-success">¡Cubierto!</div>
                        )}
                    </div>
                </div>
            )}

            {/* BOTONES ACCIÓN */}
            <div className="grid grid-cols-2 gap-3 mt-8">
                <button className="btn btn-lg btn-ghost rounded-2xl font-bold" onClick={onClose}>
                    Cancelar
                </button>
                <button 
                    className="btn btn-lg btn-primary rounded-2xl shadow-lg border-none"
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