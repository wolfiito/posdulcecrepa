import { create } from 'zustand';
import type { MenuGroup, MenuItem } from '../types/menu';

type ViewType = 'menu' | 'ticket';
type ThemeType = 'dulce-light' | 'dulce-dark';

interface UIState {
  view: ViewType;
  theme: ThemeType;
  
  // Navegación de Categorías (Drill-down)
  currentGroup: MenuGroup | null;

  // Estado de Modales
  activeModal: 'none' | 'custom_crepe' | 'variant_select' | 'daily_report';
  groupToCustomize: MenuGroup | null;
  itemToSelectVariant: MenuItem | null;
  orderToPrint: any | null;

  // Acciones
  setView: (view: ViewType) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  navigateToGroup: (group: MenuGroup | null) => void;
  
  openCustomModal: (group: MenuGroup) => void;
  openVariantModal: (item: MenuItem) => void;
  openReportModal: () => void;

  closeModals: () => void;

  setOrderToPrint: (order: any | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: 'menu',
  theme: 'dulce-light',
  currentGroup: null,
  activeModal: 'none',
  groupToCustomize: null,
  itemToSelectVariant: null,
  orderToPrint: null,

  setView: (view) => set({ view }),

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dulce-light' ? 'dulce-dark' : 'dulce-light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    return { theme: newTheme };
  }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  navigateToGroup: (group) => set({ currentGroup: group }),

  openCustomModal: (group) => set({ 
    activeModal: 'custom_crepe', 
    groupToCustomize: group 
  }),

  openVariantModal: (item) => set({ 
    activeModal: 'variant_select', 
    itemToSelectVariant: item 
  }),

  openReportModal: () => set({ 
    activeModal: 'daily_report' 
  }),

  closeModals: () => set({ 
    activeModal: 'none', 
    groupToCustomize: null, 
    itemToSelectVariant: null 
  }),
  
  setOrderToPrint: (order) => set({ orderToPrint: order }),

}));