// src/store/useUIStore.ts
import { create } from 'zustand';
import type { MenuGroup, MenuItem } from '../types/menu';

// Definimos las secciones principales de la App
export type AppSection = 'pos' | 'orders' | 'shifts' | 'movements' | 'reports' | 'users' | 'admin_menu';
type ViewType = 'menu' | 'ticket';
type ThemeType = 'dulce-light' | 'dulce-dark';

interface UIState {
  // Estado Global de Navegación
  activeSection: AppSection;
  
  // Estado del POS
  view: ViewType;
  theme: ThemeType;
  
  // Navegación de Categorías (Drill-down)
  currentGroup: MenuGroup | null;

  // Estado de Modales
  activeModal: 'none' | 'custom_crepe' | 'variant_select' | 'daily_report' | 'shift_control';
  groupToCustomize: MenuGroup | null;
  itemToSelectVariant: MenuItem | null;
  orderToPrint: any | null;

  // Acciones
  setSection: (section: AppSection) => void; // <--- NUEVA ACCIÓN
  setView: (view: ViewType) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  navigateToGroup: (group: MenuGroup | null) => void;
  
  openCustomModal: (group: MenuGroup) => void;
  openVariantModal: (item: MenuItem) => void;
  openReportModal: () => void;
  openShiftModal: () => void;

  closeModals: () => void;

  setOrderToPrint: (order: any | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: 'pos', // Por defecto entramos al Punto de Venta
  view: 'menu',
  theme: 'dulce-light',
  currentGroup: null,
  activeModal: 'none',
  groupToCustomize: null,
  itemToSelectVariant: null,
  openShiftModal: () => set({ activeModal: 'shift_control' }),
  orderToPrint: null,

  setSection: (section) => set({ activeSection: section }), // <--- Implementación

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