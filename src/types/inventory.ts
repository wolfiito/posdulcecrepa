// src/types/inventory.ts
// Inventario por insumo (lo que se compra: Nutella, masa, leche...) en kg, L o piezas.
// Las existencias se guardan en la unidad base (g, ml, pza) para no acumular errores de decimales.

export type SupplyUnit = 'kg' | 'L' | 'pza';

// Catálogo global: colección 'supplies'
export interface Supply {
    id: string;
    name: string;
    unit: SupplyUnit;
}

// Cuánto insumo gasta una porción, en unidad base (g, ml o pza)
export interface RecipeLine {
    supplyId: string;
    qty: number;
}

// Existencia por sucursal: branches/{branchId}/supplies_stock/{supplyId}
export interface SupplyStock {
    stock: number;          // unidad base; puede quedar negativa (el consumo es teórico)
    minStock?: number;      // unidad base; alerta "por agotarse"
    outOfStock?: boolean;   // marcado a mano: oculta en el POS lo que lo usa
    updatedAt?: any;
}

export type SupplyMoveType = 'sale' | 'cancel' | 'entry' | 'waste' | 'count';

// Historial por sucursal: branches/{branchId}/supply_moves
export interface SupplyMove {
    id?: string;
    supplyId: string;
    supplyName: string;
    type: SupplyMoveType;
    qty: number;            // cambio en unidad base (+ entra, - sale)
    before?: number;        // solo en movimientos manuales
    after?: number;
    note?: string;
    orderNumber?: number;
    user: string;
    createdAt: any;
}
