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
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onClick, isLarge = false }) => {
    const { activeBranchId } = useAuthStore();
    const isGrp = isGroup(item);

    // LÓGICA INTELIGENTE DE PRECIOS MULTI-SUCURSAL
    let displayPrice: number | null = null;
    let isFrom = false; // Para poner "Desde $X" si tiene tamaños

    if (!isGrp) {
        // 1. Si el producto tiene tamaños (variantes)
        if ('variants' in item && item.variants && item.variants.length > 0) {
            const firstVariant = item.variants[0];
            // @ts-ignore - En caso de que el tipo aún marque error en tu editor
            displayPrice = firstVariant.branchPrices?.[activeBranchId || ''] || firstVariant.price;
            isFrom = true; 
        } 
        else if ('price' in item) {
            // @ts-ignore
            displayPrice = item.branchPrices?.[activeBranchId || ''] || item.price;
        }
    }

    const getIconSize = () => {
        if (isLarge) return 'w-24 h-24';
        if (isGrp) return 'w-20 h-20';
        return 'w-20 h-20';
    };

    const handleClick = () => {
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
                cursor-pointer transition-all duration-200
                active:scale-95 border border-transparent
                overflow-hidden select-none
                ${isGrp ? 'bg-primary/5 hover:bg-primary/10 hover:border-primary/30' : 'bg-base-100 hover:border-base-300'}
            `}
        >
            <div className="card-body p-2 md:p-3 items-center justify-center text-center">
                {isGrp && (
                    <div className="absolute top-2 right-2 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                )}

                <div className={`
                    ${getIconSize()} 
                    flex items-center justify-center 
                    transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                    [&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full object-contain filter drop-shadow-sm
                    mb-1
                `}>
                    {getIconForItem(item)}
                </div>
                
                <div className="w-full flex flex-col items-center justify-start z-10">
                    <h3 className={`
                        font-bold leading-tight text-center w-full line-clamp-2
                        ${isGrp ? 'text-primary' : 'text-base-content'}
                        ${isLarge ? 'text-lg' : 'text-sm'}
                    `}>
                        {item.name.split('(')[0].trim()}
                    </h3>
                </div>

                {displayPrice !== null && (
                    <div className="mt-1 badge badge-sm font-bold bg-base-200 border-base-300 text-base-content">
                        {isFrom ? 'Desde ' : ''}${displayPrice.toFixed(2)}
                    </div>
                )}
            </div>
        </div>
    );
};