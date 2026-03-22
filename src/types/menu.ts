
export interface FixedPriceItem {
    id: string; 
    name: string;
    category: string;
    price: number;
    cost?: number;
    description?: string;
    modifierGroups?: string[];
    availableBranches?: string[]; 
    disabledIn?: string[];        
    branchPrices?: Record<string, number>;
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
    }[];
    modifierGroups?: string[];
    availableBranches?: string[]; 
    disabledIn?: string[];
  }
  
  export type MenuItem = FixedPriceItem | VariantPriceItem;
  
  export interface Modifier {
    id: string;
    name: string;
    price: number;
    cost?: number;
    group: string; 
    trackStock?: boolean;
    currentStock?: number;
    disabledIn?: string[];
  }
  
  export interface PriceRule {
    id: string;
    name: string;
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
  }
  export interface ModifierGroup {
    id: string;
    name: string;
  }
  export interface TicketItem {
    id: string; 
    baseName: string; 
    finalPrice: number; 
    finalCost?: number;
    type: 'CUSTOM' | 'FIXED' | 'VARIANT'; 
    quantity?: number; 
    productId?: string;
    details?: {
      itemId?: string; 
      baseRuleId?: string; 
      basePriceRule?: string; 
      selectedModifiers: Modifier[]; 
      variantName?: string;
    }
  }