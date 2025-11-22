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

    const handleClick = () => {
        if (navigator.vibrate) {
            navigator.vibrate(50); // Feedback táctil
        }
        onClick();
    };
    
    return (
        <div 
            onClick={handleClick}
            className={`
                card h-full bg-base-100 aspect-square relative
                rounded-box 
                border border-base-200 shadow-sm
                cursor-pointer transition-all duration-200
                hover:shadow-md hover:scale-[1.02]
                active:scale-95
                ${isGrp ? 'border-l-[6px] border-l-primary' : ''}
                flex flex-col justify-center items-center
            `}
        >
            <div className="card-body p-2 w-full h-full flex flex-col items-center justify-between">
                
                {/* Icono */}
                <div className={`${isLarge ? 'w-20 h-20 md:w-28 md:h-28' : 'w-14 h-14'} mt-1 flex items-center justify-center drop-shadow-sm transition-all duration-300`}>
                    {getIconForItem(item)}
                </div>
                
                {/* Título */}
                <div className="w-full flex flex-col items-center justify-center flex-1">
                    <h3 className={`font-bold leading-tight text-base-content text-center w-full px-1 ${isLarge ? 'text-base md:text-lg' : 'text-sm line-clamp-2'}`}>
                        {item.name.split('(')[0].trim()}
                    </h3>
                </div>
            </div>
        </div>
    );
}