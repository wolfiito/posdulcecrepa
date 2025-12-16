import React from 'react';
import { useTicketStore } from '../../store/useTicketStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { IconCheck } from '../Icons';

interface BottomBarProps {
    onAction: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ onAction }) => {
    const { items, getTotal, orderMode } = useTicketStore();
    const { view, setView } = useUIStore();
    const { currentUser } = useAuthStore();
    
    const total = getTotal();

    // Si no hay items y no estamos viendo el ticket, ocultamos la barra
    if (items.length === 0 && view !== 'ticket') return null;

    const isMesero = currentUser?.role === 'MESERO';
    // Lógica visual: ¿El botón es verde (cobrar) o amarillo (enviar)?
    const canPay = orderMode === 'Para Llevar' && !isMesero;

    const getButtonColor = () => canPay ? 'btn-success text-white' : 'btn-warning text-black';
    const getButtonLabel = () => canPay ? 'Cobrar y Finalizar' : 'Enviar a Cocina';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100/95 backdrop-blur-xl border-t border-base-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-5xl mx-auto p-4 flex gap-4 items-center">
                <div className="flex-1 pl-2">
                    <div className="text-xs text-base-content/60 font-medium uppercase">
                        Total ({orderMode})
                    </div>
                    <div className="text-2xl font-black text-primary">
                        ${total.toFixed(2)}
                    </div>
                </div>
                
                {view === 'menu' ? (
                    <button 
                        onClick={() => setView('ticket')} 
                        className="btn btn-primary rounded-box shadow-lg px-8"
                    >
                        Ver Ticket ({items.length})
                    </button>
                ) : (
                    <button 
                        onClick={onAction} 
                        className={`btn ${getButtonColor()} rounded-box shadow-lg px-8`} 
                        disabled={items.length === 0}
                    >
                        {getButtonLabel()} <IconCheck />
                    </button>
                )}
            </div>
        </div>
    );
};