// src/components/PaymentModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import type { PaymentMethod, PaymentDetails } from '../services/orderService';

// Estilos para el modal (puedes ajustarlos o moverlos a CSS)
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '400px',
    padding: '0',
    border: 'none',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden' // Para que el header no se salga
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000
  }
};

Modal.setAppElement('#root');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (paymentDetails: PaymentDetails) => void;
}

export const PaymentModal: React.FC<Props> = ({ isOpen, onClose, total, onConfirm }) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [cardFeePercent] = useState(0.035); // 3.5% ejemplo (Clip, MercadoPago, etc)

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      setMethod('cash');
      setAmountReceived('');
    }
  }, [isOpen]);

  // Cálculos
  const numericReceived = parseFloat(amountReceived) || 0;
  const cardFee = method === 'card' ? total * cardFeePercent : 0;
  const totalWithFee = total + cardFee;
  const change = method === 'cash' ? numericReceived - total : 0;
  
  const isValid = () => {
    if (method === 'cash') return numericReceived >= total;
    return true; // Tarjeta y transferencia se asume que pasan exacto
  };

  const handleConfirm = () => {
    if (!isValid()) return;

    onConfirm({
      method,
      amountPaid: method === 'cash' ? numericReceived : totalWithFee,
      change: method === 'cash' ? change : 0,
      cardFee: method === 'card' ? cardFee : 0
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Cobrar Orden"
    >
      {/* Header */}
      <div className="bg-primary p-4 text-primary-content text-center">
        <h2 className="text-2xl font-black m-0">Cobrar Orden</h2>
        <p className="text-sm opacity-90 m-0 mt-1">Selecciona método de pago</p>
      </div>

      <div className="p-6 bg-base-100">
        
        {/* Total Display */}
        <div className="text-center mb-6">
          <span className="text-sm text-base-content/60 uppercase font-bold">Total a Pagar</span>
          <div className="text-4xl font-black text-primary">
            ${totalWithFee.toFixed(2)}
          </div>
          {method === 'card' && (
            <span className="text-xs text-warning font-bold">
              (+${cardFee.toFixed(2)} Comisión)
            </span>
          )}
        </div>

        {/* Tabs de Método */}
        <div className="tabs tabs-boxed mb-4 bg-base-200 p-1">
          <a 
            className={`tab tab-lg flex-1 ${method === 'cash' ? 'tab-active bg-white shadow-sm font-bold' : ''}`}
            onClick={() => setMethod('cash')}
          >
            💵 Efec.
          </a>
          <a 
            className={`tab tab-lg flex-1 ${method === 'card' ? 'tab-active bg-white shadow-sm font-bold' : ''}`}
            onClick={() => setMethod('card')}
          >
            💳 Tarj.
          </a>
          <a 
            className={`tab tab-lg flex-1 ${method === 'transfer' ? 'tab-active bg-white shadow-sm font-bold' : ''}`}
            onClick={() => setMethod('transfer')}
          >
            🏦 Transf.
          </a>
        </div>

        {/* Contenido Dinámico */}
        {method === 'cash' && (
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text font-bold">Efectivo Recibido</span>
            </label>
            <input 
              type="number" 
              placeholder="0.00" 
              className="input input-bordered input-lg w-full text-center font-mono text-xl" 
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              autoFocus
            />
            <div className={`alert mt-3 ${change >= 0 ? 'alert-success' : 'alert-error'} py-2`}>
               <span className="font-bold w-full text-center block">
                 Cambio: ${change >= 0 ? change.toFixed(2) : 'FALTA DINERO'}
               </span>
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="alert alert-warning mb-4 text-sm">
             <span>⚠️ Se aplicará el 3.5% de comisión al cliente. Cobrar en terminal: <b>${totalWithFee.toFixed(2)}</b></span>
          </div>
        )}
        
        {method === 'transfer' && (
          <div className="alert alert-info mb-4 text-sm">
             <span>📲 Confirma que recibiste la transferencia por <b>${total.toFixed(2)}</b> antes de finalizar.</span>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancelar</button>
          <button 
            onClick={handleConfirm} 
            disabled={!isValid()} 
            className="btn btn-primary flex-1 font-bold text-lg shadow-lg"
          >
            Cobrar e Imprimir
          </button>
        </div>
      </div>
    </Modal>
  );
};