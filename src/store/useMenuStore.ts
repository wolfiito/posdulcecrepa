// src/store/useMenuStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // <--- 1. Importar persistencia
import { db, collection, getDocs } from '../firebase';
import type { MenuGroup, MenuItem, Modifier, PriceRule } from '../types/menu';

interface MenuState {
  groups: MenuGroup[];
  items: MenuItem[];
  modifiers: Modifier[];
  rules: PriceRule[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number; // <--- 2. Para saber cuándo fue la última descarga
  
  // Acciones
  fetchMenuData: (force?: boolean) => Promise<void>; // <--- Opción para forzar
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      groups: [],
      items: [],
      modifiers: [],
      rules: [],
      isLoading: false,
      error: null,
      lastUpdated: 0,

      fetchMenuData: async (force = false) => {
        const now = Date.now();
        const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 Horas en milisegundos
        const { lastUpdated, items } = get();

        // 3. SI NO ES FORZADO Y LA DATA ES RECIENTE (< 24h) Y YA TENEMOS ITEMS... ¡NO HACEMOS NADA!
        if (!force && items.length > 0 && (now - lastUpdated < CACHE_DURATION)) {
            console.log("📦 Usando menú en caché (Sin lecturas a Firebase)");
            return;
        }

        console.log("🔥 Descargando menú de Firebase (Generando lecturas)...");
        set({ isLoading: true, error: null });
        
        try {
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
            isLoading: false,
            lastUpdated: now // <--- Actualizamos la marca de tiempo
          });
        } catch (err) {
          console.error("Error cargando menú:", err);
          set({ error: "Error al cargar datos del menú", isLoading: false });
        }
      }
    }),
    {
      name: 'dulcecrepa-menu-storage', // Nombre en localStorage
      storage: createJSONStorage(() => localStorage), // Guardar en el navegador
      // Solo guardamos los datos, no el estado de carga o error
      partialize: (state) => ({ 
        groups: state.groups, 
        items: state.items, 
        modifiers: state.modifiers, 
        rules: state.rules,
        lastUpdated: state.lastUpdated
      }),
    }
  )
);