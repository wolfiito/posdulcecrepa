
import { MODIFIER_GROUPS, EXCLUSIVE_BASE_GROUPS } from '../constants/menuConstants';
import type { MenuGroup, Modifier, PriceRule } from '../types/menu';

interface PriceResult {
  price: number;
  cost: number; 
  ruleDescription: string;
  isValid: boolean;
}

export const getBranchPrice = (
  price: number,
  branchPrices: Record<string, number> | undefined,
  branchId?: string | null
): number => branchId ? branchPrices?.[branchId] ?? price : price;

/**
 * Precio base de una regla según cuántos ingredientes base se eligieron.
 * - Escalones (basePrices): el escalón exacto o el más cercano por debajo.
 *   Arriba del último escalón suma incrementPerIngredient por ingrediente
 *   (o, si no está configurado, el salto entre los dos últimos escalones).
 * - Sin escalones: initialPrice + incrementPerIngredient por cada ingrediente después del primero.
 * La regla ya debe venir ajustada a la sucursal.
 */
export const getRuleBasePrice = (
  priceRule: PriceRule | undefined,
  ingredientCount: number
): { price: number; error?: string } => {
  // Sin regla de precio no se puede cobrar: antes se vendía en $0 + extras
  if (!priceRule) return { price: 0, error: 'Regla de precio no encontrada' };

  const sortedRules = [...(priceRule.basePrices || [])].sort((a, b) => b.count - a.count);
  const maxRule = sortedRules[0];

  if (maxRule && ingredientCount > maxRule.count) {
    // HÍBRIDO: Usamos el tope de la lista y sumamos el incremento dinámico
    const prevRule = sortedRules[1];
    const increment = priceRule.incrementPerIngredient
        ?? (prevRule ? (maxRule.price - prevRule.price) / (maxRule.count - prevRule.count) : undefined);
    if (increment === undefined) {
      return { price: 0, error: `Máximo ${maxRule.count} ingrediente${maxRule.count === 1 ? '' : 's'}` };
    }
    return { price: maxRule.price + (ingredientCount - maxRule.count) * increment };
  }
  if (maxRule) {
    // TRADICIONAL: Buscamos en la lista (exacto o más cercano por debajo)
    const matchedRule = sortedRules.find(r => ingredientCount >= r.count);
    return { price: matchedRule?.price || 0 };
  }
  if (priceRule.initialPrice !== undefined && priceRule.incrementPerIngredient !== undefined) {
    // LINEAL PURO: (Si basePrices está vacío)
    return { price: priceRule.initialPrice + Math.max(0, ingredientCount - 1) * priceRule.incrementPerIngredient };
  }
  return { price: 0, error: 'Regla de precio sin configurar' };
};

/** Aplica a la regla los precios especiales de la sucursal. */
export const getBranchAdjustedRule = (priceRule: PriceRule | undefined, branchId?: string | null): PriceRule | undefined => {
  if (!priceRule) return undefined;
  return {
    ...priceRule,
    initialPrice: getBranchPriceOptional(priceRule.initialPrice, priceRule.branchInitialPrices, branchId),
    incrementPerIngredient: getBranchPriceOptional(priceRule.incrementPerIngredient, priceRule.branchIncrements, branchId),
    basePrices: (priceRule.basePrices || []).map(bp => ({
      ...bp,
      price: getBranchPrice(bp.price, bp.branchPrices, branchId)
    }))
  };
};

const getBranchPriceOptional = (
  price: number | undefined,
  branchPrices: Record<string, number> | undefined,
  branchId?: string | null
): number | undefined => (branchId ? branchPrices?.[branchId] ?? price : price);

export const calculateCustomItemPrice = (
  group: MenuGroup,
  selectedModifiers: Modifier[],
  priceRule?: PriceRule,
  branchId?: string | null
): PriceResult => {

  if (!group) return { price: 0, cost: 0, ruleDescription: 'Error', isValid: false };

  let baseIngredientCount = 0;
  let extraPrice = 0;
  
  let totalCost = group.cost || 0; 

  selectedModifiers.forEach(mod => {
    if (mod.group === group.base_group) baseIngredientCount++;
    extraPrice += getBranchPrice(mod.price, mod.branchPrices, branchId);

    if (mod.cost && mod.cost > 0) {
        totalCost += mod.cost;
    }
  });

  let basePrice = 0;
  let isValid = true;
  let ruleDescription = '';

  const isBaseExclusive = group.base_group ? EXCLUSIVE_BASE_GROUPS.includes(group.base_group) : false;

  if (isBaseExclusive) {
    ruleDescription = group.rules_ref === "regla_precio_fijo" ? group.name : 'Sabor Base';
    if (baseIngredientCount !== 1) {
      isValid = false;
      ruleDescription = 'Debe elegir 1 Sabor Base';
    }
    basePrice = group.price || 0;
  }
  // Cualquier categoría armable con regla de precio (crepas, waffles...), sin importar
  // cómo se llame su lista de ingredientes base
  else if (group.base_group && group.rules_ref) {
    ruleDescription = `${baseIngredientCount} Ingredientes`;
    if (baseIngredientCount === 0) {
      isValid = false;
      ruleDescription = 'Elija ingredientes base';
    } else {
      const result = getRuleBasePrice(priceRule, baseIngredientCount);
      if (result.error) {
        isValid = false;
        ruleDescription = result.error;
      } else {
        basePrice = result.price;
      }
    }
  }
  else {
      ruleDescription = group.name;
      basePrice = group.price || 0;
  }

  if (group.extra_groups?.includes(MODIFIER_GROUPS.BEBIDA_LECHE)) {
    const hasMilk = selectedModifiers.some(m => m.group === MODIFIER_GROUPS.BEBIDA_LECHE);
    if (!hasMilk) {
      isValid = false;
      ruleDescription = 'Seleccione tipo de leche';
    }
  }

  return {
    price: basePrice + extraPrice,
    cost: totalCost, 
    ruleDescription,
    isValid
  };
};