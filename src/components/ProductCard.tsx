import React from 'react'
import type { MenuItem, MenuGroup } from '../types/menu';
import { getIconForItem } from './ProductIcons';
import { useAuthStore } from '../store/useAuthStore'; 

function isGroup(item: MenuItem | MenuGroup): item is MenuGroup {
    return 'level' in item;
}

interface ProductCardProps {
  item: MenuItem | MenuGroup;
  onClick: () => void;
  isLarge?: boolean; 
  isOutOfStock?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onClick, isLarge = false, isOutOfStock = false }) => {
    const { activeBranchId } = useAuthStore();
    const isGrp = isGroup(item);

    // LÓGICA INTELIGENTE DE PRECIOS MULTI-SUCURSAL
    let displayPrice: number | null = null;
    let isFrom = false; // Para poner "Desde $X" si tiene tamaños

    if (!isGrp) {
        // Price logic removed as per user request
    }

    const handleClick = () => {
        if (isOutOfStock) return;
        if (navigator.vibrate) navigator.vibrate(10); 
        onClick();
    };
    
    return (
        <div 
            onClick={handleClick}
            className={`
                relative group
                card h-full aspect-square
                shadow-sm hover:shadow-md
                transition-all duration-300
                border border-transparent
                overflow-hidden select-none
                ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                ${isGrp ? 'bg-primary/10 hover:bg-primary/20 hover:border-primary/30' : 'bg-base-100 hover:border-base-200'}
            `}
        >
            {isOutOfStock && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-error text-white font-black px-4 py-1 rounded-sm shadow-xl rotate-12 z-20 text-[clamp(0.75rem,3vw,1rem)] uppercase tracking-widest border border-white/20 whitespace-nowrap overflow-visible">
                    AGOTADO
                </div>
            )}
            
            <div className="flex flex-col h-full w-full">
                {/* 1. Icono: Ocupa casi todo el espacio (flex-1) */}
                <div className="flex-1 w-full flex items-center justify-center p-2 md:p-3 relative overflow-hidden">
                    {isGrp && (
                        <div className="absolute top-2 right-2 opacity-30 z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                    )}
                    
                    <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2 filter drop-shadow-md">
                        {getIconForItem(item)}
                    </div>
                </div>

                {/* 2. Nombre: En la parte inferior */}
                <div className={`
                    w-full py-2 px-1 shrink-0
                    flex items-center justify-center
                    ${isGrp ? 'bg-primary/20' : 'bg-base-200/50'}
                `}>
                    <h3 className={`
                        font-bold leading-tight text-center w-full line-clamp-2
                        ${isGrp ? 'text-primary' : 'text-base-content'}
                        ${isLarge ? 'text-sm md:text-base' : 'text-xs md:text-sm'}
                    `}>
                        {item.name.split('(')[0].trim()}
                    </h3>
                </div>
            </div>
        </div>
    );
};