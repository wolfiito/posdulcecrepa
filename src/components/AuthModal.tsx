// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminName: string) => void;
  title?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, title = "Autorización Requerida" }) => {
  const [step, setStep] = useState<'USERNAME' | 'PASSWORD'>('USERNAME');
  const [inputValue, setInputValue] = useState('');
  const [targetUser, setTargetUser] = useState<{name: string, username: string, role: string} | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const handleNumber = async (num: string) => {
    if (isShaking || isChecking) return;
    if (inputValue.length >= 6) return; 

    const newValue = inputValue + num;
    setInputValue(newValue);

    if (newValue.length === 6) {
        if (step === 'USERNAME') {
            setIsChecking(true);
            try {
                // Usamos el servicio existente para validar
                const userFound = await authService.checkUserExists(newValue);
                
                if (userFound) {
                    // Validar si tiene permisos (Admin/Gerente)
                    // Nota: checkUserExists debería devolver el rol, si no, hay que ajustar el servicio
                    // Si tu servicio checkUserExists no devuelve role, úsalo aquí abajo en el login completo
                    setTargetUser(userFound as any); 
                    setStep('PASSWORD');
                    setInputValue('');
                } else {
                    triggerShake("Usuario no encontrado");
                }
            } catch (error) {
                triggerShake("Error al verificar");
            } finally {
                setIsChecking(false);
            }
        } 
        else if (step === 'PASSWORD' && targetUser) {
            setIsChecking(true);
            try {
                const fullUser = await authService.loginWithCredentials(targetUser.username, newValue);
                
                // VALIDACIÓN DE ROL: Solo Jefes
                if (fullUser.role === 'ADMIN' || fullUser.role === 'GERENTE') {
                    toast.success(`Autorizado por: ${fullUser.name}`);
                    onSuccess(fullUser.name);
                    onClose();
                } else {
                    triggerShake("⛔ No tienes permisos de Gerente");
                    setStep('USERNAME');
                    setInputValue('');
                    setTargetUser(null);
                }
            } catch (error) {
                triggerShake("Contraseña incorrecta");
            } finally {
                setIsChecking(false);
            }
        }
    }
  };

  const triggerShake = (msg: string) => {
    setIsShaking(true);
    if (navigator.vibrate) navigator.vibrate(200);
    toast.error(msg);
    setTimeout(() => { setInputValue(''); setIsShaking(false); }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-base-100 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header Rojo/Oscuro para diferenciarlo del Login normal */}
        <div className="bg-neutral text-neutral-content p-4 text-center">
            <h3 className="text-lg font-bold flex items-center justify-center gap-2">
                🛡️ {title}
            </h3>
            <p className="text-xs opacity-70">
                {step === 'USERNAME' ? 'Ingrese Credenciales de Gerente' : `Hola, ${targetUser?.name}`}
            </p>
        </div>

        <div className="p-6 text-center">
             {/* Display Visual */}
             <div className={`mb-6 p-4 bg-base-200 rounded-xl flex justify-center space-x-3 h-16 items-center ${isShaking ? 'border-2 border-error' : ''}`}>
                {isChecking ? (
                    <span className="loading loading-dots loading-lg text-primary"></span>
                ) : (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-4 flex justify-center">
                            {i < inputValue.length ? (
                                step === 'USERNAME' ? <span className="text-xl font-bold font-mono">{inputValue[i]}</span> : <div className="w-3 h-3 bg-neutral rounded-full" />
                            ) : <div className="w-2 h-2 bg-base-300 rounded-full" />}
                        </div>
                    ))
                )}
             </div>

             {/* Teclado */}
             <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7,8,9,0].map(n => (
                    <button 
                        key={n} 
                        onClick={() => handleNumber(n.toString())} 
                        className={`btn btn-lg btn-outline h-14 text-2xl font-light ${n===0 ? 'col-start-2' : ''}`}
                    >
                        {n}
                    </button>
                ))}
                {inputValue.length > 0 && <button onClick={() => setInputValue('')} className="col-start-3 row-start-4 btn btn-ghost text-error">C</button>}
             </div>
             
             <button onClick={onClose} className="btn btn-ghost btn-block mt-6">Cancelar</button>
        </div>
      </div>
    </div>
  );
};