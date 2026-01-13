// src/components/OrderModeModal.tsx
import React, { useState } from 'react';
import type { OrderMode } from '../types/order';
import { toast } from 'sonner';

interface OrderModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mode: OrderMode, name: string) => void;
}

export const OrderModeModal: React.FC<OrderModeModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [selectedMode, setSelectedMode] = useState<OrderMode | null>(null);
    const [clientName, setClientName] = useState('');

    const modes = [
        { id: 'Mesa 1', label: 'Mesa 1', icon: '🍽️' },
        { id: 'Mesa 2', label: 'Mesa 2', icon: '🍽️' },
        { id: 'Para Llevar', label: 'Para Llevar', icon: '🛍️' },
    ] as const;

    const handleConfirm = () => {
        if (!selectedMode) {
            toast.error("Selecciona una opción");
            return;
        }
        if (selectedMode === 'Para Llevar' && !clientName.trim()) {
            toast.error("Escribe el nombre del cliente");
            document.getElementById('mode-client-name')?.focus();
            return;
        }

        // Si es mesa, el nombre es la mesa misma. Si es llevar, es lo que escribió.
        const finalName = selectedMode === 'Para Llevar' ? clientName : selectedMode;
        
        onConfirm(selectedMode, finalName);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-base-100 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                
                <div className="p-6 text-center border-b border-base-200 bg-base-100">
                    <h3 className="text-xl font-black text-base-content">Finalizar Orden</h3>
                    <p className="text-sm text-base-content/60 mt-1">¿De qué tipo es este pedido?</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Grid de Opciones */}
                    <div className="grid grid-cols-2 gap-3">
                        {modes.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setSelectedMode(m.id as OrderMode);
                                    if (m.id !== 'Para Llevar') setClientName('');
                                }}
                                className={`
                                    ${m.id === 'Para Llevar' ? 'col-span-2' : ''}
                                    flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2
                                    ${selectedMode === m.id 
                                        ? 'border-primary bg-primary/10 text-primary shadow-md scale-[1.02]' 
                                        : 'border-base-200 bg-base-100 text-base-content/60 hover:bg-base-200'
                                    }
                                `}
                            >
                                <span className="text-3xl">{m.icon}</span>
                                <span className="font-bold">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Input Condicional */}
                    {selectedMode === 'Para Llevar' && (
                        <div className="animate-pop-in pt-2">
                            <label className="text-xs font-bold text-base-content/50 ml-1">Nombre del Cliente</label>
                            <input 
                                id="mode-client-name"
                                type="text"
                                autoFocus
                                className="input input-lg w-full bg-base-200 focus:bg-base-100 font-bold text-lg rounded-2xl mt-1 border-transparent focus:border-primary"
                                placeholder="Ej: Juan Pérez"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-base-100 border-t border-base-200 flex gap-3">
                    <button onClick={onClose} className="btn btn-lg btn-ghost flex-1 rounded-2xl">
                        Atrás
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!selectedMode}
                        className="btn btn-lg btn-primary flex-1 rounded-2xl shadow-lg"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};