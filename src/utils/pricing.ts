// src/utils/pricing.ts
import { MODIFIER_GROUPS, EXCLUSIVE_BASE_GROUPS } from '../constants/menuConstants';
import type { MenuGroup, Modifier, PriceRule } from '../types/menu';

interface PriceResult {
  price: number;
  ruleDescription: string;
  isValid: boolean;
}

export const calculateCustomItemPrice = (
  group: MenuGroup,
  selectedModifiers: Modifier[],
  priceRule?: PriceRule
): PriceResult => {
  // 1. Validación básica
  if (!group) return { price: 0, ruleDescription: 'Error', isValid: false };

  // 2. Contar ingredientes base y sumar extras
  let baseIngredientCount = 0;
  let extraCost = 0;

  selectedModifiers.forEach(mod => {
    if (mod.group === group.base_group) baseIngredientCount++;
    if (mod.price > 0) extraCost += mod.price;
  });

  // 3. Determinar Precio Base y Regla
  let basePrice = 0;
  let isValid = true;
  let ruleDescription = '';

  const isBaseExclusive = group.base_group ? EXCLUSIVE_BASE_GROUPS.includes(group.base_group) : false;

  // CASO A: Grupos Exclusivos (Bebidas, Frappes) - Precio fijo del grupo
  if (isBaseExclusive) {
    ruleDescription = group.rules_ref === "regla_precio_fijo" ? group.name : 'Sabor Base';
    if (baseIngredientCount !== 1) {
      isValid = false;
      ruleDescription = 'Debe elegir 1 Sabor Base';
    }
    basePrice = group.price || 0;
  }
  // CASO B: Licuados (Lógica especial 1 o 2 ingredientes)
  else if (group.id.includes('licuados')) {
    const requiredCount = group.id.includes('sencillo') ? 1 : 2;
    ruleDescription = `${baseIngredientCount}/${requiredCount} Ingredientes`;
    
    if (baseIngredientCount !== requiredCount) {
      isValid = false;
      ruleDescription = `Elija ${requiredCount} ingrediente(s)`;
    }
    // Buscamos el precio en la regla (si existe) o usamos 0
    const matchedRule = priceRule?.basePrices.find(r => r.count === requiredCount);
    basePrice = matchedRule?.price || 0;
  }
  // CASO C: Crepas y Waffles (Precio por escala de ingredientes)
  else if (group.base_group === MODIFIER_GROUPS.CREPA_DULCE_BASE || group.base_group === MODIFIER_GROUPS.CREPA_SALADA_BASE) {
    ruleDescription = `${baseIngredientCount} Ingredientes`;
    if (baseIngredientCount === 0) {
      isValid = false;
      ruleDescription = 'Elija ingredientes base';
    }
    // Buscamos el precio que corresponda al conteo (o el máximo disponible si se pasa)
    if (priceRule) {
        const matchedRule = [...priceRule.basePrices]
            .sort((a, b) => b.count - a.count)
            .find(r => baseIngredientCount >= r.count);
        basePrice = matchedRule?.price || 0;
    }
  }
  // CASO D: Precio Fijo Genérico
  else {
      ruleDescription = group.name;
      basePrice = group.price || 0;
  }

  // 4. Validaciones de Dependencias (Ej. Leche)
  if (group.extra_groups?.includes(MODIFIER_GROUPS.BEBIDA_LECHE)) {
    const hasMilk = selectedModifiers.some(m => m.group === MODIFIER_GROUPS.BEBIDA_LECHE);
    // Si seleccionó un sabor base que NO sea 'agua' (o lógica similar), exigir leche.
    // Por simplicidad, si el grupo pide leche, exigimos que seleccione una opción de leche.
    if (!hasMilk) {
      isValid = false;
      ruleDescription = 'Seleccione tipo de leche';
    }
  }

  return {
    price: basePrice + extraCost,
    ruleDescription,
    isValid
  };
};