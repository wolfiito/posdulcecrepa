// src/constants/menuConstants.ts

export const MODIFIER_GROUPS = {
    BEBIDA_LECHE: "leche_opciones",
    CREPA_DULCE_BASE: "crepa_dulce_base",
    CREPA_SALADA_BASE: "crepa_salada_base",
    CREPA_TOPPING_SALSA: "crepa_topping_salsa",
    CREPA_TOPPING_SECO: "crepa_topping_seco",
  } as const;

  export const EXCLUSIVE_BASE_GROUPS = [
    "frappe_sabores", 
    "malteada_sabores", 
    "frappe_especial_sabores", 
    "soda_sabores", 
    "chamoyada_sabores", 
    "icee_sabores"
  ];
  
  export const EXCLUSIVE_GROUPS = [
    ...EXCLUSIVE_BASE_GROUPS,
    MODIFIER_GROUPS.BEBIDA_LECHE,
    MODIFIER_GROUPS.CREPA_TOPPING_SALSA,
    MODIFIER_GROUPS.CREPA_TOPPING_SECO
  ];