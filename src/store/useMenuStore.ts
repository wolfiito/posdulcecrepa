// src/store/useMenuStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, collection, onSnapshot, query } from '../firebase'; // <--- Usamos onSnapshot
import type { MenuGroup, MenuItem, Modifier, PriceRule } from '../types/menu';

interface MenuState {
  groups: MenuGroup[];
  items: MenuItem[];
  modifiers: Modifier[];
  rules: PriceRule[];
  
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  startListening: () => () => void; // Retorna una función para cancelar la suscripción
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
        set({ isLoading: true });
        console.log("📡 Conectando a actualizaciones en tiempo real...");

        // Escuchar Grupos
        const unsubGroups = onSnapshot(
            collection(db, "menu_groups"), 
            (snap) => set({ groups: snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)) }),
            (err) => console.error("Error groups:", err)
        );

        // Escuchar Items
        const unsubItems = onSnapshot(
            collection(db, "menu_items"),
            (snap) => set({ items: snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)) }),
            (err) => console.error("Error items:", err)
        );

        // Escuchar Modificadores
        const unsubModifiers = onSnapshot(
            collection(db, "modifiers"),
            (snap) => set({ modifiers: snap.docs.map(d => ({ id: d.id, ...d.data() } as Modifier)) }),
            (err) => console.error("Error modifiers:", err)
        );

        // Escuchar Reglas
        const unsubRules = onSnapshot(
            collection(db, "price_rules"),
            (snap) => {
                set({ 
                    rules: snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)),
                    isLoading: false // Asumimos que al cargar esto ya tenemos "algo"
                });
            },
            (err) => { 
                console.error("Error rules:", err);
                set({ error: "Error de conexión", isLoading: false });
            }
        );

        // Retornamos una función que limpia todo cuando se cierra la app (cleanup)
        return () => {
            console.log("🔕 Desconectando listeners...");
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
      // Guardamos todo en local para que al abrir la app se vea algo INMEDIATAMENTE
      // mientras se conecta a internet.
      partialize: (state) => ({ 
        groups: state.groups, 
        items: state.items, 
        modifiers: state.modifiers, 
        rules: state.rules
      }),
    }
  )
);