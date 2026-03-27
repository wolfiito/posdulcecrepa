// src/components/admin/DatabaseSeeder.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const DatabaseSeeder: React.FC = () => {
    const [loading, setLoading] = useState(false);
    // Agregamos el root
    // const runMigration = async () => {
    //     setLoading(true);
    //     toast.info("Creando el nuevo esqueleto aplanado...");

    //     try {
    //         const groups = [
    //             // NIVEL 0: El menú principal (La pantalla de inicio)
    //             { 
    //                 id: "root", 
    //                 name: "Menú Principal", 
    //                 level: 0, 
    //                 children: [
    //                     "crepas_dulces", 
    //                     "crepas_saladas", 
    //                     "bebidas_calientes", 
    //                     "bebidas_frias", 
    //                     "hotcakes", 
    //                     "waffles", 
    //                     "mini_hotcakes", 
    //                     "postres"
    //                 ] 
    //             },
                
    //             // NIVEL 1: Los botones principales de la pantalla
    //             // Las Crepas tendrán sub-carpetas (para separar "Armar" de "Especiales")
    //             { id: "crepas_dulces", name: "Crepas Dulces", level: 1, parent: "root", children: [] },
    //             { id: "crepas_saladas", name: "Crepas Saladas", level: 1, parent: "root", children: [] },
                
    //             { id: "bebidas_calientes", name: "Bebidas Calientes", level: 1, parent: "root", items_ref: [] },
    //             { id: "bebidas_frias", name: "Bebidas Frías", level: 1, parent: "root", items_ref: [] },
                
    //             { id: "hotcakes", name: "Hot Cakes", level: 1, parent: "root", items_ref: [] },
    //             { id: "waffles", name: "Waffles", level: 1, parent: "root", items_ref: [] },
    //             { id: "mini_hotcakes", name: "Mini Hot Cakes", level: 1, parent: "root", items_ref: [] },
    //             { id: "postres", name: "Postres Fijos", level: 1, parent: "root", items_ref: [] }
    //         ];

    //         // Inyectamos solo los grupos en Firebase
    //         for (const g of groups) {
    //             await setDoc(doc(db, "menu_groups", g.id), g);
    //         }

    //         toast.success("¡Estructura de 8 botones creada!");
    //     } catch (e) {
    //         console.error(e);
    //         toast.error("Error al crear las carpetas.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Agregamos bebidas calientes
    // const runMigration = async () => {
    //     setLoading(true);
    //     toast.info("Inyectando Bebidas Calientes (Arquitectura Dinámica)...");

    //     try {

    //         const modifierGroups = [
    //             { id: "te_sabor", name: "Sabor de Té" },
    //             { id: "tisanas_sabor", name: "Sabor de Tisanas" },
    //             { id: "tipo_leche", name: "Tipo de Leche" },
    //             { id: "topping_bebida", name: "Toppings para Bebida" }
    //         ];

    //         const modifiers = [
    //             { id: "te_manzana", name: "Manzana Verde", price: 0, group: "te_sabor", trackStock: true },
    //             { id: "te_limon", name: "Limón", price: 0, group: "te_sabor", trackStock: true },
    //             { id: "leche_entera", name: "Leche Entera", price: 0, group: "tipo_leche", trackStock: false },
    //             { id: "leche_deslac", name: "Deslactosada", price: 0, group: "tipo_leche", trackStock: false },
    //             { id: "top_bombones", name: "Bombones", price: 0, group: "topping_bebida", trackStock: false }
    //         ];

    //         const items = [
    //             { 
    //                 id: "item_americano", 
    //                 name: "Americano", 
    //                 category: "bebidas",
    //                 disabledIn: [], 
    //                 modifierGroups: [],
    //                 variants: [
    //                     { name: "Chico", price: 30, branchPrices: {} }, 
    //                     { name: "Mediano", price: 35, branchPrices: {} },
    //                     { name: "Grande", price: 40, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_capuchino", 
    //                 name: "Capuchino", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 35, branchPrices: {} },
    //                     { name: "Mediano", price: 40, branchPrices: {} },
    //                     { name: "Grande", price: 45, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_latte", 
    //                 name: "Latte", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 40, branchPrices: {} },
    //                     { name: "Mediano", price: 45, branchPrices: {} },
    //                     { name: "Grande", price: 50, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_vainilla_latte", 
    //                 name: "Vainilla latte", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 40, branchPrices: {} },
    //                     { name: "Mediano", price: 45, branchPrices: {} },
    //                     { name: "Grande", price: 50, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_taro_latte", 
    //                 name: "Taro latte", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 40, branchPrices: {} },
    //                     { name: "Mediano", price: 45, branchPrices: {} },
    //                     { name: "Grande", price: 50, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_matcha_latte", 
    //                 name: "Matcha latte", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 40, branchPrices: {} },
    //                     { name: "Mediano", price: 45, branchPrices: {} },
    //                     { name: "Grande", price: 50, branchPrices: {} }
    //                 ] 
    //             },
    //             {
                   
    //                 id: "item_moka", 
    //                 name: "Moka", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 40, branchPrices: {} },
    //                     { name: "Mediano", price: 45, branchPrices: {} },
    //                     { name: "Grande", price: 50, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_chocolate", 
    //                 name: "Chocolate", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 35, branchPrices: {} },
    //                     { name: "Mediano", price: 40, branchPrices: {} },
    //                     { name: "Grande", price: 45, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_chocolate_blanco", 
    //                 name: "Chocolate blanco", 
    //                 category: "bebidas", 
    //                 disabledIn: [], 
    //                 modifierGroups: ["tipo_leche", "topping_bebida"],
    //                 variants: [
    //                     { name: "Chico", price: 35, branchPrices: {} },
    //                     { name: "Mediano", price: 40, branchPrices: {} },
    //                     { name: "Grande", price: 45, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_te", 
    //                 name: "Té", 
    //                 category: "bebidas", 
    //                 modifierGroups: ["te_sabor"],
    //                 disabledIn: [], 
    //                 variants: [
    //                     { name: "Chico", price: 25, branchPrices: {} },
    //                     { name: "Mediano", price: 30, branchPrices: {} },
    //                     { name: "Grande", price: 35, branchPrices: {} }
    //                 ] 
    //             },
    //             { 
    //                 id: "item_tisanas", 
    //                 name: "Tisanas", 
    //                 category: "bebidas", 
    //                 modifierGroups: ["tisanas_sabor"],
    //                 disabledIn: [], 
    //                 variants: [
    //                     { name: "Chico", price: 25, branchPrices: {} },
    //                     { name: "Mediano", price: 30, branchPrices: {} },
    //                     { name: "Grande", price: 35, branchPrices: {} }
    //                 ] 
    //             }
    //         ];

    //         const grupoBebidasCalientes = { 
    //             id: "bebidas_calientes", 
    //             name: "Bebidas Calientes", 
    //             level: 1, 
    //             parent: "root", 
    //             items_ref: ["item_americano", "item_capuchino", "item_latte", "item_vainilla_latte", "item_taro_latte", "item_matcha_latte", "item_chocolate", "item_chocolate_blanco", "item_te", "item_tisanas"] 
    //         };

    //         for (const mg of modifierGroups) await setDoc(doc(db, "modifier_groups", mg.id), mg);
    //         for (const m of modifiers) await setDoc(doc(db, "modifiers", m.id), m);
    //         for (const item of items) await setDoc(doc(db, "menu_items", item.id), item);
    //         await setDoc(doc(db, "menu_groups", grupoBebidasCalientes.id), grupoBebidasCalientes);

    //         toast.success("¡Arquitectura Multi-Sucursal dinámica lista!");
    //     } catch (e) {
    //         console.error(e);
    //         toast.error("Ocurrió un error.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const runMigration = async () => {
    //     setLoading(true);
    //     toast.info("Inyectando Bebidas Frías y Bubble Tea...");

    //     try {

    //         // 1. LOS GRUPOS NUEVOS
    //         const modifierGroups = [
    //             { id: "soda_sabor", name: "Sabor de Soda" },
    //             { id: "chamoy_sabor", name: "Sabor de Chamoyada" },
    //             { id: "malt_sen_sabor", name: "Sabor Malteada Sencilla" },
    //             { id: "malt_esp_sabor", name: "Sabor Malteada Especial" },
    //             { id: "frap_sen_sabor", name: "Sabor Frappé Sencillo" },
    //             { id: "frap_esp_sabor", name: "Sabor Frappé Especial" },
    //             { id: "bubble_sabor", name: "Sabor de Tapioca (Boba)" },
    //             { id: "bubble_estilo", name: "Estilo de Bebida" }
    //         ];

    //         // 2. LAS OPCIONES Y SABORES
    //         const modifiers = [
    //             // Sodas
    //             { id: "sd_rojos", name: "Soda Frutos rojos", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_mora", name: "Soda Mora azul", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_manzana", name: "Soda Manzana verde", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_cereza", name: "Soda Cereza", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_maracuya", name: "Soda Maracuya", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_mango", name: "Soda Mango", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_liche", name: "Soda Liche", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_sandia", name: "Soda Sandia", price: 0, group: "soda_sabor", trackStock: true },
    //             { id: "sd_uva", name: "Soda Uva", price: 0, group: "soda_sabor", trackStock: true },
                
    //             // Chamoyadas
    //             { id: "cham_mango", name: "Chamoyada Mango", price: 0, group: "chamoy_sabor", trackStock: false },
    //             { id: "cham_fresa", name: "Chamoyada Fresa", price: 0, group: "chamoy_sabor", trackStock: false },
    //             { id: "cham_ice_cereza", name: "Chamoyada Ice cereza", price: 0, group: "chamoy_sabor", trackStock: false },
    //             { id: "cham_ice_mora_azul", name: "Chamoyada Ice mora azul", price: 0, group: "chamoy_sabor", trackStock: false },

    //             // Malteadas / Frappés Sencillos
    //             { id: "ms_fresa", name: "Fresa", price: 0, group: "malt_sen_sabor", trackStock: false },
    //             { id: "ms_vainilla", name: "Vainilla", price: 0, group: "malt_sen_sabor", trackStock: false },
    //             { id: "ms_chocolate", name: "Chocolate", price: 0, group: "malt_sen_sabor", trackStock: false },
    //             { id: "ms_cookies_cream", name: "Cookies & Cream", price: 0, group: "malt_sen_sabor", trackStock: false },
                
    //             { id: "fs_taro", name: "Taro", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_capuchino", name: "Capuchino", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_rompompe", name: "Rompompe", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_moka", name: "Moka", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_matcha", name: "Matcha", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_galleta_oreo", name: "Galleta oreo", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_mazapan", name: "Mazapan", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_caramelo", name: "Caramelo", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_horchata", name: "Horchata", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_coco", name: "Coco", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_fresas_crema", name: "Fresas con crema", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_cajeta", name: "Cajeta", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_vainilla_francesa", name: "Vainilla francesa", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_chicle", name: "Chicle", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_chocolate_blanco", name: "Chocolate blanco", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_chocolate_oscuro", name: "Chocolate oscuro", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_cafe", name: "Cafe", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_yogurt_fresa", name: "Yogurt de fresa", price: 0, group: "frap_sen_sabor", trackStock: false },
    //             { id: "fs_pistache", name: "Pistache", price: 0, group: "frap_sen_sabor", trackStock: false },

    //             // Malteadas / Frappés Especiales
    //             { id: "me_mazapan", name: "Mazapán", price: 0, group: "malt_esp_sabor", trackStock: false },
    //             { id: "me_rompope", name: "Rompope", price: 0, group: "malt_esp_sabor", trackStock: false },
    //             { id: "me_dulce_leche", name: "Dulce de leche", price: 0, group: "malt_esp_sabor", trackStock: false },

    //             { id: "fe_pay_limon", name: "Pay de limón", price: 0, group: "frap_esp_sabor", trackStock: false },
    //             { id: "fe_baileys", name: "Baileys", price: 0, group: "frap_esp_sabor", trackStock: false },
    //             { id: "fe_nutella", name: "Nutella", price: 0, group: "frap_esp_sabor", trackStock: false },
    //             { id: "fe_kahlua", name: "Kahlua", price: 0, group: "frap_esp_sabor", trackStock: false },

    //             // Bubble Tea (Ejemplo de sabores)
    //             { id: "bt_taro", name: "Taro", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_horchavainilla", name: "Horchavainilla", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_chai", name: "Chai", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_matcha", name: "Matcha", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_mazapan", name: "Mazapan", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_strawberry", name: "Strawberry", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_dulce_leche", name: "Dulce de leche", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_cookies_cream", name: "Cookies & cream", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_coffe_chocolate", name: "Coffe chocolate", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_horchata_tea", name: "Horchata tea", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_moka", name: "Moka", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_gum", name: "Gum", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_caramel", name: "Caramel", price: 0, group: "bubble_sabor", trackStock: false },
    //             { id: "bt_est_frappe", name: "En Frappé", price: 0, group: "bubble_estilo", trackStock: false },
    //             { id: "bt_est_latte", name: "En Latte Frío", price: 0, group: "bubble_estilo", trackStock: false }
    //         ];

    //         // 3. LOS PRODUCTOS
    //         const items = [
    //             // Tienen precio fijo, pero abren modal porque tienen "modifierGroups"
    //             { id: "item_soda", name: "Soda Italiana", category: "bebidas", price: 70, disabledIn: [], branchPrices: {}, modifierGroups: ["soda_sabor"] },
    //             { id: "item_chamoyada", name: "Chamoyada / ICEE", category: "bebidas", price: 70, disabledIn: [], branchPrices: {}, modifierGroups: ["chamoy_sabor"] },
    //             { id: "item_malt_sen", name: "Malteada Sencilla", category: "bebidas", price: 70, disabledIn: [], branchPrices: {}, modifierGroups: ["malt_sen_sabor"] },
    //             { id: "item_malt_esp", name: "Malteada Especial", category: "bebidas", price: 90, disabledIn: [], branchPrices: {}, modifierGroups: ["malt_esp_sabor"] },
    //             { id: "item_frap_sen", name: "Frappé Sencillo", category: "bebidas", price: 70, disabledIn: [], branchPrices: {}, modifierGroups: ["frap_sen_sabor"] },
    //             { id: "item_frap_esp", name: "Frappé Especial", category: "bebidas", price: 90, disabledIn: [], branchPrices: {}, modifierGroups: ["frap_esp_sabor"] },
    //             { id: "item_bubble_tea", name: "Bubble Tea", category: "bebidas", price: 95, disabledIn: [], branchPrices: {}, modifierGroups: ["bubble_sabor", "bubble_estilo"] }
    //         ];

    //         // 4. ACTUALIZAMOS LA CARPETA
    //         const grupoBebidasFrias = { 
    //             id: "bebidas_frias", 
    //             name: "Bebidas Frías", 
    //             level: 1, 
    //             parent: "root", 
    //             items_ref: [
    //                 "item_soda", "item_chamoyada", "item_malt_sen", 
    //                 "item_malt_esp", "item_frap_sen", "item_frap_esp", "item_bubble_tea"
    //             ] 
    //         };

    //         for (const mg of modifierGroups) await setDoc(doc(db, "modifier_groups", mg.id), mg);
    //         for (const m of modifiers) await setDoc(doc(db, "modifiers", m.id), m);
    //         for (const item of items) await setDoc(doc(db, "menu_items", item.id), item);
    //         await setDoc(doc(db, "menu_groups", grupoBebidasFrias.id), grupoBebidasFrias);

    //         toast.success("¡Bebidas Frías inyectadas!");
    //     } catch (e) {
    //         console.error(e);
    //         toast.error("Ocurrió un error.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const runMigration = async () => {
    //     setLoading(true);
    //     toast.info("Inyectando Lógica Matemática para Waffles y Hot Cakes...");

    //     try {
    //         // 1. LA REGLA MATEMÁTICA (Sube de $5 en $5)
    //         const priceRules = [
    //             { 
    //                 id: "rule_waffles_hc", 
    //                 name: "Regla Waffles/HotCakes (Salto $5)", 
    //                 basePrices: [
    //                     { count: 1, price: 60 }, { count: 2, price: 65 }, 
    //                     { count: 3, price: 70 }, { count: 4, price: 75 }, 
    //                     { count: 5, price: 80 }, { count: 6, price: 85 }
    //                 ] 
    //             }
    //         ];

    //         // 2. LAS CARPETAS DE INGREDIENTES (Los 3 pasos del modal)
    //         const modifierGroups = [
    //             { id: "crepa_dulce_base", name: "Paso 1: Ingredientes Base" },
    //             { id: "crepa_dulce_extra", name: "Paso 2: Extras (Con Costo)" },
    //             { id: "crepa_dulce_topping", name: "Paso 3: Cortesías (Gratis)" }
    //         ];

    //         // 3. LOS INGREDIENTES DULCES (Listos para inventario y sucursales)
    //         const modifiers = [
    //             // Bases (Mueven la regla de $5)
    //             { id: "mod_nutella", name: "Nutella", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_q_philadelphia", name: "Queso philadelphia", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_rompope", name: "Rompope", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_cajeta", name: "Cajeta", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_crema_cacahuate", name: "Crema de cacahuate", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_mermelada_fresa", name: "Mermelada de fresa", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_mermelada_zarzamora", name: "Mermelada de zarzamora", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_maple", name: "Maple", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_galleta_oreo", name: "Galleta oreo", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_galleta_chokis", name: "Galleta chokis", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_lechera", name: "Lechera", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_nuez", name: "Nuez", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_chocolate_hersheys", name: "Chocolate hershey's", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_crema_batida", name: "Crema batida", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_chantilly", name: "Chantilly", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_fresa", name: "Fresa", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_durazno_almibar", name: "Duraznos en almíbar", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_manzana_verde", name: "Manzana verde", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_platano", name: "Plátano", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_mango", name: "Mango", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_zarzamora", name: "Zarzamora", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_cereza_almibar", name: "Cereza en almíbar", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_blueberry", name: "Blueberry", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_frambuesa", name: "Frambueza", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_uva_verde", name: "Uva verde", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },
    //             { id: "mod_kiwi", name: "Kiwi", price: 0, group: "crepa_dulce_base", trackStock: false, disabledIn: [] },

    //             // Extras (Suman su propio precio al total)
    //             { id: "mod_ext_ksorpresa", name: "Kinder Sorpresa", price: 30, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_kdelice", name: "Kinder Delice", price: 15, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_kchocolate", name: "Kinder Chocolate", price: 10, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_kbueno", name: "Kinder Bueno", price: 30, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_hersheys_blanco", name: "Hershey's blanco", price: 10, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_mini_conejo_turin", name: "Mini conejo", price: 10, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_helado", name: "Bola de helado", price: 10, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_baileys", name: "Baileys", price: 30, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
    //             { id: "mod_ext_kahlua", name: "Kahlua", price: 30, group: "crepa_dulce_extra", trackStock: true, disabledIn: [] },
                
    //             // Toppings (100% Gratis)
    //             { id: "top_lechera", name: "Lechera", price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] },
    //             { id: "top_chispas", name: "Chispas de colores", price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] },
    //             { id: "top_hersheys", name: "Chocolate hershey's", price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] },
    //             { id: "top_nuez", name: "Nuez", price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] }
    //         ];

    //         // 4. ACTUALIZAMOS LOS BOTONES PRINCIPALES
    //         // Les inyectamos "rules_ref" para que abran el diseñador inmediatamente al darles clic
    //         const groups = [
    //             {
    //                 id: "waffles",
    //                 name: "Waffles",
    //                 level: 1,
    //                 parent: "root",
    //                 rules_ref: "rule_waffles_hc",
    //                 base_group: "crepa_dulce_base",
    //                 extra_groups: ["crepa_dulce_extra"],
    //                 topping_groups: ["crepa_dulce_topping"]
    //             },
    //             {
    //                 id: "hotcakes",
    //                 name: "Hot Cakes",
    //                 level: 1,
    //                 parent: "root",
    //                 rules_ref: "rule_waffles_hc",
    //                 base_group: "crepa_dulce_base",
    //                 extra_groups: ["crepa_dulce_extra"],
    //                 topping_groups: ["crepa_dulce_topping"]
    //             },
    //             {
    //                 id: "mini_hotcakes",
    //                 name: "Mini Hot Cakes",
    //                 level: 1,
    //                 parent: "root",
    //                 rules_ref: "rule_waffles_hc",
    //                 base_group: "crepa_dulce_base",
    //                 extra_groups: ["crepa_dulce_extra"],
    //                 topping_groups: ["crepa_dulce_topping"]
    //             }
    //         ];

    //         // Inyectamos todo en la base de datos
    //         for (const rule of priceRules) await setDoc(doc(db, "price_rules", rule.id), rule);
    //         for (const mg of modifierGroups) await setDoc(doc(db, "modifier_groups", mg.id), mg);
    //         for (const mod of modifiers) await setDoc(doc(db, "modifiers", mod.id), mod);
    //         for (const grp of groups) await setDoc(doc(db, "menu_groups", grp.id), grp);

    //         toast.success("¡Waffles y Hot Cakes listos!");
    //     } catch (e) {
    //         console.error(e);
    //         toast.error("Ocurrió un error en la migración.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const runMigration = async () => {
    //     setLoading(true);
    //     toast.info("Inyectando Crepas Dulces, Saladas y Especiales...");

    //     try {
    //         // 1. LAS REGLAS MATEMÁTICAS EXACTAS
            // const priceRules = [
            //     { 
            //         id: "rule_crepa_dulce", 
            //         name: "Regla Crepa Dulce", 
            //         basePrices: [
            //             { count: 1, price: 60 }, { count: 2, price: 70 }, 
            //             { count: 3, price: 75 }, { count: 4, price: 85 }, 
            //             { count: 5, price: 95 }, { count: 6, price: 105 }
            //         ] 
            //     },
            //     { 
            //         id: "rule_crepa_salada", 
            //         name: "Regla Crepa Salada", 
            //         basePrices: [
            //             { count: 1, price: 60 }, { count: 2, price: 70 }, 
            //             { count: 3, price: 80 }, { count: 4, price: 90 }, 
            //             { count: 5, price: 100 }, { count: 6, price: 110 }
            //         ] 
            //     }
            // ];

    //         // 2. LAS CARPETAS DE INGREDIENTES SALADOS
    //         // (Los dulces ya los creamos en la fase de Waffles: "crepa_dulce_base", etc.)
    //         const modifierGroups = [
    //             { id: "crepa_salada_base", name: "Paso 1: Carnes y Quesos" },
    //             { id: "crepa_salada_extra", name: "Paso 2: Extras Especiales" },
    //             { id: "crepa_salada_topping", name: "Paso 3: Aderezos (Gratis)" }
    //         ];

    //         // 3. INGREDIENTES SALADOS (Ejemplos listos para Multi-Sucursal)
    //         const modifiers = [
    //             // Bases (Suman a la regla matemática)
    //             { id: "cs_jamon", name: "Jamón", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_manchego", name: "Queso Manchego", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_philadelphia", name: "Queso philadelphia", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_oaxaca", name: "Queso Oaxaca", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_pechuga_pavo", name: "Pechuga de pavo", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_pepperoni", name: "Pepperoni", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_espinaca", name: "Espinacas", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_champiñones", name: "Champiñones", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_sala_prego", name: "Salsa prego", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_jamon_serrano", name: "Jamón serrano", price: 25, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_salami", name: "Salami", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_cabra", name: "Queso de cabra", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_piña_almibar", name: "Piña de almíbar", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_fajitas_pollo", name: "Fajitas de pollo", price: 25, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_rajas_crema", name: "Rajas con crema", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_aceitunas", name: "Aceitunas verdes", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_panela", name: "Queso panela", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_rajas", name: "Rajas", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_chipotle", name: "Chipotle", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_salsa_valentina", name: "Salsa valentina", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_salsa_bufalo", name: "Salsa búfalo", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_catsup", name: "Catsup", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_aderezo_mango_habanero", name: "Aderezo de mango habanero", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_bbq", name: "BBQ", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_salsa_tabasco", name: "Salsa tabasco", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    //             { id: "cs_aderezo_chipotle", name: "Aderezo chipotle", price: 0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },

                
    //             // Extras (Tienen su propio costo)
    //             // { id: "cs_ext_arrachera", name: "Arrachera", price: 35, group: "crepa_salada_extra", trackStock: true, disabledIn: [] },
                
    //             // Toppings / Aderezos (Gratis, y le apagamos el trackStock para que siempre salgan)
    //             // { id: "cs_top_chipotle", name: "Aderezo Chipotle", price: 0, group: "crepa_salada_topping", trackStock: false, disabledIn: [] },
    //             // { id: "cs_top_ranch", name: "Aderezo Ranch", price: 0, group: "crepa_salada_topping", trackStock: false, disabledIn: [] }
    //         ];

    //         // 4. CREPAS ESPECIALES (Precios Fijos)
    //         const items = [
    //             { id: "item_chiken_tender", name: "Chiken tender", category: "crepas", price: 100, disabledIn: [], branchPrices: {} },
    //             { id: "item_crepizza", name: "Creppizza", category: "crepas", price: 80, disabledIn: [], branchPrices: {} },
    //             { id: "item_suprema", name: "Suprema", category: "crepas", price: 80, disabledIn: [], branchPrices: {} },
    //             { id: "item_clasica", name: "Clásica", category: "crepas", price: 70, disabledIn: [], branchPrices: {} },
    //             { id: "item_italiana", name: "Italiana", category: "crepas", price: 90, disabledIn: [], branchPrices: {} },
    //             { id: "item_carnes_frias", name: "Carnes frías", category: "crepas", price: 120, disabledIn: [], branchPrices: {} },
    //             { id: "item_champiqueso", name: "Champiqueso", category: "crepas", price: 70, disabledIn: [], branchPrices: {} },
    //             { id: "item_española", name: "Española", category: "crepas", price: 120, disabledIn: [], branchPrices: {} },
    //             { id: "item_hawaiana", name: "Hawaiana", category: "crepas", price: 80, disabledIn: [], branchPrices: {} },
    //             { id: "item_rajas_crema", name: "Rajas con crema", category: "crepas", price: 100, disabledIn: [], branchPrices: {} },
    //             { id: "item_vegetariana", name: "Vegetariana", category: "crepas", price: 80, disabledIn: [], branchPrices: {} },
    //             { id: "item_tres_quesos", name: "Tres quesos", category: "crepas", price: 80, disabledIn: [], branchPrices: {} },
    //             { id: "item_frutos_rojos", name: "Frutos rojos", category: "crepas", price: 100, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_cajeta", name: "Dulce de cajeta", category: "crepas", price: 75, disabledIn: [], branchPrices: {} },
    //             { id: "item_strudel_manzana", name: "Strudel de manzana", category: "crepas", price: 100, disabledIn: [], branchPrices: {} },
    //             { id: "item_delicia_casa", name: "Delicia de la casa", category: "crepas", price: 75, disabledIn: [], branchPrices: {} },
    //             { id: "item_banana_caramel", name: "Banana caramel", category: "crepas", price: 75, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_tentacion", name: "Dulce tentación", category: "crepas", price: 70, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_tropical", name: "Dulce tropical", category: "crepas", price: 100, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_rompope", name: "Dulce de rompope", category: "crepas", price: 75, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_nutella", name: "Dulce nutella", category: "crepas", price: 75, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_platano", name: "Dulce de plátano", category: "crepas", price: 75, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_durazno", name: "Dulce de durazno", category: "crepas", price: 70, disabledIn: [], branchPrices: {} },
    //             { id: "item_dulce_fresa", name: "Dulce de fresa", category: "crepas", price: 70, disabledIn: [], branchPrices: {} },
               
    //         ];

    //         // 5. LOS BOTONES DE LA PANTALLA PRINCIPAL
    //         const groups = [
    //             // --- NIVEL 1: CARPETAS PRINCIPALES EN LA PANTALLA ---
    //             {
    //                 id: "crepas_dulces", 
    //                 name: "Crepas Dulces", 
    //                 level: 1, 
    //                 parent: "root",
    //                 // Metemos las crepas especiales dulces aquí
    //                 items_ref: ["item_dulce_fresa", "item_frutos_rojos", "item_dulce_cajeta",
    //                     "item_strudel_manzana", "item_delicia_casa", "item_banana_caramel",
    //                     "item_dulce_tentacion", "item_dulce_tropical", "item_dulce_rompope",
    //                     "item_dulce_nutella", "item_dulce_platano", "item_dulce_durazno"] 
    //             },
    //             {
    //                 id: "crepas_saladas", 
    //                 name: "Crepas Saladas", 
    //                 level: 1, 
    //                 parent: "root",
    //                 // Metemos las crepas especiales saladas aquí
    //                 items_ref: ["item_tres_quesos", "item_vegetariana", "item_rajas_crema", "item_hawaiana", "item_española", "item_champiqueso", "item_carnes_frias", "item_italiana", "item_clasica", "item_suprema", "item_crepizza", "item_chiken_tender"]
    //             },

    //             // --- NIVEL 2: BOTONES DE ARMAR (Adentro de sus respectivas carpetas) ---
    //             {
    //                 id: "armar_crepa_dulce", 
    //                 name: "Armar Crepa Dulce 🛠️", 
    //                 level: 2, 
    //                 parent: "crepas_dulces", // <--- Pertenece a la carpeta Dulces
    //                 rules_ref: "rule_crepa_dulce", 
    //                 base_group: "crepa_dulce_base", extra_groups: ["crepa_dulce_extra"], topping_groups: ["crepa_dulce_topping"]
    //             },
    //             {
    //                 id: "armar_crepa_salada", 
    //                 name: "Armar Crepa Salada 🛠️", 
    //                 level: 2, 
    //                 parent: "crepas_saladas", // <--- Pertenece a la carpeta Saladas
    //                 rules_ref: "rule_crepa_salada", 
    //                 base_group: "crepa_salada_base", extra_groups: ["crepa_salada_extra"], topping_groups: ["crepa_salada_topping"]
    //             }
    //         ];

    //         // 3. EJECUCIÓN
    //         for (const item of items) await setDoc(doc(db, "menu_items", item.id), item);
    //         for (const grp of groups) await setDoc(doc(db, "menu_groups", grp.id), grp);

    //         toast.success("¡Menú de Crepas reorganizado con éxito! 📁");
    //     } catch (e) {
    //         console.error(e);
    //         toast.error("Ocurrió un error en la migración.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const runMigration = async () => {
    //     setLoading(true);
    //     toast.info("Inyectando tus Postres Reales...");

    //     try {
    //         // 1. TUS POSTRES EXACTOS
    //         const items = [
    //             // Los de a $70
    //             { id: "item_fresas_crema", name: "Fresas con crema", category: "postres", price: 70, disabledIn: [], branchPrices: {} },
    //             { id: "item_duraznos_crema", name: "Duraznos con crema", category: "postres", price: 70, disabledIn: [], branchPrices: {} },
    //             { id: "item_frutos_rojos_crema", name: "Frutos rojos con crema", category: "postres", price: 70, disabledIn: [], branchPrices: {} },
    //             { id: "item_uvas_verdes_crema", name: "Uvas verdes con crema", category: "postres", price: 70, disabledIn: [], branchPrices: {} },
                
    //             // Los postres caseros
    //             { id: "item_flan_vainilla", name: "Flan de vainilla", category: "postres", price: 30, disabledIn: [], branchPrices: {} },
    //             { id: "item_arroz_leche", name: "Arroz con leche", category: "postres", price: 30, disabledIn: [], branchPrices: {} },
    //             { id: "item_pay_limon", name: "Pay de limón", category: "postres", price: 35, disabledIn: [], branchPrices: {} },
    //             { id: "item_flan_napolitano", name: "Flan napolitano", category: "postres", price: 35, disabledIn: [], branchPrices: {} }
    //         ];

    //         // 2. LA CARPETA DE POSTRES
    //         const grupoPostres = { 
    //             id: "postres", 
    //             name: "Postres", 
    //             level: 1, 
    //             parent: "root", 
    //             items_ref: [
    //                 "item_fresas_crema", "item_duraznos_crema", "item_frutos_rojos_crema", "item_uvas_verdes_crema",
    //                 "item_flan_vainilla", "item_arroz_leche", "item_pay_limon", "item_flan_napolitano"
    //             ] 
    //         };

    //         // Ejecución
    //         for (const item of items) await setDoc(doc(db, "menu_items", item.id), item);
    //         await setDoc(doc(db, "menu_groups", grupoPostres.id), grupoPostres);

    //         toast.success("¡Postres reales inyectados con éxito! 🍓🍮");
    //     } catch (e) {
    //         console.error(e);
    //         toast.error("Ocurrió un error en la migración.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const runMigration = async () => {
        setLoading(true);
        toast.info("Inyectando Reglas de Precio y vinculando...");

        try {
            // 1. LAS REGLAS MATEMÁTICAS (Ahora sí van a la base)
            const priceRules = [
                { 
                    id: "rule_crepa_dulce", 
                    name: "Regla Crepa Dulce", 
                    basePrices: [
                        { count: 1, price: 60 }, { count: 2, price: 70 }, 
                        { count: 3, price: 75 }, { count: 4, price: 85 }, 
                        { count: 5, price: 95 }, { count: 6, price: 105 }
                    ] 
                },
                { 
                    id: "rule_crepa_salada", 
                    name: "Regla Crepa Salada", 
                    basePrices: [
                        { count: 1, price: 60 }, { count: 2, price: 70 }, 
                        { count: 3, price: 80 }, { count: 4, price: 90 }, 
                        { count: 5, price: 100 }, { count: 6, price: 110 }
                    ] 
                },
                { 
                    id: "rule_waffles_hc", 
                    name: "Regla Waffles/HotCakes", 
                    basePrices: [
                        { count: 1, price: 60 }, { count: 2, price: 65 }, 
                        { count: 3, price: 70 }, { count: 4, price: 75 }, 
                        { count: 5, price: 80 }, { count: 6, price: 85 }
                    ] 
                }
            ];

            // 2. VINCULAMOS LOS BOTONES CON ESTAS REGLAS
            // (Aseguramos que los IDs coincidan exactamente con lo que el modal busca)
            const groups = [
                {
                    id: "armar_crepa_dulce", 
                    name: "Armar Crepa Dulce 🛠️", 
                    level: 2, 
                    parent: "crepas_dulces",
                    rules_ref: "rule_crepa_dulce", 
                    base_group: "crepa_dulce_base", 
                    extra_groups: ["crepa_dulce_extra"], 
                    topping_groups: ["crepa_dulce_topping"]
                },
                {
                    id: "armar_crepa_salada", 
                    name: "Armar Crepa Salada 🛠️", 
                    level: 2, 
                    parent: "crepas_saladas",
                    rules_ref: "rule_crepa_salada", 
                    base_group: "crepa_salada_base", 
                    extra_groups: ["crepa_salada_extra"], 
                    topping_groups: ["crepa_salada_topping"]
                },
                {
                    id: "waffles",
                    name: "Waffles",
                    level: 1,
                    parent: "root",
                    rules_ref: "rule_waffles_hc",
                    base_group: "crepa_dulce_base",
                    extra_groups: ["crepa_dulce_extra"],
                    topping_groups: ["crepa_dulce_topping"]
                }
            ];

            // Subimos las reglas
            for (const rule of priceRules) {
                await setDoc(doc(db, "price_rules", rule.id), rule);
            }

            // Actualizamos los grupos para que apunten a estas reglas
            for (const grp of groups) {
                await setDoc(doc(db, "menu_groups", grp.id), grp, { merge: true });
            }

            toast.success("¡Reglas de precio inyectadas y vinculadas! 🎉");
        } catch (e) {
            console.error(e);
            toast.error("Error al inyectar reglas.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="p-10 border-2 border-dashed border-info bg-info/10 rounded-xl max-w-xl mx-auto mt-10 text-center">
            <h2 className="text-2xl font-black text-info mb-4">Paso 1: Estructura Aplanada</h2>
            <p className="mb-4 opacity-75">Creará 8 botones directamente en tu pantalla principal de ventas.</p>
            <button onClick={runMigration} disabled={loading} className="btn btn-info w-full text-white">
                {loading ? "Creando..." : "Crear Pantalla Principal"}
            </button>
        </div>
    );
};