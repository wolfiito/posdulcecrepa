import { create } from 'zustand';
import type { TicketItem } from '../types/menu';
import { persist, createJSONStorage } from 'zustand/middleware';

type OrderMode = string;

interface TicketState {
  items: TicketItem[];
  orderMode: OrderMode;
  customerName: string;

  // Acciones
  addItem: (item: TicketItem) => void;
  removeItem: (itemId: string) => void;
  clearTicket: () => void;
  setOrderMode: (mode: OrderMode) => void;
  setCustomerName: (name: string) => void;
  getTotal: () => number;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      items: [],
      orderMode: 'Para Llevar',
      customerName: '',

      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ 
        items: state.items.filter(i => i.id !== id)
    })
  ),

  clearTicket: () => set({ items: [], customerName: '' }),

  setOrderMode: (mode) => set({ orderMode: mode }),

  setCustomerName: (name) => set({ customerName: name }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.finalPrice, 0);
  }
  }),
  {
    name: 'dulcecrepa-ticket-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        items: state.items, 
        orderMode: state.orderMode, 
        customerName: state.customerName 
        // Ya no guardamos orderNumber
      }),
  }
)
);