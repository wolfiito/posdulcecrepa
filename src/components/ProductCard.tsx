import type { MenuItem, MenuGroup } from '../types/menu';

// --- Type Guards ---
function isGroup(item: MenuItem | MenuGroup): item is MenuGroup {
    return 'level' in item;
}

function isFixedPrice(item: MenuItem | MenuGroup): item is (MenuItem & { price: number }) {
    return !isGroup(item) && 'price' in item;
}

function isVariantPrice(item: MenuItem | MenuGroup): item is (MenuItem & { variants: any[] }) {
    return !isGroup(item) && 'variants' in item;
}

// --- Helper de Iconos ---
export function getIconForItem(item: MenuItem | MenuGroup): string {
    if (isGroup(item)) {
        if (item.id.includes('dulces')) return '🥞';
        if (item.id.includes('saladas')) return '🥓';
        if (item.id.includes('bebidas_frias')) return '🧊';
        if (item.id.includes('bebidas_calientes')) return '☕';
        if (item.id.includes('bebidas')) return '🥤';
        if (item.id.includes('postres')) return '🍰';
        return '📁'; // Icono por defecto para grupos
    }
    // Es un Item
    if (item.category.includes('Calientes')) return '☕';
    if (item.id.includes('bublee')) return '🧋';
    if (item.category.includes('Frias')) return '🧊';
    if (item.category.includes('Dulces')) return '🥞';
    if (item.category.includes('Saladas')) return '🥓';
    if (item.category.includes('Postres')) return '🍮';
    return '🍽️';
}

interface ProductCardProps {
  item: MenuItem | MenuGroup;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onClick }) => {
    const isGrp = isGroup(item);
    
    return (
        <div 
            onClick={onClick}
            className={`
                card bg-base-100 shadow-md hover:shadow-xl hover:scale-105 
                transition-all duration-200 cursor-pointer border border-base-200
                active:scale-95 h-full
                ${isGrp ? 'border-l-4 border-l-primary' : ''}
            `}
        >
            <div className="card-body p-4 items-center text-center">
                {/* Icono Grande */}
                <span className="text-5xl mb-2 filter drop-shadow-sm">
                    {getIconForItem(item)}
                </span>
                
                {/* Nombre del Producto */}
                <h3 className="card-title text-sm font-bold leading-tight text-base-content">
                    {item.name.split('(')[0].trim()}
                </h3>

                {/* Badge de Precio o Variante */}
                {!isGrp && (
                    <div className="mt-2">
                        {isFixedPrice(item) ? (
                            <div className="badge badge-accent badge-outline font-bold">
                                ${item.price.toFixed(2)}
                            </div>
                        ) : isVariantPrice(item) ? (
                            <div className="badge badge-secondary badge-outline text-xs">
                                Desde ${Math.min(...item.variants.map(v => v.price)).toFixed(0)}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}