// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService'; // Importamos directo para el check
import { toast } from 'sonner';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, isLoading: isAuthLoading } = useAuthStore();
  
  // Estado local
  const [step, setStep] = useState<'USERNAME' | 'PASSWORD'>('USERNAME');
  const [inputValue, setInputValue] = useState('');
  const [targetUser, setTargetUser] = useState<{name: string, username: string} | null>(null);
  
  // Estado visual
  const [isChecking, setIsChecking] = useState(false); // Spinner local para el check de usuario
  const [isShaking, setIsShaking] = useState(false);

  const handleNumber = async (num: string) => {
    // Bloqueos de seguridad y UI
    if (isShaking || isAuthLoading || isChecking) return;
    if (inputValue.length >= 6) return; 

    const newValue = inputValue + num;
    setInputValue(newValue);

    // --- DETECCIÓN AUTOMÁTICA AL LLEGAR A 6 DÍGITOS ---
    if (newValue.length === 6) {
        
        if (step === 'USERNAME') {
            // PASO 1: Preguntar al servidor "¿Quién es?"
            setIsChecking(true);
            try {
                const userFound = await authService.checkUserExists(newValue);
                
                if (userFound) {
                    // ÉXITO: Usuario existe -> Pasamos a Password
                    setTargetUser(userFound);
                    setStep('PASSWORD');
                    setInputValue('');
                } else {
                    // ERROR: Usuario no existe
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
            // PASO 2: Intentar Login Real
            // Aquí delegamos al store que maneja su propio loading
            loginWithCredentials(targetUser.username, newValue)
                .catch(() => {
                    triggerShake("Contraseña incorrecta");
                });
        }
    }
  };

  const triggerShake = (msg: string) => {
    setIsShaking(true);
    if (navigator.vibrate) navigator.vibrate(200);
    toast.error(msg, { duration: 2000 });
    
    setTimeout(() => {
        setInputValue('');
        setIsShaking(false);
    }, 500);
  };

  const handleClear = () => setInputValue('');
  const handleBackspace = () => setInputValue(prev => prev.slice(0, -1));

  const handleCancelUser = () => {
      setStep('USERNAME');
      setInputValue('');
      setTargetUser(null);
  };

  // Unificamos el estado de carga
  const loading = isAuthLoading || isChecking;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 animate-fade-in select-none">
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .shake-anim { animation: shake 0.4s ease-in-out; border-color: #ff5252 !important; color: #ff5252; }
      `}</style>

      <div className="card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200">
        <div className="card-body items-center text-center">
          
          <div className="mb-6 min-h-[60px] flex flex-col justify-center items-center transition-all">
            <h1 className="text-3xl font-black text-primary font-serif italic mb-1">Dulce Crepa</h1>
            
            {step === 'USERNAME' ? (
                <p className="text-xs opacity-50 uppercase tracking-widest">Ingrese ID (6 Dígitos)</p>
            ) : (
                <div className="flex flex-col items-center animate-fade-in-up">
                    <p className="text-sm font-bold text-base-content">
                        Hola, {targetUser?.name}
                    </p>
                    <button onClick={handleCancelUser} className="text-xs text-primary underline mt-1 hover:text-primary-focus">
                        ¿No eres tú? Cambiar cuenta
                    </button>
                </div>
            )}
          </div>

          {/* VISUALIZADOR DE INPUT */}
          <div className={`w-full mb-8 transition-all duration-200 ${isShaking ? 'shake-anim' : ''}`}>
             <div className={`
                h-16 rounded-2xl flex items-center justify-center space-x-3 relative overflow-hidden
                bg-base-200 border-2 ${isShaking ? 'border-error bg-error/10' : 'border-transparent'}
             `}>
                {/* Loader Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-base-200/80 flex items-center justify-center z-10 backdrop-blur-sm">
                        <span className="loading loading-dots loading-md text-primary"></span>
                    </div>
                )}

                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-center w-4">
                        {i < inputValue.length ? (
                            step === 'USERNAME' ? (
                                <span className="text-xl font-bold font-mono">{inputValue[i]}</span>
                            ) : (
                                <div className="w-3 h-3 bg-primary rounded-full animate-pop"></div>
                            )
                        ) : (
                            <div className="w-2 h-2 bg-base-300 rounded-full"></div>
                        )}
                    </div>
                ))}
             </div>
          </div>

          {/* TECLADO */}
          <div className="grid grid-cols-3 gap-4 w-full px-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handleNumber(num.toString())}
                disabled={loading}
                className="btn btn-circle btn-lg h-20 w-20 text-3xl font-light bg-base-100 border-base-300 hover:bg-base-200 hover:border-primary transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:bg-base-200"
              >
                {num}
              </button>
            ))}
            
            <div className="flex items-center justify-center">
                {inputValue.length > 0 && !loading && (
                     <button onClick={handleClear} className="btn btn-ghost btn-sm text-xs font-bold text-base-content/50">C</button>
                )}
            </div>
            
            <button 
                onClick={() => handleNumber('0')}
                disabled={loading} 
                className="btn btn-circle btn-lg h-20 w-20 text-3xl font-light bg-base-100 border-base-300 hover:bg-base-200 hover:border-primary transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:bg-base-200"
            >
                0
            </button>
            
            <div className="flex items-center justify-center">
                {!loading && (
                    <button onClick={handleBackspace} className="btn btn-ghost btn-circle text-xl text-base-content/70">⌫</button>
                )}
            </div>
          </div>

          <div className="mt-8 text-[10px] text-base-content/20 uppercase tracking-[0.2em]">
             Conexión Segura SSL
          </div>
        </div>
      </div>
    </div>
  );
};