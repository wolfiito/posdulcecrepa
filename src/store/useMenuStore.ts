// src/store/useMenuStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, collection, onSnapshot } from '../firebase';
import type { MenuGroup, MenuItem, Modifier, PriceRule } from '../types/menu';

interface MenuState {
  groups: MenuGroup[];
  items: MenuItem[];
  modifiers: Modifier[];
  rules: PriceRule[];
  
  isLoading: boolean;
  error: string | null;

  startListening: () => () => void;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      groups: [],
      items: [],
      modifiers: [],
      rules: [],
      isLoading: false,
      error: null,

      startListening: () => {
        set({ isLoading: true, error: null });

        let loadedSections = {
          groups: false,
          items: false,
          modifiers: false,
          rules: false
        };

        const checkLoadingStatus = () => {
          if (
              loadedSections.groups && 
              loadedSections.items && 
              loadedSections.modifiers && 
              loadedSections.rules
          ) {
              set({ isLoading: false });
          }
      };

      // 1. Escuchar Grupos
      const unsubGroups = onSnapshot(
        collection(db, "menu_groups"), 
        (snap) => {
            set({ groups: snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)) });
            loadedSections.groups = true;
            checkLoadingStatus();
        },
        (err) => {
            console.error("Error groups:", err);
            set({ error: "Error cargando categorías" });
        }
    );

    // 2. Escuchar Items
    const unsubItems = onSnapshot(
        collection(db, "menu_items"),
        (snap) => {
            set({ items: snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)) });
            loadedSections.items = true;
            checkLoadingStatus();
        },
        (err) => {
            console.error("Error items:", err);
            set({ error: "Error cargando productos" });
        }
    );

    // 3. Escuchar Modificadores
    const unsubModifiers = onSnapshot(
        collection(db, "modifiers"),
        (snap) => {
            set({ modifiers: snap.docs.map(d => ({ id: d.id, ...d.data() } as Modifier)) });
            loadedSections.modifiers = true;
            checkLoadingStatus();
        },
        (err) => {
            console.error("Error modifiers:", err);
            set({ error: "Error cargando extras" });
        }
    );

    // 4. Escuchar Reglas de Precio
    const unsubRules = onSnapshot(
        collection(db, "price_rules"),
        (snap) => {
            set({ rules: snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)) });
            loadedSections.rules = true;
            checkLoadingStatus();
        },
        (err) => { 
            console.error("Error rules:", err);
            set({ error: "Error cargando reglas de precio" });
        }
    );

        // Retornamos una función que limpia todo cuando se cierra la app (cleanup)
        return () => {
            unsubGroups();
            unsubItems();
            unsubModifiers();
            unsubRules();
        };
      }
    }),
    {
      name: 'dulcecrepa-menu-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        groups: state.groups, 
        items: state.items, 
        modifiers: state.modifiers, 
        rules: state.rules
      }),
    }
  )
);