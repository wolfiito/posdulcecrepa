// src/components/PinPadModal.tsx
import React, { useState } from 'react';
import Modal from 'react-modal';
import { db, collection, query, where, getDocs } from '../firebase';
import type { UserRole } from '../store/useAuthStore';

const customStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%',
    transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '350px',
    padding: '20px', borderRadius: '1rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 2000 }
};

Modal.setAppElement('#root');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authorizerName: string) => void;
  title?: string;
  allowedRoles?: UserRole[];
}

export const PinPadModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, title = "Autorización Requerida", allowedRoles = ['ADMIN', 'GERENTE'] }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
        setPin(prev => prev + num);
        setError('');
    }
  };

  const handleBackspace = () => setPin(prev => prev.slice(0, -1));

  const handleVerify = async () => {
    if (pin.length === 0) return;
    setLoading(true);
    try {
        const q = query(collection(db, 'users'), where('pin', '==', pin));
        const snap = await getDocs(q);

        if (snap.empty) throw new Error('PIN incorrecto');

        const userData = snap.docs[0].data();
        if (!allowedRoles.includes(userData.role)) {
            throw new Error('No tienes permisos para realizar esta acción');
        }

        // ¡Éxito!
        onSuccess(userData.name);
        setPin('');
        onClose();

    } catch (err: any) {
        setError(err.message);
        setPin('');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles}>
        <div className="text-center">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-xs opacity-60 mb-4">Ingresa PIN de Gerente/Admin</p>
            
            {/* Puntos del PIN */}
            <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < pin.length ? 'bg-primary' : 'bg-base-300'}`} />
                ))}
            </div>

            {error && <div className="text-error text-xs font-bold mb-3 animate-pulse">{error}</div>}

            <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => handleNumber(num.toString())} className="btn btn-outline btn-md text-xl font-mono">{num}</button>
                ))}
                <button onClick={onClose} className="btn btn-ghost text-xs">Cancelar</button>
                <button onClick={() => handleNumber('0')} className="btn btn-outline btn-md text-xl font-mono">0</button>
                <button onClick={handleBackspace} className="btn btn-ghost text-xl text-warning">⌫</button>
            </div>

            <button onClick={handleVerify} disabled={loading || pin.length < 4} className="btn btn-primary btn-block">
                {loading ? <span className="loading loading-spinner"></span> : 'Autorizar'}
            </button>
        </div>
    </Modal>
  );
};