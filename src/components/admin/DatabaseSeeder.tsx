// src/components/admin/DatabaseSeeder.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
// import { GroupsManager } from './GroupsManager';

// ─────────────────────────────────────────────────────────────
//  Cada sección es una función async independiente
// ─────────────────────────────────────────────────────────────

async function seedRoot() {
    const groups = [
        {
            id: "root",
            name: "Menú Principal",
            level: 0,
            children: ["crepas_dulces", "crepas_saladas", "bebidas_calientes", "bebidas_frias", "hotcakes", "waffles", "mini_hotcakes", "postres"]
        },
        { id: "crepas_dulces",     name: "Crepas Dulces",     level: 1, parent: "root", children: [] },
        { id: "crepas_saladas",    name: "Crepas Saladas",    level: 1, parent: "root", children: [] },
        { id: "bebidas_calientes", name: "Bebidas Calientes", level: 1, parent: "root", items_ref: [] },
        { id: "bebidas_frias",     name: "Bebidas Frías",     level: 1, parent: "root", items_ref: [] },
        { id: "hotcakes",          name: "Hot Cakes",         level: 1, parent: "root", items_ref: [] },
        { id: "waffles",           name: "Waffles",           level: 1, parent: "root", items_ref: [] },
        { id: "mini_hotcakes",     name: "Mini Hot Cakes",    level: 1, parent: "root", items_ref: [] },
        { id: "postres",           name: "Postres Fijos",     level: 1, parent: "root", items_ref: [] },
    ];
    for (const g of groups) await setDoc(doc(db, "menu_groups", g.id), g);
}

async function seedBebidasCalientes() {
    const modifierGroups = [
        { id: "te_sabor",       name: "Sabor de Té" },
        { id: "tisanas_sabor",  name: "Sabor de Tisanas" },
        { id: "tipo_leche",     name: "Tipo de Leche" },
        { id: "topping_bebida", name: "Toppings para Bebida" },
    ];
    const modifiers = [
        { id: "te_manzanilla", name: "Té de Manzanilla",   price: 0, group: "te_sabor",       trackStock: true  },
        { id: "te_limon",      name: "Té Limón",           price: 0, group: "te_sabor",       trackStock: true  },
        { id: "te_verde",      name: "Té Verde",           price: 0, group: "te_sabor",       trackStock: true  },
        { id: "te_menta",      name: "Té Menta",           price: 0, group: "te_sabor",       trackStock: true  },
        { id: "leche_entera",  name: "Leche Entera",       price: 0, group: "tipo_leche",     trackStock: false },
        { id: "leche_deslac",  name: "Deslactosada",       price: 0, group: "tipo_leche",     trackStock: false },
        { id: "top_bombones",  name: "Bombones",           price: 0, group: "topping_bebida", trackStock: false },
    ];
    const items = [
        { id: "item_americano",       name: "Americano",        category: "bebidas", disabledIn: [], modifierGroups: [],                          variants: [{ name: "Chico", price: 30, branchPrices: { wa9igpvRpHkYpT7RPqgu: 35 } }, { name: "Mediano", price: 35, branchPrices: { wa9igpvRpHkYpT7RPqgu: 40 } }, { name: "Grande", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }] },
        { id: "item_capuchino",       name: "Capuchino",        category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 35, branchPrices: { wa9igpvRpHkYpT7RPqgu: 40 } }, { name: "Mediano", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Grande", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }] },
        { id: "item_latte",           name: "Latte",            category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Mediano", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }, { name: "Grande", price: 50, branchPrices: { wa9igpvRpHkYpT7RPqgu: 55 } }] },
        { id: "item_vainilla_latte",  name: "Vainilla latte",   category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Mediano", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }, { name: "Grande", price: 50, branchPrices: { wa9igpvRpHkYpT7RPqgu: 55 } }] },
        { id: "item_taro_latte",      name: "Taro latte",       category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Mediano", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }, { name: "Grande", price: 50, branchPrices: { wa9igpvRpHkYpT7RPqgu: 55 } }] },
        { id: "item_matcha_latte",    name: "Matcha latte",     category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Mediano", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }, { name: "Grande", price: 50, branchPrices: { wa9igpvRpHkYpT7RPqgu: 55 } }] },
        { id: "item_moka",            name: "Moka",             category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Mediano", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }, { name: "Grande", price: 50, branchPrices: { wa9igpvRpHkYpT7RPqgu: 55 } }] },
        { id: "item_chocolate",       name: "Chocolate",        category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 35, branchPrices: { wa9igpvRpHkYpT7RPqgu: 40 } }, { name: "Mediano", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Grande", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }] },
        { id: "item_chocolate_blanco",name: "Chocolate blanco", category: "bebidas", disabledIn: [], modifierGroups: ["tipo_leche","topping_bebida"], variants: [{ name: "Chico", price: 35, branchPrices: { wa9igpvRpHkYpT7RPqgu: 40 } }, { name: "Mediano", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 45 } }, { name: "Grande", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 50 } }] },
        { id: "item_te",              name: "Té",               category: "bebidas", disabledIn: [], modifierGroups: ["te_sabor"],                    variants: [{ name: "Chico", price: 35, branchPrices: { wa9igpvRpHkYpT7RPqgu: 30 } }, { name: "Mediano", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 35 } }, { name: "Grande", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 40 } }] },
        { id: "item_tisanas",         name: "Tisanas",          category: "bebidas", disabledIn: [], modifierGroups: ["tisanas_sabor"],               variants: [{ name: "Chico", price: 35, branchPrices: { wa9igpvRpHkYpT7RPqgu: 30 } }, { name: "Mediano", price: 40, branchPrices: { wa9igpvRpHkYpT7RPqgu: 35 } }, { name: "Grande", price: 45, branchPrices: { wa9igpvRpHkYpT7RPqgu: 40 } }] },
    ];
    const grupo = { id: "bebidas_calientes", name: "Bebidas Calientes", level: 1, parent: "root", items_ref: ["item_americano","item_capuchino","item_latte","item_vainilla_latte","item_taro_latte","item_matcha_latte","item_chocolate","item_chocolate_blanco","item_te","item_tisanas"] };
    for (const mg of modifierGroups) await setDoc(doc(db, "modifier_groups", mg.id), mg);
    for (const m of modifiers)      await setDoc(doc(db, "modifiers",        m.id),  m);
    for (const item of items)       await setDoc(doc(db, "menu_items",       item.id), item);
    await setDoc(doc(db, "menu_groups", grupo.id), grupo);
}

async function seedBebidasFrias() {
    const modifierGroups = [
        { id: "soda_sabor",      name: "Sabor de Soda"           },
        { id: "chamoy_sabor",    name: "Sabor de Chamoyada"      },
        { id: "malt_sen_sabor",  name: "Sabor Malteada Sencilla" },
        { id: "malt_esp_sabor",  name: "Sabor Malteada Especial" },
        { id: "frap_sen_sabor",  name: "Sabor Frappé Sencillo"   },
        { id: "frap_esp_sabor",  name: "Sabor Frappé Especial"   },
        { id: "bubble_sabor",    name: "Sabor de Tapioca (Boba)" },
        { id: "bubble_estilo",   name: "Estilo de Bebida"        },
        { id: "esquimo_sabor",   name: "Sabor de Esquimo"        },
        { id: "esquimo_esencia", name: "Essencias de esquimo"    },
    ];

    const modifiers = [
        { id: "sd_rojos",    name: "sd_Frutos rojos",       price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_mora",     name: "sd_Mora azul",          price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_manzana",  name: "sd_Manzana verde",      price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_cereza",   name: "sd_Cereza",             price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_maracuya", name: "sd_Maracuya",           price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_mango",    name: "sd_Mango",              price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_liche",    name: "sd_Liche",              price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_sandia",   name: "sd_Sandia",             price: 0, group: "soda_sabor",     trackStock: true  },
        { id: "sd_uva",      name: "sd_Uva",                price: 0, group: "soda_sabor",     trackStock: true  },

        { id: "cham_mango",         name: "Mango",         price: 0, group: "chamoy_sabor",   trackStock: false },
        { id: "cham_fresa",         name: "Fresa",         price: 0, group: "chamoy_sabor",   trackStock: false },
        { id: "cham_ice_cereza",    name: "Ice cereza",    price: 0, group: "chamoy_sabor",   trackStock: false },
        { id: "cham_ice_mora_azul", name: "Ice mora azul", price: 0, group: "chamoy_sabor",   trackStock: false },

        { id: "ms_fresa",         name: "Fresa",           price: 0, group: "malt_sen_sabor", trackStock: false },
        { id: "ms_vainilla",      name: "Vainilla",        price: 0, group: "malt_sen_sabor", trackStock: false },
        { id: "ms_chocolate",     name: "Chocolate",       price: 0, group: "malt_sen_sabor", trackStock: false },
        { id: "ms_cookies_cream", name: "Cookies & Cream", price: 0, group: "malt_sen_sabor", trackStock: false },

        { id: "fs_taro",              name: "Taro",              price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_capuchino",         name: "Capuchino",         price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_rompompe",          name: "Rompompe",          price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_moka",              name: "Moka",              price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_matcha",            name: "Matcha",            price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_galleta_oreo",      name: "Galleta oreo",      price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_mazapan",           name: "Mazapan",           price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_caramelo",          name: "Caramelo",          price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_horchata",          name: "Horchata",          price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_coco",              name: "Coco",              price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_fresas_crema",      name: "Fresas con crema",  price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_cajeta",            name: "Cajeta",            price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_vainilla_francesa", name: "Vainilla francesa", price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_chicle",            name: "Chicle",            price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_chocolate_blanco",  name: "Chocolate blanco",  price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_chocolate_oscuro",  name: "Chocolate oscuro",  price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_cafe",              name: "Café",              price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_yogurt_fresa",      name: "Yogurt de fresa",   price: 0, group: "frap_sen_sabor", trackStock: false },
        { id: "fs_pistache",          name: "Pistache",          price: 0, group: "frap_sen_sabor", trackStock: false },

        { id: "me_mazapan",     name: "Mazapán",        price: 0, group: "malt_esp_sabor", trackStock: false },
        { id: "me_rompope",     name: "Rompope",        price: 0, group: "malt_esp_sabor", trackStock: false },
        { id: "me_dulce_leche", name: "Dulce de leche", price: 0, group: "malt_esp_sabor", trackStock: false },

        { id: "fe_pay_limon", name: "Pay de limón", price: 0, group: "frap_esp_sabor", trackStock: false },
        { id: "fe_baileys",   name: "Baileys",      price: 0, group: "frap_esp_sabor", trackStock: false },
        { id: "fe_nutella",   name: "Nutella",      price: 0, group: "frap_esp_sabor", trackStock: false },
        { id: "fe_kahlua",    name: "Kahlua",       price: 0, group: "frap_esp_sabor", trackStock: false },

        { id: "bt_taro",            name: "Taro",            price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_horchavainilla",  name: "Horchavainilla",  price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_chai",            name: "Chai",            price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_matcha",          name: "Matcha",          price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_mazapan",         name: "Mazapan",         price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_strawberry",      name: "Strawberry",      price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_dulce_leche",     name: "Dulce de leche",  price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_cookies_cream",   name: "Cookies & cream", price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_coffe_chocolate", name: "Coffe chocolate", price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_horchata_tea",    name: "Horchata tea",    price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_moka",            name: "Moka",            price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_gum",             name: "Gum",             price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_caramel",         name: "Caramel",         price: 0, group: "bubble_sabor",   trackStock: false },
        { id: "bt_est_frappe",      name: "En Frappé",       price: 0, group: "bubble_estilo",  trackStock: false },
        { id: "bt_est_latte",       name: "En Latte Frío",   price: 0, group: "bubble_estilo",  trackStock: false },

        { id: "em_fresa",   name: "Fresa",   price: 0, group: "esquimo_sabor", trackStock: false },
        { id: "em_platano", name: "Plátano", price: 0, group: "esquimo_sabor", trackStock: false },

        { id: "em_es_vainilla",  name: "Vainilla",        price: 0, group: "esquimo_esencia", trackStock: false},
        { id: "em_es_chocolate", name: "Chocolate",       price: 0, group: "esquimo_esencia", trackStock: false},
        { id: "em_es_pistache",  name: "Pistache",        price: 0, group: "esquimo_esencia", trackStock: false},
        { id: "em_es_irlandesa", name: "Crema irlandesa", price: 0, group: "esquimo_esencia", trackStock: false},
        { id: "em_es_cafe",      name: "Café",            price: 0, group: "esquimo_esencia", trackStock: false},
    ];

    const items = [
        { id: "item_soda",       name: "Soda Italiana",     category: "bebidas", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 }, modifierGroups: ["soda_sabor"]                   },
        { id: "item_chamoyada",  name: "Chamoyada / ICEE",  category: "bebidas", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 }, modifierGroups: ["chamoy_sabor"]                 },
        { id: "item_malt_sen",   name: "Malteada Sencilla", category: "bebidas", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 }, modifierGroups: ["malt_sen_sabor", "tipo_leche"]               },
        { id: "item_malt_esp",   name: "Malteada Especial", category: "bebidas", price: 90, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":90, "wa9igpvRpHkYpT7RPqgu":95 }, modifierGroups: ["malt_esp_sabor", "tipo_leche"]               },
        { id: "item_frap_sen",   name: "Frappé Sencillo",   category: "bebidas", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 }, modifierGroups: ["frap_sen_sabor", "tipo_leche"]               },
        { id: "item_frap_esp",   name: "Frappé Especial",   category: "bebidas", price: 90, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":90, "wa9igpvRpHkYpT7RPqgu":95 }, modifierGroups: ["frap_esp_sabor", "tipo_leche"]               },
        { id: "item_bubble_tea", name: "Bubble Tea",        category: "bebidas", price: 95, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":95, "wa9igpvRpHkYpT7RPqgu":100 }, modifierGroups: ["bubble_sabor","bubble_estilo"] },
        { id: "item_esquimo",    name: "Esquimo",           category: "bebidas", price: 60, disabledIn: ["ZH1qzEPpDlDgWu8168th"], branchPrices: {}, modifierGroups: ["esquimo_sabor","esquimo_esencia","tipo_leche"] },
    ];
    const grupo = { id: "bebidas_frias", name: "Bebidas Frías", level: 1, parent: "root", items_ref: ["item_soda","item_chamoyada","item_malt_sen","item_malt_esp","item_frap_sen","item_frap_esp","item_bubble_tea", "item_esquimo"] };
    for (const mg of modifierGroups) await setDoc(doc(db, "modifier_groups", mg.id), mg);
    for (const m of modifiers)       await setDoc(doc(db, "modifiers",        m.id),  m);
    for (const item of items)        await setDoc(doc(db, "menu_items",       item.id), item);
    await setDoc(doc(db, "menu_groups", grupo.id), grupo);
}

async function seedWafflesHotcakes() {
    const modifierGroups = [
        { id: "crepa_dulce_base",    name: "Ingredientes Base"   },
        { id: "crepa_dulce_extra",   name: "Extras (Con Costo)"  },
        { id: "crepa_dulce_topping", name: "Cortesías (Gratis)"  },
    ];
    const modifiers = [
        { id: "mod_nutella",              name: "Nutella",                price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_q_philadelphia",       name: "Queso philadelphia",     price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_rompope",              name: "Rompope",                price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_cajeta",               name: "Cajeta",                 price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_crema_cacahuate",      name: "Crema de cacahuate",     price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_mermelada_fresa",      name: "Mermelada de fresa",     price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_mermelada_zarzamora",  name: "Mermelada de zarzamora", price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_maple",                name: "Maple",                  price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_galleta_oreo",         name: "Galleta oreo",           price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_galleta_chokis",       name: "Galleta chokis",         price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_lechera",              name: "Lechera",                price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_nuez",                 name: "Nuez",                   price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_chocolate_hersheys",   name: "Chocolate hershey's",    price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_crema_batida",         name: "Crema batida",           price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_chantilly",            name: "Chantilly",              price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_fresa",                name: "Fresa",                  price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_durazno_almibar",      name: "Duraznos en almíbar",    price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_manzana_verde",        name: "Manzana verde",          price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_platano",              name: "Plátano",                price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_mango",                name: "Mango",                  price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_zarzamora",            name: "Zarzamora",              price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_cereza_almibar",       name: "Cereza en almíbar",      price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_blueberry",            name: "Blueberry",              price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_frambuesa",            name: "Frambueza",              price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_uva_verde",            name: "Uva verde",              price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        { id: "mod_kiwi",                 name: "Kiwi",                   price:  0, group: "crepa_dulce_base",  trackStock: false, disabledIn: [] },
        
        { id: "mod_ext_ksorpresa",        name: "Kinder Sorpresa",        price: 30, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":30, "wa9igpvRpHkYpT7RPqgu":35 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_kdelice",          name: "Kinder Delice",          price: 15, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":15, "wa9igpvRpHkYpT7RPqgu":203 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_kchocolate",       name: "Kinder Chocolate",       price: 10, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":10, "wa9igpvRpHkYpT7RPqgu":15 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_kbueno",           name: "Kinder Bueno",           price: 30, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":30, "wa9igpvRpHkYpT7RPqgu":35 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_kitkat",           name: "Kitkat",                 price: 30, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":30, "wa9igpvRpHkYpT7RPqgu":35 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_hersheys_blanco",  name: "Hershey's blanco",       price: 10, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":10, "wa9igpvRpHkYpT7RPqgu":15 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_mini_conejo_turin",name: "Mini conejo",            price: 10, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":10, "wa9igpvRpHkYpT7RPqgu":15 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_helado",           name: "Bola de helado",         price: 10, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":10, "wa9igpvRpHkYpT7RPqgu":15 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_baileys",          name: "Baileys",                price: 30, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":30, "wa9igpvRpHkYpT7RPqgu":35 }, trackStock: true,  disabledIn: [] },
        { id: "mod_ext_kahlua",           name: "Kahlua",                 price: 30, group: "crepa_dulce_extra", branchPrices: { "ZH1qzEPpDlDgWu8168th":30, "wa9igpvRpHkYpT7RPqgu":35 }, trackStock: true,  disabledIn: [] },
        
        { id: "top_lechera",  name: "Lechera",            price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] },
        { id: "top_chispas",  name: "Chispas de colores", price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] },
        { id: "top_hersheys", name: "Chocolate hershey's",price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] },
        { id: "top_nuez",     name: "Nuez",               price: 0, group: "crepa_dulce_topping", trackStock: false, disabledIn: [] },
    ];
    const groups = [
        { id: "waffles",      name: "Waffles",      level: 1, parent: "root", rules_ref: "rule_waffles_hc", base_group: "crepa_dulce_base", extra_groups: ["crepa_dulce_extra"], topping_groups: ["crepa_dulce_topping"] },
        { id: "hotcakes",     name: "Hot Cakes",    level: 1, parent: "root", rules_ref: "rule_waffles_hc", base_group: "crepa_dulce_base", extra_groups: ["crepa_dulce_extra"], topping_groups: ["crepa_dulce_topping"] },
        { id: "mini_hotcakes",name: "Mini Hot Cakes",level:1, parent: "root", rules_ref: "rule_waffles_hc", base_group: "crepa_dulce_base", extra_groups: ["crepa_dulce_extra"], topping_groups: ["crepa_dulce_topping"] },
    ];
    for (const mg of modifierGroups) await setDoc(doc(db, "modifier_groups", mg.id), mg);
    for (const mod of modifiers)     await setDoc(doc(db, "modifiers",        mod.id), mod);
    for (const grp of groups)        await setDoc(doc(db, "menu_groups",       grp.id), grp);
}

async function seedCrepas() {
    const modifierGroups = [
        { id: "crepa_salada_base",    name: "Ingredientes Base"     },
        { id: "crepa_salada_extra",   name: "Extras (Con Costo)"   },
        { id: "crepa_salada_topping", name: "Cortesías (Gratis)"   },
    ];
    const modifiers = [
        { id: "cs_jamon",                name: "Jamón",                     price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_manchego",             name: "Queso Manchego",            price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_philadelphia",         name: "Queso philadelphia",        price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_oaxaca",               name: "Queso Oaxaca",              price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_pechuga_pavo",         name: "Pechuga de pavo",           price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_pepperoni",            name: "Pepperoni",                 price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_espinaca",             name: "Espinacas",                 price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_champiñones",          name: "Champiñones",               price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_sala_prego",           name: "Salsa prego",               price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_jamon_serrano",        name: "Jamón serrano",             price: 25, group: "crepa_salada_base", trackStock: false, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":25, "wa9igpvRpHkYpT7RPqgu":30 } },
        { id: "cs_salami",               name: "Salami",                    price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_cabra",                name: "Queso de cabra",            price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_piña_almibar",         name: "Piña de almíbar",           price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_fajitas_pollo",        name: "Fajitas de pollo",          price: 25, group: "crepa_salada_base", trackStock: false, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":25, "wa9igpvRpHkYpT7RPqgu":30 } },
        { id: "cs_rajas_crema",          name: "Rajas con crema",           price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_aceitunas",            name: "Aceitunas verdes",          price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_panela",               name: "Queso panela",              price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_rajas",                name: "Rajas",                     price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_chipotle",             name: "Chipotle",                  price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_salsa_valentina",      name: "Salsa valentina",           price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_salsa_bufalo",         name: "Salsa búfalo",              price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_catsup",               name: "Catsup",                    price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_aderezo_mango_habanero",name:"Aderezo de mango habanero", price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_bbq",                  name: "BBQ",                       price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_salsa_tabasco",        name: "Salsa tabasco",             price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
        { id: "cs_aderezo_chipotle",     name: "Aderezo chipotle",          price:  0, group: "crepa_salada_base", trackStock: false, disabledIn: [] },
    ];

    const items = [
        { id: "item_chiken_tender",    name: "Chiken tender",       category: "crepas", price: 100, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":100, "wa9igpvRpHkYpT7RPqgu":105 } },
        { id: "item_crepizza",         name: "Creppizza",           category: "crepas", price:  80, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 80, "wa9igpvRpHkYpT7RPqgu": 85 } },
        { id: "item_suprema",          name: "Suprema",             category: "crepas", price:  80, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 80, "wa9igpvRpHkYpT7RPqgu": 85 } },
        { id: "item_clasica",          name: "Clásica",             category: "crepas", price:  70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 70, "wa9igpvRpHkYpT7RPqgu": 75 } },
        { id: "item_italiana",         name: "Italiana",            category: "crepas", price:  90, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 90, "wa9igpvRpHkYpT7RPqgu": 95 } },
        { id: "item_carnes_frias",     name: "Carnes frías",        category: "crepas", price: 120, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":120, "wa9igpvRpHkYpT7RPqgu":125 } },
        { id: "item_champiqueso",      name: "Champiqueso",         category: "crepas", price:  70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 70, "wa9igpvRpHkYpT7RPqgu": 75 } },
        { id: "item_española",         name: "Española",            category: "crepas", price: 120, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":120, "wa9igpvRpHkYpT7RPqgu":125 } },
        { id: "item_hawaiana",         name: "Hawaiana",            category: "crepas", price:  80, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 80, "wa9igpvRpHkYpT7RPqgu": 85 } },
        { id: "item_rajas_crema",      name: "Rajas con crema",     category: "crepas", price: 100, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":100, "wa9igpvRpHkYpT7RPqgu":105 } },
        { id: "item_vegetariana",      name: "Vegetariana",         category: "crepas", price:  80, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 80, "wa9igpvRpHkYpT7RPqgu": 85 } },
        { id: "item_tres_quesos",      name: "Tres quesos",         category: "crepas", price:  80, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 80, "wa9igpvRpHkYpT7RPqgu": 85 } },
        { id: "item_frutos_rojos",     name: "Frutos rojos",        category: "crepas", price: 100, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":100, "wa9igpvRpHkYpT7RPqgu":105 } },
        { id: "item_dulce_cajeta",     name: "Dulce de cajeta",     category: "crepas", price:  75, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 75, "wa9igpvRpHkYpT7RPqgu": 80 } },
        { id: "item_strudel_manzana",  name: "Strudel de manzana",  category: "crepas", price: 100, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":100, "wa9igpvRpHkYpT7RPqgu":105 } },
        { id: "item_delicia_casa",     name: "Delicia de la casa",  category: "crepas", price:  75, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 75, "wa9igpvRpHkYpT7RPqgu": 80 } },
        { id: "item_banana_caramel",   name: "Banana caramel",      category: "crepas", price:  75, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 75, "wa9igpvRpHkYpT7RPqgu": 80 } },
        { id: "item_dulce_tentacion",  name: "Dulce tentación",     category: "crepas", price:  70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 70, "wa9igpvRpHkYpT7RPqgu": 75 } },
        { id: "item_dulce_tropical",   name: "Dulce tropical",      category: "crepas", price: 100, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":100, "wa9igpvRpHkYpT7RPqgu":105 } },
        { id: "item_dulce_rompope",    name: "Dulce de rompope",    category: "crepas", price:  75, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 75, "wa9igpvRpHkYpT7RPqgu": 80 } },
        { id: "item_dulce_nutella",    name: "Dulce nutella",       category: "crepas", price:  75, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 75, "wa9igpvRpHkYpT7RPqgu": 80 } },
        { id: "item_dulce_platano",    name: "Dulce de plátano",    category: "crepas", price:  75, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 75, "wa9igpvRpHkYpT7RPqgu": 80 } },
        { id: "item_dulce_durazno",    name: "Dulce de durazno",    category: "crepas", price:  70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 70, "wa9igpvRpHkYpT7RPqgu": 75 } },
        { id: "item_dulce_fresa",      name: "Dulce de fresa",      category: "crepas", price:  70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th": 70, "wa9igpvRpHkYpT7RPqgu": 75 } },
    ];
    const groups = [
        {
            id: "crepas_dulces", name: "Crepas Dulces", level: 1, parent: "root",
            items_ref: ["item_dulce_fresa","item_frutos_rojos","item_dulce_cajeta","item_strudel_manzana","item_delicia_casa","item_banana_caramel","item_dulce_tentacion","item_dulce_tropical","item_dulce_rompope","item_dulce_nutella","item_dulce_platano","item_dulce_durazno"]
        },
        {
            id: "crepas_saladas", name: "Crepas Saladas", level: 1, parent: "root",
            items_ref: ["item_tres_quesos","item_vegetariana","item_rajas_crema","item_hawaiana","item_española","item_champiqueso","item_carnes_frias","item_italiana","item_clasica","item_suprema","item_crepizza","item_chiken_tender"]
        },
        { id: "armar_crepa_dulce",  name: "Armar Crepa Dulce 🛠️",  level: 2, parent: "crepas_dulces",  rules_ref: "rule_crepa_dulce",  base_group: "crepa_dulce_base",  extra_groups: ["crepa_dulce_extra"],  topping_groups: ["crepa_dulce_topping"] },
        { id: "armar_crepa_salada", name: "Armar Crepa Salada 🛠️", level: 2, parent: "crepas_saladas", rules_ref: "rule_crepa_salada", base_group: "crepa_salada_base", extra_groups: ["crepa_salada_extra"], topping_groups: ["crepa_salada_topping"] },
    ];
    for (const mg of modifierGroups) await setDoc(doc(db, "modifier_groups", mg.id), mg);
    for (const mod of modifiers)     await setDoc(doc(db, "modifiers",        mod.id), mod);
    for (const item of items)        await setDoc(doc(db, "menu_items",       item.id), item);
    for (const grp of groups)        await setDoc(doc(db, "menu_groups",       grp.id), grp);
}

async function seedPostres() {
    const items = [
        { id: "item_fresas_crema",       name: "Fresas con crema",       category: "postres", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 } },
        { id: "item_duraznos_crema",     name: "Duraznos con crema",     category: "postres", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 } },
        { id: "item_frutos_rojos_crema", name: "Frutos rojos con crema", category: "postres", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 } },
        { id: "item_uvas_verdes_crema",  name: "Uvas verdes con crema",  category: "postres", price: 70, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":70, "wa9igpvRpHkYpT7RPqgu":75 } },
        { id: "item_flan_vainilla",      name: "Flan de vainilla",       category: "postres", price: 30, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":30, "wa9igpvRpHkYpT7RPqgu":35 } },
        { id: "item_arroz_leche",        name: "Arroz con leche",        category: "postres", price: 30, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":30, "wa9igpvRpHkYpT7RPqgu":35 } },
        { id: "item_pay_limon",          name: "Pay de limón",           category: "postres", price: 35, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":35, "wa9igpvRpHkYpT7RPqgu":40 } },
        { id: "item_tapioca",            name: "Tapioca",                category: "postres", price: 35, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":35, "wa9igpvRpHkYpT7RPqgu":40 } },
        { id: "item_flan_napolitano",    name: "Flan napolitano",        category: "postres", price: 35, disabledIn: [], branchPrices: { "ZH1qzEPpDlDgWu8168th":35, "wa9igpvRpHkYpT7RPqgu":40 } },
    ];
    const grupo = {
        id: "postres", name: "Postres", level: 1, parent: "root",
        items_ref: ["item_fresas_crema","item_duraznos_crema","item_frutos_rojos_crema","item_uvas_verdes_crema","item_flan_vainilla","item_arroz_leche","item_pay_limon","item_flan_napolitano","item_tapioca"]
    };
    for (const item of items) await setDoc(doc(db, "menu_items", item.id), item);
    await setDoc(doc(db, "menu_groups", grupo.id), grupo);
}

async function seedPriceRules() {
    // branchPrices: { [sucursalId]: precio } — sobrescribe el precio base para esa sucursal.
    // El motor en CustomizeCrepeModal ya lee bp.branchPrices?.[activeBranchId] ?? bp.price
    const priceRules = [
        {
            id: "rule_crepa_dulce",
            name: "Regla Crepa Dulce",
            basePrices: [
                { count: 1, price: 60,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 60,  "wa9igpvRpHkYpT7RPqgu": 65  } },
                { count: 2, price: 70,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 70,  "wa9igpvRpHkYpT7RPqgu": 75  } },
                { count: 3, price: 75,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 75,  "wa9igpvRpHkYpT7RPqgu": 80  } },
                { count: 4, price: 85,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 85,  "wa9igpvRpHkYpT7RPqgu": 90  } },
                { count: 5, price: 95,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 95,  "wa9igpvRpHkYpT7RPqgu": 100 } },
                { count: 6, price: 105, branchPrices: { "ZH1qzEPpDlDgWu8168th": 105, "wa9igpvRpHkYpT7RPqgu": 110 } },
            ]
        },
        {
            id: "rule_crepa_salada",
            name: "Regla Crepa Salada",
            basePrices: [
                { count: 1, price: 60,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 60,  "wa9igpvRpHkYpT7RPqgu": 65  } },
                { count: 2, price: 70,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 70,  "wa9igpvRpHkYpT7RPqgu": 75  } },
                { count: 3, price: 80,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 80,  "wa9igpvRpHkYpT7RPqgu": 85  } },
                { count: 4, price: 90,  branchPrices: { "ZH1qzEPpDlDgWu8168th": 90,  "wa9igpvRpHkYpT7RPqgu": 95  } },
                { count: 5, price: 100, branchPrices: { "ZH1qzEPpDlDgWu8168th": 100, "wa9igpvRpHkYpT7RPqgu": 105 } },
                { count: 6, price: 110, branchPrices: { "ZH1qzEPpDlDgWu8168th": 110, "wa9igpvRpHkYpT7RPqgu": 115 } },
            ]
        },
        {
            id: "rule_waffles_hc",
            name: "Regla Waffles/HotCakes",
            basePrices: [
                { count: 1, price: 60, branchPrices: { "ZH1qzEPpDlDgWu8168th": 60, "wa9igpvRpHkYpT7RPqgu": 65 } },
                { count: 2, price: 65, branchPrices: { "ZH1qzEPpDlDgWu8168th": 65, "wa9igpvRpHkYpT7RPqgu": 70 } },
                { count: 3, price: 70, branchPrices: { "ZH1qzEPpDlDgWu8168th": 70, "wa9igpvRpHkYpT7RPqgu": 75 } },
                { count: 4, price: 75, branchPrices: { "ZH1qzEPpDlDgWu8168th": 75, "wa9igpvRpHkYpT7RPqgu": 80 } },
                { count: 5, price: 80, branchPrices: { "ZH1qzEPpDlDgWu8168th": 80, "wa9igpvRpHkYpT7RPqgu": 85 } },
                { count: 6, price: 85, branchPrices: { "ZH1qzEPpDlDgWu8168th": 85, "wa9igpvRpHkYpT7RPqgu": 90 } },
            ]
        },
    ];
    for (const rule of priceRules) await setDoc(doc(db, "price_rules", rule.id), rule);
}

// ─────────────────────────────────────────────────────────────
//  Las secciones del menú para mostrar botones individuales
// ─────────────────────────────────────────────────────────────
const SECTIONS = [
    { key: "root",              label: "🏠 Estructura Raíz (8 categorías)", fn: seedRoot              },
    { key: "bebidas_calientes", label: "☕ Bebidas Calientes",              fn: seedBebidasCalientes  },
    { key: "bebidas_frias",     label: "🧋 Bebidas Frías & Bubble Tea",     fn: seedBebidasFrias      },
    { key: "waffles_hotcakes",  label: "🧇 Waffles & Hot Cakes",            fn: seedWafflesHotcakes   },
    { key: "crepas",            label: "🥐 Crepas Dulces & Saladas",        fn: seedCrepas            },
    { key: "postres",           label: "🍓 Postres",                        fn: seedPostres           },
    { key: "price_rules",       label: "📐 Reglas de Precio",               fn: seedPriceRules        },
];

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────
export const DatabaseSeeder: React.FC = () => {
    const [loading, setLoading] = useState<string | null>(null);

    const runSection = async (key: string, label: string, fn: () => Promise<void>) => {
        setLoading(key);
        toast.info(`Inyectando: ${label}...`);
        try {
            await fn();
            toast.success(`✅ ${label} — ¡listo!`);
        } catch (e) {
            console.error(e);
            toast.error(`❌ Error en: ${label}`);
        } finally {
            setLoading(null);
        }
    };

    const runAll = async () => {
        setLoading("all");
        toast.info("🚀 Inyectando TODO el menú...");
        try {
            for (const s of SECTIONS) {
                toast.info(`  ⏳ ${s.label}`);
                await s.fn();
            }
            toast.success("🎉 ¡Todo el menú inyectado con éxito!");
        } catch (e) {
            console.error(e);
            toast.error("❌ Error durante la inyección completa.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="p-8 border-2 border-dashed border-info bg-info/10 rounded-xl max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-black text-info mb-1">Database Seeder</h2>
            <p className="mb-6 opacity-70 text-sm">
                Inyecta cada sección por separado, o presiona <strong>Todo de un jalón</strong> para correr todas en secuencia.
            </p>

            {/* Botón "todo de un jalón" */}
            <button
                onClick={runAll}
                disabled={loading !== null}
                className="btn btn-info w-full text-white mb-6 text-lg"
            >
                {loading === "all" ? "⏳ Inyectando todo..." : "🚀 Inyectar TODO el menú"}
            </button>

            <div className="divider text-xs opacity-50">o sección por sección</div>

            {/* Botones individuales */}
            <div className="flex flex-col gap-3 mt-4">
                {SECTIONS.map((s) => (
                    <button
                        key={s.key}
                        onClick={() => runSection(s.key, s.label, s.fn)}
                        disabled={loading !== null}
                        className="btn btn-outline btn-info w-full"
                    >
                        {loading === s.key ? `⏳ ${s.label}...` : s.label}
                    </button>
                ))}
            </div>
        </div>
    );
};