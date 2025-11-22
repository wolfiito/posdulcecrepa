// src/utils/bluetoothPrintBuilder.ts
import type { Order } from '../services/orderService';

// CONFIGURACIÓN DE ANCHO (58mm suele ser 32 caracteres con fuente normal)
const MAX_CHARS = 32;

/**
 * Ayuda a crear una línea con texto a la izquierda y a la derecha
 * Ejemplo: "Crepa Dulce ........... $55.00"
 */
const formatLine = (leftText: string, rightText: string): string => {
  const spaceNeeded = MAX_CHARS - (leftText.length + rightText.length);
  if (spaceNeeded < 1) {
    // Si no cabe, cortamos o dejamos un solo espacio
    // Opción: Dejar que haga salto de línea natural, pero aquí forzamos espacio
    return `${leftText} ${rightText}`; 
  }
  const spaces = " ".repeat(spaceNeeded);
  return `${leftText}${spaces}${rightText}`;
};

const getFormattedDate = (order: Order) => {
    try {
        if (order.createdAt?.toDate) {
            const d = order.createdAt.toDate();
            return {
                date: d.toLocaleDateString('es-MX'),
                time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            };
        }
        const d = new Date();
        return {
            date: d.toLocaleDateString('es-MX'),
            time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        };
    } catch (e) { return { date: "--/--/--", time: "--:--" }; }
};

// ==========================================
// 1. CONSTRUCTOR PARA IPHONE (JSON Thermer)
// ==========================================
export const buildReceiptJSON = (order: Order) => {
  const data: Record<string, any> = {};
  let index = 0;
  const add = (item: any) => { data[`${index}`] = item; index++; };
  const { date, time } = getFormattedDate(order);

  // --- ENCABEZADO ---
  // <113> equiv en JSON: bold:1, align:1, format:3 (Double Width) o 1 (Double Height)
  add({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 2 }); // Doble Alto y Ancho
  add({ type: 0, content: "Sucursal: Centro", bold: 0, align: 0, format: 0 });
  add({ type: 0, content: `Fecha: ${date}  Hora: ${time}`, bold: 0, align: 0, format: 0 });
  add({ type: 0, content: `Atendió: Cajero #1`, bold: 0, align: 0, format: 0 }); // Puedes pasar el nombre si lo tienes
  add({ type: 0, content: "________________________________", bold: 1, align: 1, format: 0 });

  // --- PRODUCTOS ---
  order.items.forEach(item => {
    const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
    const nameFull = `${item.baseName} ${variant}`;
    const priceStr = `$${item.finalPrice.toFixed(2)}`;

    // Línea Principal: Nombre ... Precio (Negrita)
    add({ 
        type: 0, 
        content: formatLine(nameFull, priceStr), 
        bold: 1, 
        align: 0, 
        format: 0 
    });

    // Extras / Modificadores
    if (item.details?.selectedModifiers) {
       item.details.selectedModifiers.forEach(mod => {
           // Símbolo + en negrita (Toda la línea en este caso para que resalte)
           // Format: 4 es "Small" en Thermer
           add({ type: 0, content: ` + ${mod.name}`, bold: 1, align: 0, format: 0 }); 
       });
    }
    // Separador sutil entre items (opcional)
    // add({ type: 0, content: " ", bold: 0, align: 0, format: 4 }); 
  });

  add({ type: 0, content: "________________________________", bold: 1, align: 1, format: 0 });

  // --- TOTAL ---
  const totalStr = `$${order.total.toFixed(2)}`;
  // Alineado a la derecha, Negrita, Doble Alto (Format 1)
  add({ type: 0, content: `Total: ${totalStr}`, bold: 1, align: 2, format: 1 });
  
  add({ type: 0, content: "________________________________", bold: 1, align: 1, format: 0 });

  // --- PIE ---
  add({ type: 0, content: " ", bold: 0, align: 0, format: 0 });
  add({ type: 0, content: "¡Gracias por su compra!", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: "Wifi: DulceCrepa_Invitados", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: "\n\n", bold: 0, align: 0, format: 0 });

  return JSON.stringify(data);
};

// ==========================================
// 2. CONSTRUCTOR PARA ANDROID (String con Tags)
// ==========================================
export const buildReceiptString = (order: Order) => {
  let str = "";
  const { date, time } = getFormattedDate(order);

  // Tags: <BAF> -> B:Bold(0/1), A:Align(0L,1C,2R), F:Font(0N,1DH,2DHW,3DW)
  
  // Encabezado
  str += "<112>DULCE CREPA\n"; // Negrita, Centro, Doble Alto+Ancho
  str += "<010>Sucursal: Centro\n";
  str += `<000>Fecha: ${date}  Hora: ${time}\n`;
  str += "<000>Atendió: Cajero #1\n";
  str += "<110>________________________________\n";

  // Productos
  order.items.forEach(item => {
    const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
    const nameFull = `${item.baseName} ${variant}`;
    const priceStr = `$${item.finalPrice.toFixed(2)}`;
    
    // Usamos la función formatLine para alinear los precios a la derecha
    // <100> = Negrita, Izquierda, Normal
    str += `<100>${formatLine(nameFull, priceStr)}\n`;

    // Extras
    if (item.details?.selectedModifiers) {
        item.details.selectedModifiers.forEach(mod => {
            // <100> = Negrita para el "+" y el nombre
            str += `<100>  + ${mod.name}\n`;
        });
    }
  });

  str += "<110>________________________________\n";

  // Total (Alineado Derecha, Doble Alto)
  // <121> = Negrita, Derecha, Doble Alto
  str += `<121>Total: $${order.total.toFixed(2)}\n`;

  str += "<110>________________________________\n";

  // Pie
  str += "<010>\n"; // Espacio
  str += "<010>¡Gracias por su compra!\n";
  str += "<010>Wifi: DulceCrepa_Invitados\n";
  str += "\n\n"; // Corte de papel

  return str;
};