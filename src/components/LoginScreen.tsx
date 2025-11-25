// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const LoginScreen: React.FC = () => {
  const { loginWithPin, isLoading, error } = useAuthStore();
  const [pin, setPin] = useState('');

  const handleNumber = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleClear = () => setPin('');
  const handleBackspace = () => setPin(prev => prev.slice(0, -1));

  const handleSubmit = () => {
    if (pin.length > 0) loginWithPin(pin);
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200">
        <div className="card-body items-center text-center">
          
          {/* Logo / Título */}
          <div className="mb-4">
            <h1 className="text-3xl font-black text-primary font-serif italic">Dulce Crepa</h1>
            <p className="text-xs opacity-50 uppercase tracking-widest mt-1">Acceso al Sistema</p>
          </div>

          {/* Display del PIN (Oculto) */}
          <div className="my-6 w-full flex justify-center gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length ? 'bg-primary scale-110' : 'bg-base-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="alert alert-error py-1 text-xs mb-4">
              <span>{error}</span>
            </div>
          )}

          {/* Teclado Numérico */}
          <div className="grid grid-cols-3 gap-3 w-full mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handleNumber(num.toString())}
                className="btn btn-lg btn-outline border-base-300 font-mono text-2xl hover:bg-base-200 hover:border-base-300 hover:text-base-content active:bg-primary active:text-primary-content"
              >
                {num}
              </button>
            ))}
            <button onClick={handleClear} className="btn btn-lg btn-ghost text-error font-bold text-xs">BORRAR</button>
            <button onClick={() => handleNumber('0')} className="btn btn-lg btn-outline border-base-300 font-mono text-2xl">0</button>
            <button onClick={handleBackspace} className="btn btn-lg btn-ghost text-warning">⌫</button>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={isLoading || pin.length === 0}
            className="btn btn-primary btn-block shadow-lg"
          >
            {isLoading ? <span className="loading loading-spinner"></span> : 'ENTRAR'}
          </button>

        </div>
      </div>
      <p className="mt-8 text-xs opacity-30 text-center">
        Ingresa tu PIN de empleado de 4 dígitos
      </p>
    </div>
  );
};