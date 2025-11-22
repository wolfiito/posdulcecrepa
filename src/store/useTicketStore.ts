import { create } from 'zustand';
import type { TicketItem } from '../types/menu';

type OrderMode = 'Mesa 1' | 'Mesa 2' | 'Para Llevar';

interface TicketState {
  items: TicketItem[];
  orderMode: OrderMode;
  orderNumber: number;

  // Acciones
  addItem: (item: TicketItem) => void;
  removeItem: (itemId: string) => void;
  clearTicket: () => void;
  setOrderMode: (mode: OrderMode) => void;
  incrementOrderNumber: () => void;
  getTotal: () => number;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  items: [],
  orderMode: 'Para Llevar',
  orderNumber: 101, // Valor inicial

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter(i => i.id !== id) 
  })),

  clearTicket: () => set({ items: [] }),

  setOrderMode: (mode) => set({ orderMode: mode }),

  incrementOrderNumber: () => set((state) => ({ orderNumber: state.orderNumber + 1 })),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.finalPrice, 0);
  }
}));