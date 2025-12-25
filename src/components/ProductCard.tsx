// src/components/ProductCard.tsx
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

    // --- LÓGICA DE TAMAÑOS (3 CAPAS) ---
    const getIconSize = () => {
        // CAPA 1: Menú Principal (Gigante)
        if (isLarge) return 'w-28 h-28 md:w-36 md:h-36';
        
        // CAPA 2: Sub-Categorías (Muy Grande)
        if (isGrp) return 'w-24 h-24 md:w-28 md:h-28';
        
        // CAPA 3: Productos Finales (Grande)
        // Antes era w-24, vamos a probar w-28 también si quieres que se vean casi igual
        return 'w-24 h-24 md:w-28 md:h-28';
    };

    const handleClick = () => {
        if (navigator.vibrate) navigator.vibrate(10); 
        onClick();
    };
    
    return (
        <div 
            onClick={handleClick}
            className={`
                card h-full bg-base-100 aspect-square relative
                rounded-2xl
                border border-base-200 shadow-sm
                cursor-pointer transition-all duration-200
                hover:shadow-md hover:scale-[1.02]
                active:scale-95
                ${isGrp ? 'border-l-[6px] border-l-primary' : ''}
                flex flex-col justify-center items-center overflow-hidden
            `}
        >
            <div className="card-body p-1 w-full h-full flex flex-col items-center justify-center">
                
                {/* --- AQUÍ ESTÁ EL TRUCO --- 
                    Agregamos [&>svg]:w-full [&>svg]:h-full
                    Esto obliga a cualquier SVG hijo a ocupar todo el espacio disponible.
                */}
                <div className={`
                    ${getIconSize()} 
                    flex items-center justify-center drop-shadow-sm transition-all duration-300
                    mt-2
                    [&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full object-contain
                `}>
                    {getIconForItem(item)}
                </div>
                
                <div className="w-full flex flex-col items-center justify-start flex-1 mt-1">
                    <h3 className={`
                        font-bold leading-tight text-base-content text-center w-full px-1 
                        ${isLarge ? 'text-xl' : isGrp ? 'text-lg' : 'text-base'}
                    `}>
                        {item.name.split('(')[0].trim()}
                    </h3>
                </div>
            </div>
        </div>
    );
}