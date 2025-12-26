import React from 'react'
import type { MenuItem, MenuGroup } from '../types/menu';
import { getIconForItem } from './ProductIcons';

function isGroup(item: MenuItem | MenuGroup): item is MenuGroup {
    return 'level' in item;
}

interface ProductCardProps {
  item: MenuItem | MenuGroup;
  onClick: () => void;
  isLarge?: boolean; 
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onClick, isLarge = false }) => {
    const isGrp = isGroup(item);

    //Si es producto y tiene precio, lo mostramos.
    const price = !isGrp && 'price' in item ? item.price : null;


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
            
            /* ESTILOS CONDICIONALES */
                ${isGrp 
                    ? 'bg-primary/5 border-primary/10 hover:border-primary/30' 
                    : 'bg-base-100 border-base-200 hover:border-primary'       
                }
            `}  
        >
            <div className="card-body p-2 w-full h-full flex flex-col items-center justify-center relative">
                
                {/* 1. INDICADOR DE TIPO (Icono esquina) */}
                {isGrp && (
                    <div className="absolute top-2 right-2 opacity-20 text-primary">
                        {/* Icono de carpeta sutil */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                    </div>
                )}

                {/* 2. ICONO PRINCIPAL */}
                <div className={`
                    ${getIconSize()} 
                    flex items-center justify-center 
                    transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                    [&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full object-contain filter drop-shadow-sm
                    mb-1
                `}>
                    {getIconForItem(item)}
                </div>
                
                {/* 3. NOMBRE */}
                <div className="w-full flex flex-col items-center justify-start z-10">
                    <h3 className={`
                        font-bold leading-tight text-center w-full line-clamp-2
                        ${isGrp ? 'text-primary' : 'text-base-content'}
                        ${isLarge ? 'text-lg' : 'text-sm'}
                    `}>
                        {item.name.split('(')[0].trim()}
                    </h3>
                </div>

                {/* 4. PRECIO FLOTANTE (Solo Productos) */}
                {price !== null && (
                    <div className="mt-1 badge badge-sm font-bold bg-base-200 border-base-300 text-base-content/80">
                        ${price}
                    </div>
                )}
            </div>
        </div>
    );
}