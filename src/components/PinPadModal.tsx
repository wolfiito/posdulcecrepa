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
    isOpen, onClose, onSuccess, title = "Autorización Requerida", requireAdmin = false 
}) => {
    const [step, setStep] = useState<'USERNAME' | 'PASSWORD'>('USERNAME');
    const [inputValue, setInputValue] = useState('');
    const [tempUser, setTempUser] = useState<{username: string, name: string, role: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const PIN_LENGTH = 4;
    const { currentUser } = useAuthStore();

    useEffect(() => {
        if (isOpen) {
            setStep('USERNAME');
            setInputValue('');
            setTempUser(null);
            setIsLoading(false);
            setIsShaking(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && !requireAdmin && currentUser) {
            setTempUser(currentUser);
            setStep('PASSWORD');
        }
    }, [isOpen, requireAdmin, currentUser]);

    const triggerHaptic = () => { if (navigator.vibrate) navigator.vibrate(10); };
    
    const triggerShake = (msg: string) => {
        setIsShaking(true);
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        toast.error(msg);
        setTimeout(() => {
            setIsShaking(false);
            setInputValue('');
        }, 500);
    };

    const handleNumberClick = async (num: string) => {
        triggerHaptic();
        if (inputValue.length >= PIN_LENGTH || isLoading) return;

        const newValue = inputValue + num;
        setInputValue(newValue);

        if (newValue.length === PIN_LENGTH) {
            setTimeout(async () => {
                if (step === 'USERNAME') {
                    await verifyUsername(newValue);
                } else {
                    await verifyPassword(newValue);
                }
            }, 100);
        }
    };

    const verifyUsername = async (username: string) => {
        setIsLoading(true);
        try {
            const userFound = await authService.checkUserExists(username);
            if (!userFound) {
                triggerShake("Usuario no encontrado");
                setIsLoading(false);
                return;
            }
            if (requireAdmin && userFound.role !== 'ADMIN' && userFound.role !== 'GERENTE') {
                triggerShake("Este usuario no tiene permisos");
                setIsLoading(false);
                return;
            }
            setTempUser(userFound);
            setStep('PASSWORD');
            setInputValue('');
            setIsLoading(false);
        } catch (error) {
            triggerShake("Error al buscar usuario");
            setIsLoading(false);
        }
    };

    const verifyPassword = async (password: string) => {
        if (!tempUser) return;
        setIsLoading(true);
        try {
            await authService.loginWithCredentials(tempUser.username, password);
            if (navigator.vibrate) navigator.vibrate([10, 50]);
            toast.success(`Autorizado por: ${tempUser.name}`);
            onSuccess(tempUser.name);
            onClose();
        } catch (error) {
            triggerShake("Contraseña incorrecta");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => { triggerHaptic(); setInputValue(''); };
    const handleBackspace = () => { triggerHaptic(); setInputValue(prev => prev.slice(0, -1)); };
    
    const handleBackStep = () => {
        if (step === 'PASSWORD' && requireAdmin) {
            setStep('USERNAME');
            setInputValue('');
            setTempUser(null);
        } else {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="w-full max-w-sm outline-none m-4 animate-pop-in"
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center"
        >
            <style>{`
                @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
                .shake-anim { animation: shake 0.4s ease-in-out; border-color: #ff5252 !important; }
            `}</style>

            <div className="card w-full bg-base-100 shadow-2xl border border-base-200 overflow-hidden rounded-3xl">
                
                {/* Header Dinámico */}
                <div className="bg-base-100 p-6 pb-2 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${requireAdmin ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    </div>
                    
                    <h3 className="text-xl font-black text-base-content">
                        {step === 'USERNAME' ? title : `Hola, ${tempUser?.name}`}
                    </h3>
                    
                    <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-60">
                        {step === 'USERNAME' ? 'Ingrese ID de Usuario' : 'Ingrese su PIN'}
                    </p>
                </div>

                {/* Input Visual (Bolitas) */}
                <div className={`flex justify-center gap-4 my-8 transition-all ${isShaking ? 'shake-anim' : ''}`}>
                     {isLoading ? (
                        <span className="loading loading-dots loading-lg text-primary"></span>
                     ) : (
                        [...Array(PIN_LENGTH)].map((_, i) => (
                            <div 
                                key={i}
                                className={`
                                    w-5 h-5 rounded-full border-2 border-base-content/20 transition-all duration-200
                                    ${i < inputValue.length ? 'bg-primary border-primary scale-110 shadow-sm' : 'bg-transparent'}
                                `}
                            />
                        ))
                     )}
                </div>

                {/* Teclado */}
                <div className="p-6 pt-0">
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                                key={num} 
                                onClick={() => handleNumberClick(num.toString())}
                                disabled={isLoading}
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

                    <div className="mt-6">
                        <button onClick={handleBackStep} className="btn btn-ghost btn-block rounded-xl">
                            {step === 'PASSWORD' && requireAdmin ? 'Cambiar Usuario' : 'Cancelar'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};