// src/components/ProductIcons.tsx
import React from 'react';
import type { MenuItem, MenuGroup } from '../types/menu';

export const ICON_WEBPS: Record<string, string> = {
    //------Configuración de iconos de categoría-----------//
    'item_crepas_dulces': new URL('../assets/icons/Categorias/Crepa_Dulce.webp', import.meta.url).href,
    'item_crepas_saladas': new URL('../assets/icons/Categorias/Crepa_Salada.webp', import.meta.url).href,
    'item_bebidas_calientes': new URL('../assets/icons/Categorias/Bebidas_Calientes.webp', import.meta.url).href,
    'item_bebidas_frias': new URL('../assets/icons/Categorias/Bebidas_Frias.webp', import.meta.url).href,
    'item_postres': new URL('../assets/icons/Categorias/Postres.webp', import.meta.url).href,
    'item_waffles': new URL('../assets/icons/Categorias/Waffle.webp', import.meta.url).href,
    'item_hotcakes': new URL('../assets/icons/Categorias/Hotcake.webp', import.meta.url).href,
    'item_mini_hotcakes': new URL('../assets/icons/Categorias/Mini_Hotcake.webp', import.meta.url).href,
    //-----------------------------------------------//

    //------Configuración de iconos de crepas dulces------//
    'item_banana_caramel': new URL('../assets/icons/CrepasDulces/Crepa_Banana_Caramel.webp', import.meta.url).href,
    'item_delicia_casa': new URL('../assets/icons/CrepasDulces/Crepa_Delicia_Casa.webp', import.meta.url).href,
    'item_dulce_fresa': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Fresa.webp', import.meta.url).href,
    'item_dulce_tropical': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Tropical.webp', import.meta.url).href,
    'item_frutos_rojos': new URL('../assets/icons/CrepasDulces/Crepa_Frutos_Rojos.webp', import.meta.url).href,
    'item_strudel_manzana': new URL('../assets/icons/CrepasDulces/Crepa_Strudel_Manzana.webp', import.meta.url).href,
    'item_dulce_rompope': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Rompope.webp', import.meta.url).href,
    'item_dulce_tentacion': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Tentacion.webp', import.meta.url).href,
    'item_dulce_durazno': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Durazno.webp', import.meta.url).href,
    'item_dulce_platano': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Platano.webp', import.meta.url).href,
    'item_dulce_nutella': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Nutella.webp', import.meta.url).href,
    'item_dulce_cajeta': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Cajeta.webp', import.meta.url).href,
    'armar_crepa_dulce': new URL('../assets/icons/CrepasDulces/Crepa_Dulce_Armar.webp', import.meta.url).href,
    //-----------------------------------------------//
    
    //------Configuración de iconos de crepas saladas------//
    'item_carnes_frias': new URL('../assets/icons/CrepasSaladas/Crepa_Carnes_Fria.webp', import.meta.url).href,
    'item_champiqueso': new URL('../assets/icons/CrepasSaladas/Crepa_Champiqueso.webp', import.meta.url).href,
    'item_chiken_tender': new URL('../assets/icons/CrepasSaladas/Crepa_Chiken_Tender.webp', import.meta.url).href,
    'item_clasica': new URL('../assets/icons/CrepasSaladas/Crepa_Clasica.webp', import.meta.url).href,
    'item_crepizza': new URL('../assets/icons/CrepasSaladas/Crepa_Crepizza.webp', import.meta.url).href,
    'item_española': new URL('../assets/icons/CrepasSaladas/Crepa_Española.webp', import.meta.url).href,
    'item_hawaiana': new URL('../assets/icons/CrepasSaladas/Crepa_Hawaiana.webp', import.meta.url).href,
    'item_italiana': new URL('../assets/icons/CrepasSaladas/Crepa_Italiana.webp', import.meta.url).href,
    'item_rajas_crema': new URL('../assets/icons/CrepasSaladas/Crepa_Rajas_Crema.webp', import.meta.url).href,
    'item_suprema': new URL('../assets/icons/CrepasSaladas/Crepa_Suprema.webp', import.meta.url).href,
    'item_tres_quesos': new URL('../assets/icons/CrepasSaladas/Crepa_Tres_Quesos.webp', import.meta.url).href,
    'item_vegetariana': new URL('../assets/icons/CrepasSaladas/Crepa_Vegetariana.webp', import.meta.url).href,
    'armar_crepa_salada': new URL('../assets/icons/CrepasSaladas/Crepa_Salada_Armar.webp', import.meta.url).href,
    //-----------------------------------------------//
    
    //------Configuración de iconos de bebidas calientes------//
    'item_americano': new URL('../assets/icons/BebidasCalientes/Cafe_Americano.webp', import.meta.url).href,
    'item_capuchino': new URL('../assets/icons/BebidasCalientes/Cafe_Capuchino.webp', import.meta.url).href,
    'item_chocolate_blanco': new URL('../assets/icons/BebidasCalientes/Chocolate_Blanco.webp', import.meta.url).href,
    'item_chocolate': new URL('../assets/icons/BebidasCalientes/Chocolate.webp', import.meta.url).href,
    'item_latte': new URL('../assets/icons/BebidasCalientes/Latte.webp', import.meta.url).href,
    'item_matcha_latte': new URL('../assets/icons/BebidasCalientes/Matcha_Latte.webp', import.meta.url).href,
    'item_taro_latte': new URL('../assets/icons/BebidasCalientes/Taro_Latte.webp', import.meta.url).href,
    'item_te': new URL('../assets/icons/BebidasCalientes/Te.webp', import.meta.url).href,
    'item_tisanas': new URL('../assets/icons/BebidasCalientes/Tisana.webp', import.meta.url).href,
    'item_vainilla_latte': new URL('../assets/icons/BebidasCalientes/Vainilla_Latte.webp', import.meta.url).href,
    
    //------Configuración de iconos de bebidas frías------//
    'item_bubble_tea': new URL('../assets/icons/BebidasFrias/Bubble_Tea.webp', import.meta.url).href,
    'item_chamoyada': new URL('../assets/icons/BebidasFrias/Chamoyada.webp', import.meta.url).href,
    'item_frappe_sencillo': new URL('../assets/icons/BebidasFrias/Frappe_Sencillo.webp', import.meta.url).href,
    'item_frappe_especial': new URL('../assets/icons/BebidasFrias/Frappe_Especial.webp', import.meta.url).href,
    'item_malteada_sencilla': new URL('../assets/icons/BebidasFrias/Malteada_Sencilla.webp', import.meta.url).href,
    'item_malteada_especial': new URL('../assets/icons/BebidasFrias/Malteada_Especial.webp', import.meta.url).href,
    'item_soda_italiana': new URL('../assets/icons/BebidasFrias/Soda_Italiana.webp', import.meta.url).href,
    'item_esquimo': new URL('../assets/icons/BebidasFrias/esquimo.webp', import.meta.url).href,
    //--------------------------------------------//

    //------Configuración de iconos de postres------//
    'item_pay_limon': new URL('../assets/icons/Postre/pay_limon.webp', import.meta.url).href,
    'item_arroz_leche': new URL('../assets/icons/Postre/arroz_leche.webp', import.meta.url).href,
    'item_flan_napolitano': new URL('../assets/icons/Postre/flan_napolitano.webp', import.meta.url).href,
    'item_flan_vainilla': new URL('../assets/icons/Postre/flan_vainilla.webp', import.meta.url).href,
    'item_uvas_verdes_crema': new URL('../assets/icons/Postre/postre_uvas_crema.webp', import.meta.url).href,
    'item_frutos_rojos_crema': new URL('../assets/icons/Postre/postre_frutos_rojos.webp', import.meta.url).href,
    'item_duraznos_crema': new URL('../assets/icons/Postre/postre_durazno.webp', import.meta.url).href,
    'item_fresas_crema': new URL('../assets/icons/Postre/postre_fresas_crema.webp', import.meta.url).href,
    'item_tapioca': new URL('../assets/icons/Postre/postre_tapioca.webp', import.meta.url).href,
    //--------------------------------------------//


};

const KawaiiIcon: React.FC<{ iconKey?: string }> = ({ iconKey }) => {
    const [hasError, setHasError] = React.useState(false);
    const src = iconKey ? ICON_WEBPS[iconKey] : null;

    if (src && !hasError) {
        return (
            <img
                src={src}
                alt={iconKey}
                onError={() => setHasError(true)}
                className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
            />
        );
    }

    return <span className="text-4xl text-gray-400">🍽️</span>;
};


function isGroup(item: MenuItem | MenuGroup): item is MenuGroup {
    return 'level' in item;
}

export function getIconForItem(item: MenuItem | MenuGroup): React.ReactNode {

    const id = item.id.toLowerCase();

    // Crepas Dulces
    if (id === 'item_frutos_rojos') return <KawaiiIcon iconKey="item_frutos_rojos" />;
    if (id === 'item_dulce_cajeta') return <KawaiiIcon iconKey="item_dulce_cajeta" />;
    if (id === 'item_dulce_rompope') return <KawaiiIcon iconKey="item_dulce_rompope" />;
    if (id === 'item_dulce_tentacion') return <KawaiiIcon iconKey="item_dulce_tentacion" />;
    if (id === 'item_dulce_fresa') return <KawaiiIcon iconKey="item_dulce_fresa" />;
    if (id === 'item_dulce_durazno') return <KawaiiIcon iconKey="item_dulce_durazno" />;
    if (id === 'item_delicia_casa') return <KawaiiIcon iconKey="item_delicia_casa" />;
    if (id === 'item_dulce_platano') return <KawaiiIcon iconKey="item_dulce_platano" />;
    if (id === 'item_dulce_tropical') return <KawaiiIcon iconKey="item_dulce_tropical" />;
    if (id === 'item_dulce_nutella') return <KawaiiIcon iconKey="item_dulce_nutella" />;
    if (id === 'item_banana_caramel') return <KawaiiIcon iconKey="item_banana_caramel" />;
    if (id === 'item_strudel_manzana') return <KawaiiIcon iconKey="item_strudel_manzana" />;
    if (id === 'armar_crepa_dulce') return <KawaiiIcon iconKey="armar_crepa_dulce" />;
    
    // Crepas Saladas
    if (id === 'item_hawaiana') return <KawaiiIcon iconKey="item_hawaiana" />;
    if (id === 'item_italiana') return <KawaiiIcon iconKey="item_italiana" />;
    if (id === 'item_crepizza') return <KawaiiIcon iconKey="item_crepizza" />;
    if (id === 'item_tres_quesos') return <KawaiiIcon iconKey="item_tres_quesos" />;
    if (id === 'item_suprema') return <KawaiiIcon iconKey="item_suprema" />;
    if (id === 'item_clasica') return <KawaiiIcon iconKey="item_clasica" />;
    if (id === 'item_chiken_tender') return <KawaiiIcon iconKey="item_chiken_tender" />;
    if (id === 'item_rajas_crema') return <KawaiiIcon iconKey="item_rajas_crema" />;
    if (id === 'item_vegetariana') return <KawaiiIcon iconKey="item_vegetariana" />;
    if (id === 'item_española') return <KawaiiIcon iconKey="item_española" />;
    if (id === 'item_champiqueso') return <KawaiiIcon iconKey="item_champiqueso" />;
    if (id === 'item_carnes_frias') return <KawaiiIcon iconKey="item_carnes_frias" />;
    if (id === 'armar_crepa_salada') return <KawaiiIcon iconKey="armar_crepa_salada" />;
    // 2. BEBIDAS CALIENTES
    if (id === 'item_americano') return <KawaiiIcon iconKey="item_americano" />;
    if (id === 'item_capuchino') return <KawaiiIcon iconKey="item_capuchino" />;
    if (id === 'item_taro_latte') return <KawaiiIcon iconKey="item_taro_latte" />;
    if (id === 'item_matcha_latte') return <KawaiiIcon iconKey="item_matcha_latte" />;
    if (id === 'item_moka') return <KawaiiIcon iconKey="item_moka" />;
    if (id === 'item_vainilla_latte') return <KawaiiIcon iconKey="item_vainilla_latte" />;
    if (id === 'item_latte') return <KawaiiIcon iconKey="item_latte" />;
    if (id === 'item_tisanas') return <KawaiiIcon iconKey="item_tisanas" />;
    if (id === 'item_te') return <KawaiiIcon iconKey="item_te" />;
    if (id === 'item_chocolate') return <KawaiiIcon iconKey="item_chocolate" />;
    if (id === 'item_chocolate_blanco') return <KawaiiIcon iconKey="item_chocolate_blanco" />;

    // 3. BEBIDAS FRÍAS
    if (id === 'item_chamoyada') return <KawaiiIcon iconKey="item_chamoyada" />;
    if (id === 'item_frap_sen') return <KawaiiIcon iconKey="item_frappe_sencillo" />;
    if (id === 'item_frap_esp') return <KawaiiIcon iconKey="item_frappe_especial" />;
    if (id === 'item_malt_sen') return <KawaiiIcon iconKey="item_malteada_sencilla" />;
    if (id === 'item_malt_esp') return <KawaiiIcon iconKey="item_malteada_especial" />;
    if (id === 'item_soda') return <KawaiiIcon iconKey="item_soda_italiana" />;
    if (id === 'item_bubble_tea') return <KawaiiIcon iconKey="item_bubble_tea" />;
    if (id === 'item_esquimo') return <KawaiiIcon iconKey="item_esquimo" />;

    // 4. OTROS POSTRES
    if (id === 'item_pay_limon') return <KawaiiIcon iconKey="item_pay_limon" />;
    if (id === 'item_arroz_leche') return <KawaiiIcon iconKey="item_arroz_leche" />;
    if (id === 'item_flan_napolitano') return <KawaiiIcon iconKey="item_flan_napolitano" />;
    if (id === 'item_flan_vainilla') return <KawaiiIcon iconKey="item_flan_vainilla" />;
    if (id === 'item_uvas_verdes_crema') return <KawaiiIcon iconKey="item_uvas_verdes_crema" />;
    if (id === 'item_frutos_rojos_crema') return <KawaiiIcon iconKey="item_frutos_rojos_crema" />;
    if (id === 'item_duraznos_crema') return <KawaiiIcon iconKey="item_duraznos_crema" />;
    if (id === 'item_fresas_crema') return <KawaiiIcon iconKey="item_fresas_crema" />;
    if (id === 'item_tapioca') return <KawaiiIcon iconKey="item_tapioca" />;
    // Mapeos por categoría o grupo
    if (id === 'hotcakes') return <KawaiiIcon iconKey="item_hotcakes" />;
    if (id === 'waffles') return <KawaiiIcon iconKey="item_waffles" />;
    if (id === 'mini_hotcakes') return <KawaiiIcon iconKey="item_mini_hotcakes" />;
    if (id === 'postres') return <KawaiiIcon iconKey="item_postres" />;
    if (id === 'crepas_dulces') return <KawaiiIcon iconKey="item_crepas_dulces" />;
    if (id === 'crepas_saladas') return <KawaiiIcon iconKey="item_crepas_saladas" />;
    if (id === 'bebidas_frias') return <KawaiiIcon iconKey="item_bebidas_frias" />;
    if (id === 'bebidas_calientes') return <KawaiiIcon iconKey="item_bebidas_calientes" />;
    if (id === 'item_bebidas') return <KawaiiIcon iconKey="item_bebidas" />;
    // DEFAULT
    return isGroup(item) ? null : <span className="text-4xl text-gray-400">🍽️</span>;
}