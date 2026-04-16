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
  loadTicket: (items: TicketItem[], mode: OrderMode, name: string) => void;
  getTotal: () => number;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      items: [],
      orderMode: 'Para Llevar',
      customerName: '',

      addItem: (newItem) => set((state) => {
        const existingIndex = state.items.findIndex(item => {
          // Si no tienen productId, no los consolidamos por seguridad (pueden ser items manuales)
          if (!item.productId || !newItem.productId) return false;
          if (item.productId !== newItem.productId) return false;
          
          // Checamos variante
          if (item.details?.variantName !== newItem.details?.variantName) return false;

          // Checamos modificadores
          const mods1 = item.details?.selectedModifiers || [];
          const mods2 = newItem.details?.selectedModifiers || [];
          if (mods1.length !== mods2.length) return false;
          
          const allModsMatch = mods1.every(m1 => mods2.some(m2 => m2.id === m1.id));
          return allModsMatch;
        });

        if (existingIndex > -1) {
          const updatedItems = [...state.items];
          const existingItem = updatedItems[existingIndex];
          updatedItems[existingIndex] = {
            ...existingItem,
            quantity: (existingItem.quantity || 1) + (newItem.quantity || 1)
          };
          return { items: updatedItems };
        }

        return { items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }] };
      }),

      removeItem: (id) => set((state) => ({ 
        items: state.items.filter(i => i.id !== id)
      })),

      clearTicket: () => set({ items: [], orderMode: 'Para Llevar', customerName: '' }),

      setOrderMode: (mode) => set({ orderMode: mode }),

      setCustomerName: (name) => set({ customerName: name }),

      loadTicket: (items, mode, name) => set({ items, orderMode: mode, customerName: name }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.finalPrice * (item.quantity || 1)), 0);
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