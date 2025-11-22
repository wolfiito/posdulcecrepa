// src/utils/bluetoothPrintBuilder.ts
import type { Order } from '../services/orderService';

// CONFIGURACIÓN DE ANCHO (58mm suele ser 32 caracteres con fuente normal)
const MAX_CHARS = 32;
const CARD_FEE_PERCENT = 0.035;
/**
 * Ayuda a crear una línea con texto a la izquierda y a la derecha
 * Ejemplo: "Crepa Dulce ........... $55.00"
 */
const formatLine = (leftText: string, rightText: string): string => {
    const spaceNeeded = MAX_CHARS - (leftText.length + rightText.length);
    if (spaceNeeded < 1) return `${leftText.substring(0, MAX_CHARS - rightText.length - 1)} ${rightText}`;
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
    
    // --- CORRECCIÓN CRÍTICA AQUÍ ---
    // Usamos padStart(3, '0') para que sea "001", "002", "010".
    // Esto evita que la App ordene "10" antes que "2".
    const add = (item: any) => {
      const key = index.toString().padStart(3, '0'); 
      data[key] = item;
      index++;
    };
  
    const { date, time } = getFormattedDate(order);
  
    // --- 1. ENCABEZADO ---
    // Format 2 = Doble Ancho y Alto (Gigante)
    add({ type: 5, content: "DULCE CREPA", bold: 1, align: 1, format: 2, size:12 }); 
    add({ type: 0, content: "Sucursal: Centro", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Fecha: ${date}`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Hora: ${time}`, bolde: 0, align: 0, format: 0 });
    add({ type: 0, content: `Atendió: Cajero #1`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "--------------------------------", bold: 1, align: 1, format: 0 });
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    // --- 2. PRODUCTOS ---
    order.items.forEach(item => {
      const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
      const nameFull = `${item.baseName} ${variant}`;
      const priceStr = `$${item.finalPrice.toFixed(2)}`;
  
      // Nombre y Precio en la misma línea (Negritas)
      add({ 
          type: 0, 
          content: formatLine(nameFull, priceStr), 
          bold: 1, 
          align: 0, 
          format: 0 
      });  
      // Extras (Con signo + en negrita)
      if (item.details?.selectedModifiers) {
        
         item.details.selectedModifiers.forEach(mod => {
            const modName = ` + ${mod.name}`;
            const modPrice = mod.price > 0 ? `$${mod.price.toFixed(2)}` : '$0.00';
             // Format 0 (Normal) para que se lea bien, Bold activado
             add({ 
                type: 0, 
                content: formatLine(modName, modPrice), 
                bold: 1, 
                align: 0, 
                format: 0 }); 
         });
      }
      add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    });
    
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "________________________________", bold: 1, align: 1, format: 0 });

  // --- 3. TOTALES Y PAGOS (LÓGICA MEJORADA) ---
  
    // Si pagó con tarjeta, calculamos el desglose
    if (order.payment?.method === 'card') {
        // Mostrar Subtotal (que es el total de los productos)
        add({ type: 0, content: formatLine("Subtotal:", `$${order.total.toFixed(2)}`), bold: 0, align: 2, format: 0 });
        
        // Calcular Comisión
        const fee = order.payment.cardFee || (order.total * 0.035);
        add({ type: 0, content: formatLine(`Comisión (${(CARD_FEE_PERCENT*100)}%):`, `$${fee.toFixed(2)}`), bold: 0, align: 2, format: 0 });
        
        // Nuevo Gran Total
        const grandTotal = order.total + fee;
        add({ type: 0, content: formatLine("TOTAL:", `$${grandTotal.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        
        add({ type: 0, content: "[PAGO CON TARJETA]", bold: 1, align: 1, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

    } else if (order.payment?.method === 'cash') {
        // Efectivo: Total normal
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        
        // Desglose de cambio
        const paid = order.payment.amountPaid || order.total;
        const change = order.payment.change || 0;

        add({ type: 0, content: formatLine("Su Pago:", `$${paid.toFixed(2)}`), bold: 0, align: 2, format: 0 });
        add({ type: 0, content: formatLine("Cambio:", `$${change.toFixed(2)}`), bold: 1, align: 2, format: 0 });
        add({ type: 0, content: "[PAGO EN EFECTIVO]", bold: 1, align: 1, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

    } else if (order.payment?.method === 'transfer') {
        // Transferencia
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        add({ type: 0, content: "[TRANSFERENCIA]", bold: 1, align: 1, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

    } else {
        // Caso "Pending" o sin datos de pago (ej. Mesa abierta)
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        const statusText = order.status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO';
        add({ type: 0, content: statusText, bold: 1, align: 1, format: 0 });
  }
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
  str += `<000>Fecha: ${date}\n`;
  str += `<000>Hora: ${time}\n`;
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
  str += "\n\n"; // Corte de papel
  str += "\n\n";
  str += "\n\n";
  return str;
};