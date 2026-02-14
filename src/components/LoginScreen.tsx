// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { toast, Toaster } from 'sonner';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, isLoading: isAuthLoading } = useAuthStore();
  
  const [step, setStep] = useState<'USERNAME' | 'PASSWORD'>('USERNAME');
  const [inputValue, setInputValue] = useState('');
  const [targetUser, setTargetUser] = useState<{name: string, username: string} | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // --- CONFIGURACIÓN ---
  const PIN_LENGTH = 4; // Cambiado a 4 dígitos
  // --------------------

  // --- 1. FUNCIÓN DE VIBRACIÓN HÁPTICA ---
  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(10); 
  };

  const handleNumber = async (num: string) => {
    triggerHaptic();

    if (isShaking || isAuthLoading || isChecking) return;
    if (inputValue.length >= PIN_LENGTH) return; 

    const newValue = inputValue + num;
    setInputValue(newValue);

    // Auto-submit al llegar a la longitud deseada
    if (newValue.length === PIN_LENGTH) {
        // Pequeño delay visual para ver el último círculo llenarse
        setTimeout(async () => {
            if (step === 'USERNAME') {
                setIsChecking(true);
                try {
                    const userFound = await authService.checkUserExists(newValue);
                    if (userFound) {
                        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
                        setTargetUser(userFound);
                        setStep('PASSWORD');
                        setInputValue('');
                    } else {
                        triggerShake("Usuario no encontrado");
                    }
                } catch (error) {
                    console.error(error);
                    triggerShake("Error de conexión");
                } finally {
                    setIsChecking(false);
                }
            } 
            else if (step === 'PASSWORD' && targetUser) {
                loginWithCredentials(targetUser.username, newValue)
                    .catch(() => {
                        triggerShake("Contraseña incorrecta");
                    });
            }
        }, 100);
    }
  };

  const triggerShake = (msg: string) => {
    setIsShaking(true);
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    toast.error(msg, { duration: 2000 });
    
    setTimeout(() => {
        setInputValue('');
        setIsShaking(false);
    }, 500);
  };

  const handleClear = () => {
    triggerHaptic();
    setInputValue('');
  };
  
  const handleBackspace = () => {
    triggerHaptic();
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleCancelUser = () => {
      triggerHaptic();
      setStep('USERNAME');
      setInputValue('');
      setTargetUser(null);
  };

  const loading = isAuthLoading || isChecking;

  return (
    <div className="min-h-dvh w-full bg-base-200 flex flex-col items-center justify-center p-4 animate-fade-in select-none overflow-hidden touch-none safe-pt safe-pb">  
      <Toaster position="top-center" richColors />
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .shake-anim { animation: shake 0.4s ease-in-out; border-color: #ff5252 !important; color: #ff5252; }
      `}</style>

      <div className="card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200 overflow-hidden rounded-3xl">
        <div className="card-body items-center text-center px-4 py-8">
          
          <div className="mb-6 min-h-[60px] flex flex-col justify-center items-center transition-all">
            <h1 className="text-3xl font-black text-primary font-serif italic mb-1">Dulce Crepa</h1>
            
            {step === 'USERNAME' ? (
                <p className="text-xs opacity-50 uppercase tracking-widest font-medium">Ingrese ID de Usuario</p>
            ) : (
                <div className="flex flex-col items-center animate-fade-in-up">
                    <p className="text-sm font-bold text-base-content">
                        Hola, {targetUser?.name}
                    </p>
                    <button onClick={handleCancelUser} className="text-xs text-primary underline mt-1 hover:text-primary-focus active:opacity-50">
                        ¿No eres tú? Cambiar cuenta
                    </button>
                </div>
            )}
          </div>

          {/* VISUALIZADOR DE BOLITAS */}
          <div className={`w-full mb-8 flex justify-center transition-all duration-200 ${isShaking ? 'shake-anim' : ''}`}>
             <div className="flex gap-4 p-4 rounded-2xl bg-base-200/50">
                {loading ? (
                    <span className="loading loading-dots loading-md text-primary"></span>
                ) : (
                    [...Array(PIN_LENGTH)].map((_, i) => (
                        <div 
                            key={i}
                            className={`
                                w-4 h-4 rounded-full border-2 border-base-content/20 transition-all duration-200
                                ${i < inputValue.length ? 'bg-primary border-primary scale-125 shadow-sm' : 'bg-transparent'}
                            `}
                        />
                    ))
                )}
             </div>
          </div>

          {/* TECLADO NUMÉRICO */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handleNumber(num.toString())}
                disabled={loading}
                className="btn btn-circle btn-lg h-16 w-16 sm:h-20 sm:w-20 text-3xl font-light bg-base-100 border-base-300 shadow-sm 
                           hover:bg-base-200 hover:border-primary 
                           active:scale-90 active:bg-base-300 transition-all duration-100 
                           disabled:opacity-20 disabled:scale-100 touch-manipulation"
              >
                {num}
              </button>
            ))}
            
            <div className="flex items-center justify-center">
                {inputValue.length > 0 && !loading && (
                      <button onClick={handleClear} className="btn btn-ghost btn-sm text-xs font-bold text-base-content/50 active:scale-90">C</button>
                )}
            </div>
            
            <button 
                onClick={() => handleNumber('0')}
                disabled={loading} 
                className="btn btn-circle btn-lg h-16 w-16 sm:h-20 sm:w-20 text-3xl font-light bg-base-100 border-base-300 shadow-sm 
                           hover:bg-base-200 hover:border-primary 
                           active:scale-90 active:bg-base-300 transition-all duration-100 
                           disabled:opacity-20 disabled:scale-100 touch-manipulation"
            >
                0
            </button>
            
            <div className="flex items-center justify-center">
                {!loading && (
                    <button onClick={handleBackspace} className="btn btn-ghost btn-circle text-xl text-base-content/70 active:scale-75 transition-transform">⌫</button>
                )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
             <div className="w-1 h-1 rounded-full bg-current"></div>
             <div className="text-[10px] uppercase tracking-[0.2em] font-bold">
                 Seguro
             </div>
             <div className="w-1 h-1 rounded-full bg-current"></div>
          </div>
        </div>
      </div>
    </div>
  );
};