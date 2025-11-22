import { create } from 'zustand';
import { db, collection, getDocs } from '../firebase';
import type { MenuGroup, MenuItem, Modifier, PriceRule } from '../types/menu';

interface MenuState {
  groups: MenuGroup[];
  items: MenuItem[];
  modifiers: Modifier[];
  rules: PriceRule[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  fetchMenuData: () => Promise<void>;
}

export const useMenuStore = create<MenuState>((set) => ({
  groups: [],
  items: [],
  modifiers: [],
  rules: [],
  isLoading: false,
  error: null,

  fetchMenuData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Ejecutamos todas las peticiones en paralelo
      const [groupsSnap, itemsSnap, modsSnap, rulesSnap] = await Promise.all([
        getDocs(collection(db, "menu_groups")),
        getDocs(collection(db, "menu_items")),
        getDocs(collection(db, "modifiers")),
        getDocs(collection(db, "price_rules")),
      ]);

      set({
        groups: groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)),
        items: itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)),
        modifiers: modsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Modifier)),
        rules: rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)),
        isLoading: false
      });
    } catch (err) {
      console.error("Error cargando menú:", err);
      set({ error: "Error al cargar datos del menú", isLoading: false });
    }
  }
}));