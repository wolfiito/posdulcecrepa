// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { toast } from 'sonner';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, isLoading: isAuthLoading } = useAuthStore();
  
  const [step, setStep] = useState<'USERNAME' | 'PASSWORD'>('USERNAME');
  const [inputValue, setInputValue] = useState('');
  const [targetUser, setTargetUser] = useState<{name: string, username: string} | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // --- 1. FUNCIÓN DE VIBRACIÓN HÁPTICA (ANDROID & IOS) ---
  const triggerHaptic = () => {
    // Intenta vibrar (Funciona en Android y navegadores modernos)
    if (navigator.vibrate) {
        navigator.vibrate(10); // Vibración muy corta y seca (tipo teclado)
    }
  };

  const handleNumber = async (num: string) => {
    // Feedback táctil inmediato
    triggerHaptic();

    if (isShaking || isAuthLoading || isChecking) return;
    if (inputValue.length >= 6) return; 

    const newValue = inputValue + num;
    setInputValue(newValue);

    if (newValue.length === 6) {
        if (step === 'USERNAME') {
            setIsChecking(true);
            try {
                const userFound = await authService.checkUserExists(newValue);
                if (userFound) {
                    // Vibración de éxito (dos toques)
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
    }
  };

  const triggerShake = (msg: string) => {
    setIsShaking(true);
    // Vibración de error (Larga y molesta)
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
    // 2. CORRECCIÓN DE ALTURA: Usamos min-h-dvh para evitar recortes en Safari Mobile
    <div className="min-h-dvh w-full bg-base-200 flex flex-col items-center justify-center p-4 animate-fade-in select-none overflow-hidden touch-none safe-pt safe-pb">  
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .shake-anim { animation: shake 0.4s ease-in-out; border-color: #ff5252 !important; color: #ff5252; }
      `}</style>

      <div className="card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200">
        <div className="card-body items-center text-center px-4 py-8">
          
          <div className="mb-6 min-h-[60px] flex flex-col justify-center items-center transition-all">
            <h1 className="text-3xl font-black text-primary font-serif italic mb-1">Dulce Crepa</h1>
            
            {step === 'USERNAME' ? (
                <p className="text-xs opacity-50 uppercase tracking-widest font-medium">Ingrese ID (6 Dígitos)</p>
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

          {/* VISUALIZADOR */}
          <div className={`w-full mb-8 transition-all duration-200 ${isShaking ? 'shake-anim' : ''}`}>
             <div className={`
                h-16 rounded-2xl flex items-center justify-center space-x-3 relative overflow-hidden
                bg-base-200 border-2 ${isShaking ? 'border-error bg-error/10' : 'border-transparent'}
             `}>
                {loading && (
                    <div className="absolute inset-0 bg-base-200/90 flex items-center justify-center z-10 backdrop-blur-sm">
                        <span className="loading loading-dots loading-md text-primary"></span>
                    </div>
                )}

                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-center w-4 transition-all">
                        {i < inputValue.length ? (
                            step === 'USERNAME' ? (
                                <span className="text-xl font-bold font-mono animate-pop">{inputValue[i]}</span>
                            ) : (
                                <div className="w-3 h-3 bg-primary rounded-full animate-pop shadow-sm shadow-primary/50"></div>
                            )
                        ) : (
                            <div className="w-2 h-2 bg-base-300 rounded-full"></div>
                        )}
                    </div>
                ))}
             </div>
          </div>

          {/* TECLADO */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handleNumber(num.toString())}
                disabled={loading}
                // 3. ESTILOS DE BOTÓN APP NATIVA (Tap Target grande y efecto active hundido)
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