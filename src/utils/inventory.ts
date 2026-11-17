// src/utils/inventory.ts
import type { MenuGroup, MenuItem, Modifier, TicketItem } from '../types/menu';
import type { RecipeLine, SupplyStock, SupplyUnit } from '../types/inventory';

export const UNIT_LABELS: Record<SupplyUnit, string> = { kg: 'Kilogramos', L: 'Litros', pza: 'Piezas' };

// Unidad en la que se captura la receta (porción) y factor contra la unidad de compra
export const BASE_UNIT: Record<SupplyUnit, string> = { kg: 'g', L: 'ml', pza: 'pza' };
const FACTOR: Record<SupplyUnit, number> = { kg: 1000, L: 1000, pza: 1 };

/** Cantidad capturada en kg / L / pza → unidad base (g / ml / pza). */
export const toBase = (value: number, unit: SupplyUnit) => Math.round(value * FACTOR[unit]);

/** Unidad base → kg / L / pza. */
export const fromBase = (value: number, unit: SupplyUnit) => value / FACTOR[unit];

/** Ej. 2350 g → "2.35 kg"; 12 pza → "12 pza". */
export const formatQty = (base: number, unit: SupplyUnit) => {
    const value = fromBase(base, unit);
    return `${Number(value.toFixed(3)).toLocaleString('es-MX', { maximumFractionDigits: 3 })} ${unit}`;
};

type Usage = Record<string, number>;

const addRecipe = (usage: Usage, recipe: RecipeLine[] | undefined) => {
    (recipe || []).forEach(line => {
        if (!line.supplyId || !line.qty) return;
        usage[line.supplyId] = (usage[line.supplyId] || 0) + line.qty;
    });
};

interface MenuCatalog {
    groups: MenuGroup[];
    items: MenuItem[];
    modifiers: Modifier[];
}

/**
 * Insumos que gasta UNA unidad del artículo del ticket (unidad base).
 * Usa las recetas vigentes del menú; el resultado se guarda en la orden para que
 * una cancelación regrese exactamente lo que se descontó.
 */
export const getItemSupplyUsage = (item: TicketItem, menu: MenuCatalog): Usage => {
    const usage: Usage = {};
    const baseId = item.details?.itemId || item.productId;

    if (item.type === 'CUSTOM') {
        addRecipe(usage, menu.groups.find(g => g.id === baseId)?.recipe);
    } else {
        const menuItem = menu.items.find(i => i.id === baseId);
        if (menuItem && 'variants' in menuItem) {
            addRecipe(usage, menuItem.variants.find(v => v.name === item.details?.variantName)?.recipe);
        } else if (menuItem) {
            addRecipe(usage, menuItem.recipe);
        }
    }

    (item.details?.selectedModifiers || []).forEach(mod => {
        addRecipe(usage, menu.modifiers.find(m => m.id === mod.id)?.recipe ?? mod.recipe);
    });
    return usage;
};

/** Suma el consumo de varios artículos, multiplicado por su cantidad. */
export const sumSupplyUsage = (items: TicketItem[], qtyOf: (item: TicketItem) => number = i => i.quantity || 1): Usage => {
    const total: Usage = {};
    items.forEach(item => {
        Object.entries(item.supplyUsage || {}).forEach(([supplyId, qty]) => {
            total[supplyId] = (total[supplyId] || 0) + qty * qtyOf(item);
        });
    });
    return total;
};

/** true si la receta usa un insumo marcado como agotado en la sucursal. */
export const isRecipeBlocked = (recipe: RecipeLine[] | undefined, stockData: Record<string, SupplyStock>) =>
    (recipe || []).some(line => stockData[line.supplyId]?.outOfStock === true);

export type StockStatus = 'out' | 'negative' | 'low' | 'ok';

export const getStockStatus = (stock: SupplyStock | undefined): StockStatus => {
    if (stock?.outOfStock) return 'out';
    const qty = stock?.stock ?? 0;
    if (qty < 0) return 'negative';
    if (stock?.minStock !== undefined && qty <= stock.minStock) return 'low';
    return 'ok';
};
