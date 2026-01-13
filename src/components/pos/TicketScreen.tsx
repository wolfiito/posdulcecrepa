import React from 'react';
import { useTicketStore } from '../../store/useTicketStore';
import { useUIStore } from '../../store/useUIStore';
import { TicketItemCard } from '../TicketItemCard';
import { IconTicket } from '../Icons';

export const TicketScreen: React.FC = () => {
    // 1. 👇 Importamos 'customerName' y 'orderMode' del store
    const { items, removeItem, customerName, orderMode } = useTicketStore();
    const { setView } = useUIStore();

    // 2. 👇 Lógica para el título: Si hay nombre (Mesa 1), úsalo. Si no, "Nueva Orden".
    // El "Alejandro" desaparecerá porque aquí no llamamos a currentUser.
    const displayTitle = customerName || 'Nueva Orden';
    
    // Subtítulo dinámico (Ej: "Para Llevar" o "Comedor")
    const displaySubtitle = orderMode === 'Para Llevar' ? 'Pedido Para Llevar' : 'Consumo en Local';

    return (
        <div className="bg-base-100 rounded-box shadow-xl p-6 max-w-md mx-auto border border-base-200 h-full flex flex-col">
            <div className="text-center mb-6 shrink-0">
                <div className={`badge ${orderMode === 'Para Llevar' ? 'badge-secondary' : 'badge-primary'} badge-outline mb-2`}>
                    {displaySubtitle}
                </div>
                {/* 3. 👇 Aquí mostramos el nombre real (Mesa) */}
                <h2 className="text-2xl font-black text-base-content tracking-tight truncate px-4">
                    {displayTitle}
                </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                        <IconTicket />
                        <p className="mt-2 font-bold text-sm">Ticket vacío</p>
                        <p className="text-xs text-center px-6 mb-4">
                            Agrega productos del menú para comenzar
                        </p>
                        <button onClick={() => setView('menu')} className="btn btn-sm btn-primary">
                            Ir al Menú
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pb-4">
                        {items.map(item => (
                            <TicketItemCard key={item.id} item={item} onRemove={removeItem} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};