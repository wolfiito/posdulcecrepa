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
  isOpen, 
  onClose, 
  total, 
  onConfirm 
}) => {
  // Estado del modo de pago
  const [isMixedMode, setIsMixedMode] = useState(false);

  // Estados para montos
  const [amountReceived, setAmountReceived] = useState<string>(''); // Para pago simple efectivo
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  
  // Estados para pago mixto
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset al abrir
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
  
  // Cálculos MIXTOS
  const valCash = parseFloat(cashAmount) || 0;
  const valCard = parseFloat(cardAmount) || 0;
  const valTransfer = parseFloat(transferAmount) || 0;
  const totalCovered = valCash + valCard + valTransfer;
  const remaining = Math.max(0, numTotal - totalCovered);
  const mixedChange = Math.max(0, totalCovered - numTotal);

  // Cálculos SIMPLES
  const numReceived = parseFloat(amountReceived) || 0;
  const simpleChange = selectedMethod === 'cash' ? Math.max(0, numReceived - numTotal) : 0;

  const handleConfirm = () => {
    // 1. Lógica para PAGO MIXTO
    if (isMixedMode) {
      if (remaining > 0.5) { // Margen de 50 centavos por redondeo
        toast.error(`Faltan $${remaining.toFixed(2)} por cubrir`);
        return;
      }

      const transactions: PaymentTransaction[] = [];
      if (valCash > 0) transactions.push({ method: 'cash', amount: valCash });
      if (valCard > 0) transactions.push({ method: 'card', amount: valCard });
      if (valTransfer > 0) transactions.push({ method: 'transfer', amount: valTransfer });

      const details: PaymentDetails = {
        method: 'mixed',
        totalPaid: totalCovered, // Lo que sumaron todos los métodos
        amountPaid: numTotal,    // Lo que costaba la orden
        change: mixedChange,
        transactions: transactions // <--- AQUÍ VA LA MAGIA
      };
      
      onConfirm(details);
    } 
    
    // 2. Lógica para PAGO SIMPLE (Legacy)
    else {
      if (selectedMethod === 'cash' && numReceived < numTotal) {
        toast.error("El monto recibido es menor al total");
        return;
      }

      const finalPaid = selectedMethod === 'cash' ? numReceived : numTotal;

      const details: PaymentDetails = {
        method: selectedMethod,
        totalPaid: finalPaid,
        amountPaid: numTotal,
        change: simpleChange,
        // No enviamos transactions en pago simple para mantenerlo ligero
      };

      onConfirm(details);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-2xl mb-4 text-center">
            Total a Pagar: <span className="text-primary">${numTotal.toFixed(2)}</span>
        </h3>

        {/* --- TABS PARA CAMBIAR MODO --- */}
        <div className="tabs tabs-boxed mb-4">
            <a 
                className={`tab flex-1 ${!isMixedMode ? 'tab-active' : ''}`} 
                onClick={() => setIsMixedMode(false)}
            >
                Pago Simple
            </a>
            <a 
                className={`tab flex-1 ${isMixedMode ? 'tab-active' : ''}`} 
                onClick={() => setIsMixedMode(true)}
            >
                Pago Dividido 🍰
            </a>
        </div>

        {/* === MODO PAGO SIMPLE === */}
        {!isMixedMode && (
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        className={`btn ${selectedMethod === 'cash' ? 'btn-secondary' : 'btn-outline'}`}
                        onClick={() => setSelectedMethod('cash')}
                    >
                        💵 Efectivo
                    </button>
                    <button 
                        className={`btn ${selectedMethod === 'card' ? 'btn-secondary' : 'btn-outline'}`}
                        onClick={() => setSelectedMethod('card')}
                    >
                        💳 Tarjeta
                    </button>
                    <button 
                        className={`btn ${selectedMethod === 'transfer' ? 'btn-secondary' : 'btn-outline'}`}
                        onClick={() => setSelectedMethod('transfer')}
                    >
                        🏦 Transf.
                    </button>
                </div>

                {selectedMethod === 'cash' && (
                    <div className="form-control">
                        <label className="label"><span className="label-text">¿Con cuánto paga?</span></label>
                        <input 
                            type="number" 
                            className="input input-bordered input-lg text-center text-xl" 
                            placeholder="$0.00"
                            autoFocus
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                        />
                        {numReceived > numTotal && (
                            <div className="alert alert-success mt-2 py-2">
                                Cambio: <span className="font-bold text-xl">${simpleChange.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* === MODO PAGO MIXTO === */}
        {isMixedMode && (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="w-24 font-bold">💵 Efectivo:</span>
                    <input 
                        type="number" 
                        className="input input-bordered flex-1" 
                        placeholder="$0.00"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-24 font-bold">💳 Tarjeta:</span>
                    <input 
                        type="number" 
                        className="input input-bordered flex-1" 
                        placeholder="$0.00"
                        value={cardAmount}
                        onChange={(e) => setCardAmount(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-24 font-bold">🏦 Transf.:</span>
                    <input 
                        type="number" 
                        className="input input-bordered flex-1" 
                        placeholder="$0.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                    />
                </div>

                <div className="divider my-1"></div>
                
                <div className="flex justify-between text-sm">
                    <span>Cubierto:</span>
                    <span className="font-bold">${totalCovered.toFixed(2)}</span>
                </div>
                
                {remaining > 0 ? (
                    <div className="flex justify-between text-error font-bold text-lg">
                        <span>Falta:</span>
                        <span>${remaining.toFixed(2)}</span>
                    </div>
                ) : (
                    <div className="flex justify-between text-success font-bold text-lg">
                        <span>Cambio:</span>
                        <span>${mixedChange.toFixed(2)}</span>
                    </div>
                )}
            </div>
        )}

        {/* --- BOTONES ACCIÓN --- */}
        <div className="modal-action">
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button 
                className="btn btn-primary px-8"
                onClick={handleConfirm}
                disabled={isMixedMode && remaining > 0.5} // Bloquear si falta dinero (margen de error pequeño)
            >
                COBRAR 💰
            </button>
        </div>
      </div>
    </div>
  );
};