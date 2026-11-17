// src/components/admin/seedInventory.ts
// Insumos y recetas con GRAMAJES ESTIMADOS (porciones típicas de cafetería/creperia).
// Son un punto de partida para QA: ajustarlos con lo que realmente se sirve.
// Corre después del menú: agrega `recipe` a opciones, productos y categorías existentes.
import { collection, doc, getDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import type { RecipeLine, Supply, SupplyUnit } from '../../types/inventory';

// --- INSUMOS ---
const supplies: Supply[] = [];
const sup = (id: string, name: string, unit: SupplyUnit) => {
    supplies.push({ id: `sup_${id}`, name, unit });
    return `sup_${id}`;
};

// Recetas: [insumo, cantidad en g / ml / pza]
type Line = [string, number];
const r = (...lines: Line[]): RecipeLine[] => lines.map(([supplyId, qty]) => ({ supplyId, qty }));

// Bases y empaques
const MASA_CREPA = sup('masa_crepa', 'Masa para crepa', 'kg');
const MEZCLA_HC = sup('mezcla_hotcake', 'Harina para hot cakes y waffles', 'kg');
const LECHE = sup('leche_entera', 'Leche entera', 'L');
const LECHE_DESLAC = sup('leche_deslactosada', 'Leche deslactosada', 'L');
const CAFE = sup('cafe_grano', 'Café en grano', 'kg');
const VASO_8 = sup('vaso_8', 'Vaso caliente 8 oz', 'pza');
const VASO_12 = sup('vaso_12', 'Vaso caliente 12 oz', 'pza');
const VASO_16 = sup('vaso_16', 'Vaso caliente 16 oz', 'pza');
const VASO_FRIO = sup('vaso_frio_16', 'Vaso frío 16 oz con domo', 'pza');
const POPOTE = sup('popote', 'Popote', 'pza');
const POPOTE_BUBBLE = sup('popote_bubble', 'Popote grueso (bubble)', 'pza');
const HELADO = sup('helado_vainilla', 'Helado de vainilla', 'kg');
const BASE_FRAPPE = sup('base_frappe', 'Base neutra para frappé', 'kg');
const PERLAS = sup('perlas_tapioca', 'Perlas de tapioca', 'kg');
const AGUA_MINERAL = sup('agua_mineral', 'Agua mineral', 'L');
const CHAMOY = sup('chamoy', 'Chamoy líquido', 'L');
const CREMA_FRESAS = sup('crema_fresas', 'Crema para fresas', 'kg');
const CHAROLA = sup('charola', 'Charola / plato desechable', 'pza');

// Untables y dulces
const NUTELLA = sup('nutella', 'Nutella', 'kg');
const PHILADELPHIA = sup('philadelphia', 'Queso philadelphia', 'kg');
const ROMPOPE = sup('rompope', 'Rompope', 'L');
const CAJETA = sup('cajeta', 'Cajeta', 'kg');
const CREMA_CACAHUATE = sup('crema_cacahuate', 'Crema de cacahuate', 'kg');
const MERM_FRESA = sup('mermelada_fresa', 'Mermelada de fresa', 'kg');
const MERM_ZARZA = sup('mermelada_zarzamora', 'Mermelada de zarzamora', 'kg');
const MAPLE = sup('maple', 'Maple', 'L');
const OREO = sup('galleta_oreo', 'Galleta Oreo', 'kg');
const CHOKIS = sup('galleta_chokis', 'Galleta Chokis', 'kg');
const LECHERA = sup('lechera', 'Lechera', 'kg');
const NUEZ = sup('nuez', 'Nuez', 'kg');
const JARABE_CHOCO = sup('jarabe_chocolate', 'Jarabe de chocolate Hershey\'s', 'L');
const CREMA_BATIDA = sup('crema_batida', 'Crema batida', 'kg');
const CHANTILLY = sup('chantilly', 'Chantilly', 'kg');
const ALMENDRA = sup('almendra', 'Almendra', 'kg');
const CACAHUATE = sup('cacahuate', 'Cacahuate', 'kg');
const BOMBONES = sup('bombones', 'Bombones', 'kg');
const KRANKYS = sup('krankys', 'Krankys', 'kg');
const CHOCORETAS = sup('chocoretas', 'Chocoretas', 'kg');
const CHISPAS = sup('chispas', 'Chispas de colores', 'kg');

// Fruta
const FRESA = sup('fresa', 'Fresa', 'kg');
const DURAZNO = sup('durazno_almibar', 'Durazno en almíbar', 'kg');
const MANZANA = sup('manzana_verde', 'Manzana verde', 'kg');
const PLATANO = sup('platano', 'Plátano', 'kg');
const MANGO = sup('mango', 'Mango', 'kg');
const ZARZAMORA = sup('zarzamora', 'Zarzamora', 'kg');
const CEREZA = sup('cereza_almibar', 'Cereza en almíbar', 'kg');
const BLUEBERRY = sup('blueberry', 'Blueberry', 'kg');
const FRAMBUESA = sup('frambuesa', 'Frambuesa', 'kg');
const UVA = sup('uva_verde', 'Uva verde', 'kg');
const KIWI = sup('kiwi', 'Kiwi', 'kg');
const PINA = sup('pina_almibar', 'Piña en almíbar', 'kg');

// Chocolates en pieza y licores
const K_SORPRESA = sup('kinder_sorpresa', 'Kinder Sorpresa', 'pza');
const K_DELICE = sup('kinder_delice', 'Kinder Delice', 'pza');
const K_CHOCOLATE = sup('kinder_chocolate', 'Kinder Chocolate (barrita)', 'pza');
const K_BUENO = sup('kinder_bueno', 'Kinder Bueno', 'pza');
const KITKAT = sup('kitkat', 'KitKat', 'pza');
const HERSHEYS_BLANCO = sup('hersheys_blanco', 'Hershey\'s blanco', 'pza');
const CONEJO = sup('mini_conejo_turin', 'Mini conejo Turín', 'pza');
const BAILEYS = sup('baileys', 'Baileys', 'L');
const KAHLUA = sup('kahlua', 'Kahlua', 'L');

// Salado
const MANCHEGO = sup('manchego', 'Queso manchego', 'kg');
const OAXACA = sup('oaxaca', 'Queso Oaxaca', 'kg');
const PAVO = sup('pechuga_pavo', 'Pechuga de pavo', 'kg');
const PEPPERONI = sup('pepperoni', 'Pepperoni', 'kg');
const ESPINACA = sup('espinaca', 'Espinaca', 'kg');
const CHAMPINON = sup('champinon', 'Champiñón', 'kg');
const PREGO = sup('salsa_prego', 'Salsa prego', 'kg');
const SERRANO = sup('jamon_serrano', 'Jamón serrano', 'kg');
const SALAMI = sup('salami', 'Salami', 'kg');
const CABRA = sup('queso_cabra', 'Queso de cabra', 'kg');
const POLLO = sup('pollo_fajitas', 'Pollo en fajitas', 'kg');
const POLLO_TENDER = sup('pollo_tender', 'Pollo tender empanizado', 'kg');
const RAJAS_CREMA = sup('rajas_crema', 'Rajas con crema', 'kg');
const ACEITUNA = sup('aceituna', 'Aceituna verde', 'kg');
const PANELA = sup('panela', 'Queso panela', 'kg');
const RAJAS = sup('rajas_vinagre', 'Rajas en vinagre', 'kg');
const CHIPOTLE = sup('chipotle', 'Chile chipotle', 'kg');
const VALENTINA = sup('salsa_valentina', 'Salsa Valentina', 'L');
const BUFALO = sup('salsa_bufalo', 'Salsa búfalo', 'L');
const CATSUP = sup('catsup', 'Catsup', 'kg');
const MANGO_HAB = sup('aderezo_mango_habanero', 'Aderezo mango habanero', 'L');
const BBQ = sup('salsa_bbq', 'Salsa BBQ', 'L');
const TABASCO = sup('salsa_tabasco', 'Salsa Tabasco', 'L');
const AD_CHIPOTLE = sup('aderezo_chipotle', 'Aderezo chipotle', 'L');

// Bebidas calientes
const JARABE_VAINILLA = sup('jarabe_vainilla', 'Jarabe de vainilla', 'L');
const POLVO_TARO = sup('polvo_taro', 'Polvo de taro', 'kg');
const POLVO_MATCHA = sup('polvo_matcha', 'Polvo de matcha', 'kg');
const POLVO_CHOCOLATE = sup('polvo_chocolate', 'Chocolate en polvo', 'kg');
const POLVO_CHOCO_BLANCO = sup('polvo_chocolate_blanco', 'Chocolate blanco en polvo', 'kg');

// Postres por porción (se compran o preparan por pieza)
const FLAN_VAINILLA = sup('flan_vainilla', 'Flan de vainilla (porción)', 'pza');
const ARROZ_LECHE = sup('arroz_leche', 'Arroz con leche (porción)', 'pza');
const PAY_LIMON = sup('pay_limon', 'Pay de limón (rebanada)', 'pza');
const TAPIOCA = sup('tapioca', 'Tapioca (porción)', 'pza');
const FLAN_NAPO = sup('flan_napolitano', 'Flan napolitano (porción)', 'pza');

// --- RECETAS DE OPCIONES (modifiers) ---
const modifierRecipes: Record<string, RecipeLine[]> = {
    // Crepa dulce / waffles / hot cakes: ingredientes base
    mod_nutella: r([NUTELLA, 40]),
    mod_q_philadelphia: r([PHILADELPHIA, 40]),
    mod_rompope: r([ROMPOPE, 30]),
    mod_cajeta: r([CAJETA, 40]),
    mod_crema_cacahuate: r([CREMA_CACAHUATE, 35]),
    mod_mermelada_fresa: r([MERM_FRESA, 35]),
    mod_mermelada_zarzamora: r([MERM_ZARZA, 35]),
    mod_maple: r([MAPLE, 30]),
    mod_galleta_oreo: r([OREO, 30]),
    mod_galleta_chokis: r([CHOKIS, 30]),
    mod_lechera: r([LECHERA, 30]),
    mod_nuez: r([NUEZ, 20]),
    mod_chocolate_hersheys: r([JARABE_CHOCO, 30]),
    mod_crema_batida: r([CREMA_BATIDA, 30]),
    mod_chantilly: r([CHANTILLY, 30]),
    mod_fresa: r([FRESA, 60]),
    mod_durazno_almibar: r([DURAZNO, 60]),
    mod_manzana_verde: r([MANZANA, 60]),
    mod_platano: r([PLATANO, 70]),
    mod_mango: r([MANGO, 60]),
    mod_zarzamora: r([ZARZAMORA, 40]),
    mod_cereza_almibar: r([CEREZA, 30]),
    mod_blueberry: r([BLUEBERRY, 40]),
    mod_frambuesa: r([FRAMBUESA, 40]),
    mod_uva_verde: r([UVA, 50]),
    mod_kiwi: r([KIWI, 50]),
    // Extras con costo
    mod_ext_ksorpresa: r([K_SORPRESA, 1]),
    mod_ext_kdelice: r([K_DELICE, 1]),
    mod_ext_kchocolate: r([K_CHOCOLATE, 1]),
    mod_ext_kbueno: r([K_BUENO, 1]),
    mod_ext_kitkat: r([KITKAT, 1]),
    mod_ext_hersheys_blanco: r([HERSHEYS_BLANCO, 1]),
    mod_ext_mini_conejo_turin: r([CONEJO, 1]),
    mod_ext_helado: r([HELADO, 70]),
    mod_ext_baileys: r([BAILEYS, 30]),
    mod_ext_kahlua: r([KAHLUA, 30]),
    // Cortesías (crepa dulce) y toppings de bebida (top_bombones es el mismo id en ambos)
    top_nuez: r([NUEZ, 10]),
    top_almendra: r([ALMENDRA, 10]),
    top_cacahuate: r([CACAHUATE, 10]),
    top_bombones: r([BOMBONES, 10]),
    top_krankys: r([KRANKYS, 10]),
    top_chocoretas: r([CHOCORETAS, 10]),
    top_lechera: r([LECHERA, 15]),
    top_chispas: r([CHISPAS, 5]),
    top_hersheys: r([JARABE_CHOCO, 15]),
    top_crema_batida: r([CREMA_BATIDA, 20]),
    // Crepa salada: ingredientes base
    cs_manchego: r([MANCHEGO, 40]),
    cs_philadelphia: r([PHILADELPHIA, 40]),
    cs_oaxaca: r([OAXACA, 40]),
    cs_pechuga_pavo: r([PAVO, 40]),
    cs_pepperoni: r([PEPPERONI, 25]),
    cs_espinaca: r([ESPINACA, 25]),
    'cs_champiñones': r([CHAMPINON, 30]),
    cs_sala_prego: r([PREGO, 30]),
    cs_jamon_serrano: r([SERRANO, 25]),
    cs_salami: r([SALAMI, 25]),
    cs_cabra: r([CABRA, 30]),
    'cs_piña_almibar': r([PINA, 40]),
    cs_fajitas_pollo: r([POLLO, 60]),
    cs_rajas_crema: r([RAJAS_CREMA, 50]),
    cs_aceitunas: r([ACEITUNA, 20]),
    cs_panela: r([PANELA, 40]),
    // Crepa salada: salsas y aderezos
    ss_rajas: r([RAJAS, 15]),
    ss_chipotle: r([CHIPOTLE, 10]),
    ss_salsa_valentina: r([VALENTINA, 10]),
    ss_salsa_bufalo: r([BUFALO, 15]),
    ss_catsup: r([CATSUP, 15]),
    ss_aderezo_mango_habanero: r([MANGO_HAB, 15]),
    ss_bbq: r([BBQ, 15]),
    ss_salsa_tabasco: r([TABASCO, 3]),
    ss_aderezo_chipotle: r([AD_CHIPOTLE, 15]),
    // Leche: la lista es obligatoria ("elige una"), así que cada bebida descuenta una.
    // Es un promedio entre tamaños y bebidas frías (la receta de la opción no cambia por tamaño).
    leche_entera: r([LECHE, 220]),
    leche_deslac: r([LECHE_DESLAC, 220]),
    // Esquimo: fruta y esencia
    em_fresa: r([FRESA, 60]),
    em_platano: r([PLATANO, 70]),
    // Bubble tea servido como frappé lleva base de frappé
    bt_est_frappe: r([BASE_FRAPPE, 25]),
};

// Un insumo por sabor (jarabe o polvo), creado a partir de las opciones del seeder
const flavor = (prefix: string, unit: SupplyUnit, qty: number, entries: [string, string][]) => {
    entries.forEach(([modId, name]) => {
        modifierRecipes[modId] = r([sup(`${prefix}_${modId}`, name, unit), qty]);
    });
};

flavor('te', 'pza', 1, [
    ['te_manzanilla_hinojo_aloe_vera', 'Té manzanilla, hinojo y aloe (sobre)'], ['te_verde_limon', 'Té verde limón (sobre)'],
    ['te_jengibre_lima', 'Té jengibre lima (sobre)'], ['te_negro_frutos_rojos', 'Té negro frutos rojos (sobre)'],
    ['te_limon_hinojo', 'Té limón hinojo (sobre)'], ['te_blanco_menta', 'Té blanco y menta (sobre)'], ['te_canela_manzana', 'Té canela manzana (sobre)']
]);
flavor('tisana', 'kg', 8, [
    ['tisana_guayaba', 'Tisana guayaba'], ['tisana_pinacoco', 'Tisana piña-coco'], ['tisana_mangomaracuya', 'Tisana mango-maracuyá'],
    ['tisana_ponche_tradicional', 'Tisana ponche tradicional'], ['tisana_fusion_moras', 'Tisana fusión moras']
]);
flavor('jarabe_soda', 'L', 40, [
    ['sd_mora', 'Jarabe mora azul'], ['sd_manzana', 'Jarabe manzana verde'], ['sd_cereza', 'Jarabe cereza'], ['sd_maracuya', 'Jarabe maracuyá'],
    ['sd_mango', 'Jarabe mango'], ['sd_liche', 'Jarabe lichi'], ['sd_sandia', 'Jarabe sandía'], ['sd_uva', 'Jarabe uva']
]);
flavor('chamoyada', 'L', 80, [
    ['cham_mango', 'Pulpa chamoyada mango'], ['cham_fresa', 'Pulpa chamoyada fresa'],
    ['cham_ice_cereza', 'Jarabe ICEE cereza'], ['cham_ice_mora_azul', 'Jarabe ICEE mora azul']
]);
flavor('jarabe_malteada', 'L', 30, [
    ['ms_fresa', 'Jarabe malteada fresa'], ['ms_vainilla', 'Jarabe malteada vainilla'], ['ms_chocolate', 'Jarabe malteada chocolate'],
    ['ms_cookies_cream', 'Jarabe malteada cookies & cream'], ['me_mazapan', 'Jarabe malteada mazapán'], ['me_rompope', 'Jarabe malteada rompope'],
    ['me_dulce_leche', 'Jarabe malteada dulce de leche']
]);
flavor('polvo_frappe', 'kg', 35, [
    ['fs_taro', 'Polvo frappé taro'], ['fs_capuchino', 'Polvo frappé capuchino'], ['fs_rompompe', 'Polvo frappé rompope'],
    ['fs_moka', 'Polvo frappé moka'], ['fs_matcha', 'Polvo frappé matcha'], ['fs_galleta_oreo', 'Polvo frappé galleta Oreo'],
    ['fs_mazapan', 'Polvo frappé mazapán'], ['fs_caramelo', 'Polvo frappé caramelo'], ['fs_horchata', 'Polvo frappé horchata'],
    ['fs_coco', 'Polvo frappé coco'], ['fs_fresas_crema', 'Polvo frappé fresas con crema'], ['fs_cajeta', 'Polvo frappé cajeta'],
    ['fs_vainilla_francesa', 'Polvo frappé vainilla francesa'], ['fs_chicle', 'Polvo frappé chicle'],
    ['fs_chocolate_blanco', 'Polvo frappé chocolate blanco'], ['fs_chocolate_oscuro', 'Polvo frappé chocolate oscuro'],
    ['fs_cafe', 'Polvo frappé café'], ['fs_yogurt_fresa', 'Polvo frappé yogurt de fresa'], ['fs_pistache', 'Polvo frappé pistache'],
    ['fe_pay_limon', 'Polvo frappé pay de limón']
]);
flavor('polvo_bubble', 'kg', 30, [
    ['bt_taro', 'Polvo bubble taro'], ['bt_horchavainilla', 'Polvo bubble horchavainilla'], ['bt_chai', 'Polvo bubble chai'],
    ['bt_matcha', 'Polvo bubble matcha'], ['bt_mazapan', 'Polvo bubble mazapán'], ['bt_strawberry', 'Polvo bubble strawberry'],
    ['bt_dulce_leche', 'Polvo bubble dulce de leche'], ['bt_cookies_cream', 'Polvo bubble cookies & cream'],
    ['bt_coffe_chocolate', 'Polvo bubble coffee chocolate'], ['bt_horchata_tea', 'Polvo bubble horchata tea'],
    ['bt_moka', 'Polvo bubble moka'], ['bt_gum', 'Polvo bubble chicle'], ['bt_caramel', 'Polvo bubble caramelo']
]);
flavor('esencia', 'L', 10, [
    ['em_es_vainilla', 'Esencia vainilla'], ['em_es_chocolate', 'Esencia chocolate'], ['em_es_pistache', 'Esencia pistache'],
    ['em_es_irlandesa', 'Esencia crema irlandesa'], ['em_es_cafe', 'Esencia café']
]);
// Frappés especiales que usan un producto que ya existe
modifierRecipes.fe_baileys = r([BAILEYS, 30], [BASE_FRAPPE, 10]);
modifierRecipes.fe_kahlua = r([KAHLUA, 30], [BASE_FRAPPE, 10]);
modifierRecipes.fe_nutella = r([NUTELLA, 35]);

// --- RECETAS DE CATEGORÍAS QUE SE ARMAN (lo que gasta la base) ---
const groupRecipes: Record<string, RecipeLine[]> = {
    armar_crepa_dulce: r([MASA_CREPA, 70], [CHAROLA, 1]),
    armar_crepa_salada: r([MASA_CREPA, 70], [CHAROLA, 1]),
    waffles: r([MEZCLA_HC, 80], [LECHE, 60], [CHAROLA, 1]),
    hotcakes: r([MEZCLA_HC, 100], [LECHE, 80], [CHAROLA, 1]),
    mini_hotcakes: r([MEZCLA_HC, 60], [LECHE, 50], [CHAROLA, 1]),
};

// --- RECETAS DE PRODUCTOS ---
const crepa = (...lines: Line[]) => r([MASA_CREPA, 70], [CHAROLA, 1], ...lines);
const coldCup = (...lines: Line[]) => r([VASO_FRIO, 1], [POPOTE, 1], ...lines);
const postre = (...lines: Line[]) => r([CHAROLA, 1], ...lines);

const itemRecipes: Record<string, RecipeLine[]> = {
    // Crepas saladas del menú
    item_chiken_tender: crepa([POLLO_TENDER, 90], [MANCHEGO, 30]),
    item_crepizza: crepa([PREGO, 30], [MANCHEGO, 40], [PEPPERONI, 25]),
    item_suprema: crepa([PAVO, 40], [MANCHEGO, 30], [CHAMPINON, 25], [PEPPERONI, 20]),
    item_clasica: crepa([PAVO, 40], [MANCHEGO, 40]),
    item_italiana: crepa([SALAMI, 25], [MANCHEGO, 30], [ESPINACA, 20], [PREGO, 30]),
    item_carnes_frias: crepa([PAVO, 30], [SALAMI, 20], [PEPPERONI, 20], [MANCHEGO, 30]),
    item_champiqueso: crepa([CHAMPINON, 40], [MANCHEGO, 30], [OAXACA, 30]),
    'item_española': crepa([SERRANO, 30], [CABRA, 30], [ESPINACA, 20]),
    item_hawaiana: crepa([PAVO, 40], [PINA, 40], [MANCHEGO, 30]),
    item_rajas_crema: crepa([RAJAS_CREMA, 60], [MANCHEGO, 30]),
    item_vegetariana: crepa([ESPINACA, 25], [CHAMPINON, 30], [PANELA, 40], [ACEITUNA, 15]),
    item_tres_quesos: crepa([MANCHEGO, 30], [OAXACA, 30], [PHILADELPHIA, 30]),
    // Crepas dulces del menú
    item_frutos_rojos: crepa([FRESA, 40], [ZARZAMORA, 25], [FRAMBUESA, 20], [BLUEBERRY, 20], [PHILADELPHIA, 30]),
    item_dulce_cajeta: crepa([CAJETA, 50], [NUEZ, 15]),
    item_strudel_manzana: crepa([MANZANA, 70], [NUEZ, 10], [LECHERA, 20]),
    item_delicia_casa: crepa([NUTELLA, 40], [FRESA, 40], [PLATANO, 40]),
    item_banana_caramel: crepa([PLATANO, 70], [CAJETA, 40]),
    item_dulce_tentacion: crepa([NUTELLA, 40], [PHILADELPHIA, 30], [FRESA, 40]),
    item_dulce_tropical: crepa([MANGO, 50], [KIWI, 30], [FRESA, 30], [LECHERA, 20]),
    item_dulce_rompope: crepa([ROMPOPE, 40], [NUEZ, 10], [PHILADELPHIA, 30]),
    item_dulce_nutella: crepa([NUTELLA, 50]),
    item_dulce_platano: crepa([PLATANO, 70], [LECHERA, 25]),
    item_dulce_durazno: crepa([DURAZNO, 70], [PHILADELPHIA, 30]),
    item_dulce_fresa: crepa([FRESA, 70], [LECHERA, 25]),
    // Postres
    item_fresas_crema: postre([FRESA, 200], [CREMA_FRESAS, 100]),
    item_duraznos_crema: postre([DURAZNO, 200], [CREMA_FRESAS, 100]),
    item_frutos_rojos_crema: postre([FRESA, 80], [ZARZAMORA, 40], [FRAMBUESA, 40], [BLUEBERRY, 40], [CREMA_FRESAS, 100]),
    item_uvas_verdes_crema: postre([UVA, 200], [CREMA_FRESAS, 100]),
    item_flan_vainilla: r([FLAN_VAINILLA, 1]),
    item_arroz_leche: r([ARROZ_LECHE, 1]),
    item_pay_limon: r([PAY_LIMON, 1]),
    item_tapioca: r([TAPIOCA, 1]),
    item_flan_napolitano: r([FLAN_NAPO, 1]),
    // Bebidas frías (la leche y el sabor vienen de las opciones)
    item_soda: coldCup([AGUA_MINERAL, 250]),
    item_chamoyada: coldCup([CHAMOY, 40]),
    item_malt_sen: coldCup([HELADO, 150]),
    item_malt_esp: coldCup([HELADO, 150]),
    item_frap_sen: coldCup([BASE_FRAPPE, 30]),
    item_frap_esp: coldCup([BASE_FRAPPE, 30]),
    item_bubble_tea: r([VASO_FRIO, 1], [POPOTE_BUBBLE, 1], [PERLAS, 50]),
    item_esquimo: coldCup([HELADO, 120]),
};

// Bebidas calientes por tamaño: Chico 8 oz, Mediano 12 oz, Grande 16 oz (la leche viene de la opción)
const SIZES = ['Chico', 'Mediano', 'Grande'] as const;
const CUPS = [VASO_8, VASO_12, VASO_16];
const bySize = (perSize: (i: number) => Line[]): Record<string, RecipeLine[]> =>
    Object.fromEntries(SIZES.map((size, i) => [size, r([CUPS[i], 1], ...perSize(i))]));
const espresso = (i: number): Line => [CAFE, [9, 14, 18][i]];

const variantRecipes: Record<string, Record<string, RecipeLine[]>> = {
    item_americano: bySize(i => [espresso(i)]),
    item_capuchino: bySize(i => [espresso(i)]),
    item_latte: bySize(i => [espresso(i)]),
    item_vainilla_latte: bySize(i => [espresso(i), [JARABE_VAINILLA, [15, 20, 30][i]]]),
    item_taro_latte: bySize(i => [[POLVO_TARO, [20, 25, 30][i]]]),
    item_matcha_latte: bySize(i => [[POLVO_MATCHA, [20, 25, 30][i]]]),
    item_moka: bySize(i => [espresso(i), [JARABE_CHOCO, [20, 25, 30][i]]]),
    item_chocolate: bySize(i => [[POLVO_CHOCOLATE, [25, 30, 40][i]]]),
    item_chocolate_blanco: bySize(i => [[POLVO_CHOCO_BLANCO, [25, 30, 40][i]]]),
    item_te: bySize(() => []),
    item_tisanas: bySize(() => []),
};

// Existencia inicial para QA (solo si la sucursal aún no tiene registro de ese insumo)
const INITIAL_STOCK: Record<SupplyUnit, number> = { kg: 5000, L: 5000, pza: 100 };

/** Crea insumos, asigna recetas al menú existente y deja existencia inicial en cada sucursal. */
export async function seedInventory() {
    const missing: string[] = [];
    let batch = writeBatch(db);
    let ops = 0;
    // Firestore permite 500 operaciones por batch
    const queue = async (fn: (b: ReturnType<typeof writeBatch>) => void) => {
        fn(batch);
        if (++ops >= 450) { await batch.commit(); batch = writeBatch(db); ops = 0; }
    };

    for (const s of supplies) await queue(b => b.set(doc(db, 'supplies', s.id), s));

    const setRecipe = async (col: string, id: string, recipe: RecipeLine[]) => {
        const snap = await getDoc(doc(db, col, id));
        if (!snap.exists()) { missing.push(`${col}/${id}`); return; }
        await queue(b => b.set(doc(db, col, id), { recipe }, { merge: true }));
    };

    for (const [id, recipe] of Object.entries(modifierRecipes)) await setRecipe('modifiers', id, recipe);
    for (const [id, recipe] of Object.entries(groupRecipes)) await setRecipe('menu_groups', id, recipe);
    for (const [id, recipe] of Object.entries(itemRecipes)) await setRecipe('menu_items', id, recipe);

    for (const [id, recipes] of Object.entries(variantRecipes)) {
        const ref = doc(db, 'menu_items', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) { missing.push(`menu_items/${id}`); continue; }
        const variants = (snap.data().variants || []).map((v: { name: string }) => ({ ...v, recipe: recipes[v.name] || [] }));
        await queue(b => b.set(ref, { variants }, { merge: true }));
    }

    const branchesSnap = await getDocs(collection(db, 'branches'));
    for (const branch of branchesSnap.docs) {
        const stockSnap = await getDocs(collection(db, 'branches', branch.id, 'supplies_stock'));
        const existing = new Set(stockSnap.docs.map(d => d.id));
        for (const s of supplies) {
            if (existing.has(s.id)) continue;
            const qty = INITIAL_STOCK[s.unit];
            await queue(b => b.set(doc(db, 'branches', branch.id, 'supplies_stock', s.id), { stock: qty, updatedAt: serverTimestamp() }));
            await queue(b => b.set(doc(collection(db, 'branches', branch.id, 'supply_moves')), {
                supplyId: s.id, supplyName: s.name, type: 'count', qty, before: 0, after: qty,
                note: 'Existencia inicial de prueba (seeder)', user: 'Seeder', createdAt: serverTimestamp()
            }));
        }
    }

    if (ops > 0) await batch.commit();
    if (missing.length > 0) console.warn('seedInventory: no existen en Firestore (corre antes las secciones del menú):', missing);
}
