import React from 'react';
import { useTicketStore } from '../../store/useTicketStore';
import { useUIStore } from '../../store/useUIStore';
import { TicketItemCard } from '../TicketItemCard';
import { IconTicket } from '../Icons';

export const TicketScreen: React.FC = () => {
    const { items, removeItem } = useTicketStore();
    const { setView } = useUIStore();

    return (
        <div className="bg-base-100 rounded-box shadow-xl p-6 max-w-md mx-auto border border-base-200">
            <div className="text-center mb-6">
                <div className="badge badge-primary badge-outline mb-2">Pedido en curso</div>
                <h2 className="text-2xl font-black text-base-content tracking-tight">Nueva Orden</h2>
            </div>
            
            <div className="flex flex-col gap-3 mb-6 min-h-[300px]">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                        <IconTicket />
                        <p className="mt-2">Ticket vacío</p>
                        <button onClick={() => setView('menu')} className="btn btn-link">
                            Ir al Menú
                        </button>
                    </div>
                ) : (
                    items.map(item => (
                        <TicketItemCard key={item.id} item={item} onRemove={removeItem} />
                    ))
                )}
            </div>
        </div>
    );
};