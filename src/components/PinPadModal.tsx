// src/components/PinPadModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService'; // <--- Importamos el servicio
import { toast } from 'sonner';

interface PinPadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (authorizerName: string) => void;
    title?: string;
    requireAdmin?: boolean; // <--- NUEVA PROPIEDAD
}

export const PinPadModal: React.FC<PinPadModalProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    title = "Ingrese PIN",
    requireAdmin = false // Por defecto es falso, pero en ShiftScreen lo pondremos true
}) => {
    const [pin, setPin] = useState('');
    const [verifying, setVerifying] = useState(false);
    const { currentUser } = useAuthStore();

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setVerifying(false);
        }
    }, [isOpen]);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) setPin(prev => prev + num);
    };

    const handleClear = () => setPin('');
    const handleBackspace = () => setPin(prev => prev.slice(0, -1));

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (requireAdmin) {
            // --- MODO: AUTORIZACIÓN DE ADMIN/GERENTE ---
            // Buscamos en la BD de quién es este PIN
            setVerifying(true);
            try {
                // Reutilizamos el login para buscar al usuario dueño del PIN
                const adminUser = await authService.loginWithPin(pin);
                
                // Verificamos si tiene permisos
                if (adminUser.role === 'ADMIN' || adminUser.role === 'GERENTE') {
                    toast.success(`Autorizado por: ${adminUser.name}`);
                    onSuccess(adminUser.name);
                    onClose();
                } else {
                    toast.error("⛔ Este usuario no tiene permisos de Administrador");
                    setPin('');
                }
            } catch (error) {
                toast.error("PIN Incorrecto o no encontrado");
                setPin('');
            } finally {
                setVerifying(false);
            }

        } else {
            // --- MODO: AUTO-VERIFICACIÓN (Lo que tenías antes) ---
            // Solo verifica que sea EL MISMO usuario conectado
            if (!currentUser) return;
            const userPin = currentUser.pin || '0000';

            if (pin === userPin) {
                onSuccess(currentUser.name);
                onClose();
            } else {
                toast.error("PIN Incorrecto");
                setPin('');
            }
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="bg-base-100 p-6 rounded-box shadow-2xl max-w-sm mx-auto mt-20 border border-base-200 outline-none"
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start pt-20"
        >
            <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>
            {requireAdmin && (
                <p className="text-xs text-center text-error mb-4 uppercase tracking-widest font-bold">
                    Requiere Administrador
                </p>
            )}
            
            <form onSubmit={handleSubmit}>
                <input 
                    type="password" 
                    value={pin} 
                    readOnly 
                    className="input input-bordered w-full text-center text-3xl tracking-[1em] font-mono mb-6"
                    placeholder="••••"
                />

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button 
                            key={num} 
                            type="button"
                            onClick={() => handleNumberClick(num.toString())}
                            className="btn btn-lg btn-outline font-mono text-2xl"
                        >
                            {num}
                        </button>
                    ))}
                    <button type="button" onClick={handleClear} className="btn btn-lg btn-error text-white">C</button>
                    <button type="button" onClick={() => handleNumberClick('0')} className="btn btn-lg btn-outline font-mono text-2xl">0</button>
                    <button type="button" onClick={handleBackspace} className="btn btn-lg btn-warning text-white">⌫</button>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="btn flex-1">Cancelar</button>
                    <button 
                        type="submit" 
                        className="btn btn-primary flex-1" 
                        disabled={pin.length < 4 || verifying}
                    >
                        {verifying ? <span className="loading loading-spinner"></span> : 'Confirmar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};