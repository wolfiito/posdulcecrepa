
import type { MenuItem, MenuGroup } from '../types/menu';

// --- Type Guards ---
function isGroup(item: MenuItem | MenuGroup): item is MenuGroup {
    return 'level' in item;
}

function isFixedPrice(item: MenuItem | MenuGroup): item is (MenuItem & { price: number }) {
    return !isGroup(item) && 'price' in item;
}

// --- Iconos (Función externa para ser usada en otros componentes) ---
export function getIconForItem(item: MenuItem | MenuGroup): string {
    if (isGroup(item)) {
        if (item.rules_ref) return '✨';
        if (item.id.includes('dulces')) return '🥞';
        if (item.id.includes('saladas')) return '🥓';
        if (item.id.includes('bebidas_frias')) return '🧊';
        if (item.id.includes('bebidas_calientes')) return '☕';
        if (item.id.includes('bebidas')) return '🥤';
        if (item.id.includes('postres')) return '🍰';
        return '➡️';
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

// --- Precio ---
function getDisplayPrice(item: MenuItem): string {
    if (isFixedPrice(item)) {
      return `$${item.price.toFixed(2)}`;
    }
    return '';
}

interface ProductCardProps {
  item: MenuItem | MenuGroup;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onClick }) => {
    
    let className = 'card-base';
    if (isGroup(item)) {
        className += item.rules_ref ? ' card-rule' : ' card-group';
    } else {
        className += ' card-item';
    }

    const description = 'description' in item ? item.description : null;

    return (
        <div className={className} onClick={onClick}>
            <div className="card-main-content">
                <span className="card-icon">{getIconForItem(item)}</span>
                <p className="card-title">{item.name.split('(')[0].trim()}</p>
                 {description && <small className="card-description">{description}</small>}
            </div>
        </div>
    );
}
