// src/utils/pricing.ts
import { MODIFIER_GROUPS, EXCLUSIVE_BASE_GROUPS } from '../constants/menuConstants';
import type { MenuGroup, Modifier, PriceRule } from '../types/menu';

interface PriceResult {
  price: number;
  cost: number; // <--- Nuevo output
  ruleDescription: string;
  isValid: boolean;
}

export const calculateCustomItemPrice = (
  group: MenuGroup,
  selectedModifiers: Modifier[],
  priceRule?: PriceRule
): PriceResult => {
  // 1. Validación básica
  if (!group) return { price: 0, cost: 0, ruleDescription: 'Error', isValid: false };

  // 2. Contar ingredientes base, sumar extras y sumar COSTOS
  let baseIngredientCount = 0;
  let extraPrice = 0;
  
  // Costo Base del Grupo (ej. Masa + Gas + Plato)
  // Si no está definido en el JSON, asumimos 0 por ahora.
  let totalCost = group.cost || 0; 

  selectedModifiers.forEach(mod => {
    // Lógica de Precio (Venta)
    if (mod.group === group.base_group) baseIngredientCount++;
    if (mod.price > 0) extraPrice += mod.price;

    // Lógica de Costo (Insumos) - SIEMPRE se suma
    if (mod.cost && mod.cost > 0) {
        totalCost += mod.cost;
    }
  });

  // 3. Determinar Precio Base de Venta
  let basePrice = 0;
  let isValid = true;
  let ruleDescription = '';

  const isBaseExclusive = group.base_group ? EXCLUSIVE_BASE_GROUPS.includes(group.base_group) : false;

  // LÓGICA DE REGLAS (Sin cambios, solo determinan el precio de venta)
  if (isBaseExclusive) {
    ruleDescription = group.rules_ref === "regla_precio_fijo" ? group.name : 'Sabor Base';
    if (baseIngredientCount !== 1) {
      isValid = false;
      ruleDescription = 'Debe elegir 1 Sabor Base';
    }
    basePrice = group.price || 0;
  }
  else if (group.id.includes('licuados')) {
    const requiredCount = group.id.includes('sencillo') ? 1 : 2;
    ruleDescription = `${baseIngredientCount}/${requiredCount} Ingredientes`;
    if (baseIngredientCount !== requiredCount) {
      isValid = false;
      ruleDescription = `Elija ${requiredCount} ingrediente(s)`;
    }
    const matchedRule = priceRule?.basePrices.find(r => r.count === requiredCount);
    basePrice = matchedRule?.price || 0;
  }
  else if (group.base_group === MODIFIER_GROUPS.CREPA_DULCE_BASE || group.base_group === MODIFIER_GROUPS.CREPA_SALADA_BASE) {
    ruleDescription = `${baseIngredientCount} Ingredientes`;
    if (baseIngredientCount === 0) {
      isValid = false;
      ruleDescription = 'Elija ingredientes base';
    }
    if (priceRule) {
        const matchedRule = [...priceRule.basePrices]
            .sort((a, b) => b.count - a.count)
            .find(r => baseIngredientCount >= r.count);
        basePrice = matchedRule?.price || 0;
    }
  }
  else {
      ruleDescription = group.name;
      basePrice = group.price || 0;
  }

  // 4. Validaciones
  if (group.extra_groups?.includes(MODIFIER_GROUPS.BEBIDA_LECHE)) {
    const hasMilk = selectedModifiers.some(m => m.group === MODIFIER_GROUPS.BEBIDA_LECHE);
    if (!hasMilk) {
      isValid = false;
      ruleDescription = 'Seleccione tipo de leche';
    }
  }

  return {
    price: basePrice + extraPrice,
    cost: totalCost, // <--- Retornamos el costo calculado
    ruleDescription,
    isValid
  };
};