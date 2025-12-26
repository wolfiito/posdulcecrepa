// src/components/PinPadModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { toast } from 'sonner';

Modal.setAppElement('#root');

interface PinPadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (authorizerName: string) => void;
    title?: string;
    requireAdmin?: boolean;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    title = "Autorización Requerida",
    requireAdmin = false 
}) => {
    const [pin, setPin] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const { currentUser } = useAuthStore();

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setIsShaking(false);
            setVerifying(false);
        }
    }, [isOpen]);

    // --- FUNCIÓN HÁPTICA ---
    const triggerHaptic = () => {
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const triggerShake = (msg: string) => {
        setIsShaking(true);
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        toast.error(msg);
        setTimeout(() => {
            setIsShaking(false);
            setPin('');
        }, 500);
    };

    const handleNumberClick = (num: string) => {
        triggerHaptic();
        if (pin.length < 6 && !verifying) { // Aumenté a 6 dígitos por estándar, pero funciona con 4
            const newPin = pin + num;
            setPin(newPin);
        }
    };

    const handleClear = () => {
        triggerHaptic();
        setPin('');
    };

    const handleBackspace = () => {
        triggerHaptic();
        setPin(prev => prev.slice(0, -1));
    };

    // --- TU LÓGICA DE VERIFICACIÓN ---
    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (verifying || !pin) return;
        
        setVerifying(true);
        
        try {
            if (requireAdmin) {
                // LÓGICA DE ADMIN (Tuya)
                const adminUser = await authService.loginWithPin(pin);
                
                if (adminUser.role === 'ADMIN' || adminUser.role === 'GERENTE') {
                    if (navigator.vibrate) navigator.vibrate([10, 50]);
                    toast.success(`Autorizado por: ${adminUser.name}`);
                    onSuccess(adminUser.name);
                    onClose();
                } else {
                    triggerShake("⛔ Sin permisos de Administrador");
                }
            } else {
                // LÓGICA DE USUARIO ACTUAL (Tuya)
                if (!currentUser) return;
                const userPin = currentUser.pin || '0000';

                if (pin === userPin) {
                    onSuccess(currentUser.name);
                    onClose();
                } else {
                    triggerShake("PIN Incorrecto");
                }
            }
        } catch (error) {
            triggerShake("PIN Incorrecto o no encontrado");
        } finally {
            setVerifying(false);
        }
    };

    // Auto-submit opcional si el PIN es de longitud fija (ej. 4)
    // Descomentar si tus PINs siempre son de 4 dígitos
    /*
    useEffect(() => {
        if (pin.length === 4) handleSubmit();
    }, [pin]);
    */

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="bg-transparent border-none outline-none p-4 flex items-center justify-center min-h-screen"
            overlayClassName="fixed inset-0 bg-base-300/80 backdrop-blur-md z-[60] flex items-center justify-center animate-fade-in"
        >
            <style>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  20%, 60% { transform: translateX(-10px); }
                  40%, 80% { transform: translateX(10px); }
                }
                .shake-anim { animation: shake 0.4s ease-in-out; border-color: #ff5252 !important; }
            `}</style>

            <div className="bg-base-100 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-base-200">
                <div className="bg-base-100 p-6 text-center pb-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${requireAdmin ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                        {requireAdmin ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        )}
                    </div>
                    <h3 className="text-xl font-black text-base-content">{title}</h3>
                    {requireAdmin && <p className="text-xs text-error font-bold uppercase tracking-widest mt-1">Requiere Admin</p>}
                </div>

                {/* Input Visual (Puntos) */}
                <div className="flex justify-center my-6">
                     <div className={`flex gap-3 px-4 py-3 rounded-2xl bg-base-200/50 transition-all ${isShaking ? 'shake-anim bg-error/10' : ''}`}>
                        {/* Mostramos 4 puntos fijos o dinámicos según tu preferencia */}
                        <input 
                            type="password" 
                            value={pin} 
                            readOnly 
                            className="bg-transparent text-center font-black text-2xl tracking-[0.5em] w-32 outline-none"
                            placeholder="••••"
                        />
                     </div>
                </div>

                {/* Teclado Premium */}
                <div className="p-6 pt-0">
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                                key={num} 
                                onClick={() => handleNumberClick(num.toString())}
                                className="btn btn-circle btn-lg h-16 w-16 text-2xl font-light bg-base-100 border-base-200 shadow-sm hover:border-primary active:scale-90 transition-all"
                            >
                                {num}
                            </button>
                        ))}
                        <button onClick={handleClear} className="btn btn-ghost btn-sm text-xs font-bold text-base-content/50">C</button>
                        <button 
                            onClick={() => handleNumberClick('0')}
                            className="btn btn-circle btn-lg h-16 w-16 text-2xl font-light bg-base-100 border-base-200 shadow-sm hover:border-primary active:scale-90 transition-all"
                        >
                            0
                        </button>
                        <button onClick={handleBackspace} className="btn btn-ghost btn-circle text-xl text-base-content/70 active:scale-90">⌫</button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button onClick={onClose} className="btn btn-ghost rounded-xl">Cancelar</button>
                        <button 
                            onClick={() => handleSubmit()} 
                            disabled={!pin || verifying}
                            className="btn btn-primary rounded-xl shadow-lg"
                        >
                            {verifying ? <span className="loading loading-spinner"></span> : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};