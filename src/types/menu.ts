import type { RecipeLine } from './inventory';


export interface FixedPriceItem {
    id: string; 
    name: string;
    category: string;
    price: number;
    cost?: number;
    description?: string;
    modifierGroups?: string[];
    disabledIn?: string[];        
    branchPrices?: Record<string, number>;
    recipe?: RecipeLine[];
  }
  
  export interface VariantPriceItem {
    id: string;
    name: string;
    category: string;
    description?: string;
    variants: {
      name: string;
      price: number;
      cost?: number;
      branchPrices?: Record<string, number>;
      recipe?: RecipeLine[];
    }[];
    modifierGroups?: string[];
    disabledIn?: string[];
  }
  
  export type MenuItem = FixedPriceItem | VariantPriceItem;
  
  export interface Modifier {
    id: string;
    name: string;
    price: number;
    cost?: number;
    branchPrices?: Record<string, number>;
    group: string; 
    disabledIn?: string[];
    recipe?: RecipeLine[];
  }
  
  export interface PriceRule {
    id: string;
    name: string;
    initialPrice?: number; // Precio para 1 ingrediente
    incrementPerIngredient?: number; // Costo por cada ingrediente adicional
    branchInitialPrices?: Record<string, number>;
    branchIncrements?: Record<string, number>;
    basePrices: {
      count: number;
      price: number;
      branchPrices?: Record<string, number>;
    }[];
  }
  
  export interface MenuGroup {
    id: string;
    name: string;
    level: number;
    price?: number;
    cost?: number; 
    parent?: string; 
    children?: string[]; 
    items_ref?: string[]; 
    rules_ref?: string; 
    base_group?: string; 
    extra_groups?: string[]; 
    topping_groups?: string[]; 
    recipe?: RecipeLine[]; // Lo que gasta la base (ej. masa), además de los ingredientes elegidos
  }
  export interface ModifierGroup {
    id: string;
    name: string;
    // true = el cliente elige solo una opción y es obligatoria.
    // Sin definir = se usa la lista fija de menuConstants (comportamiento anterior).
    isExclusive?: boolean;
  }
  export interface TicketItem {
    id: string; 
    baseName: string; 
    finalPrice: number; 
    finalCost?: number;
    type: 'CUSTOM' | 'FIXED' | 'VARIANT'; 
    quantity?: number; 
    productId?: string;
    // Insumos que gasta UNA unidad (unidad base), calculado al enviar la orden
    supplyUsage?: Record<string, number>;
    details?: {
      itemId?: string; 
      baseRuleId?: string; 
      basePriceRule?: string; 
      selectedModifiers: Modifier[]; 
      variantName?: string;
    }
  }