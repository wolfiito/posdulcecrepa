// src/utils/bluetoothPrintBuilder.ts
import type { Order } from '../services/orderService';

export const buildReceiptJSON = (order: Order) => {
  // IMPORTANTE: Usamos un Objeto ("Record"), no un Array.
  // Esto genera: { "0": {...}, "1": {...} } que es lo que Thermer pide.
  const data: Record<string, any> = {};
  let index = 0;
  
  const add = (item: any) => {
    data[`${index}`] = item;
    index++;
  };

  // Formato de fecha
  let dateStr = "";
  try {
      if (order.createdAt?.toDate) {
          dateStr = order.createdAt.toDate().toLocaleString('es-MX');
      } else {
          dateStr = new Date().toLocaleString('es-MX');
      }
  } catch (e) { dateStr = new Date().toLocaleString('es-MX'); }

  // --- TICKET ---
  add({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 3 }); 
  add({ type: 0, content: "Ticket de Venta", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: dateStr, bold: 0, align: 1, format: 4 });
  add({ type: 0, content: `Orden #${order.orderNumber}`, bold: 1, align: 1, format: 0 });
  add({ type: 0, content: `[${order.mode}]`, bold: 1, align: 1, format: 0 });
  
  add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  order.items.forEach(item => {
    const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
    add({ type: 0, content: `${item.baseName} ${variant}`, bold: 1, align: 0, format: 0 });
    
    if (item.details?.selectedModifiers) {
       item.details.selectedModifiers.forEach(mod => {
           add({ type: 0, content: ` + ${mod.name}`, bold: 0, align: 0, format: 4 });
       });
    }
    
    add({ type: 0, content: `$${item.finalPrice.toFixed(2)}`, bold: 1, align: 2, format: 0 });
    add({ type: 0, content: " ", bold: 0, align: 0, format: 4 });
  });

  add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  add({ type: 0, content: `TOTAL: $${order.total.toFixed(2)}`, bold: 1, align: 2, format: 1 });
  
  const statusText = order.status === 'paid' ? 'PAGADO' : 'PENDIENTE';
  add({ type: 0, content: statusText, bold: 1, align: 2, format: 0 });

  add({ type: 0, content: " ", bold: 0, align: 0, format: 0 });
  add({ type: 0, content: "Gracias por su preferencia", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: "Wifi: DulceCrepa_Invitados", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
  add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

  return JSON.stringify(data);
};

// --- VERSIÓN CORREGIDA PARA ANDROID (INTENT) ---
export const buildReceiptString = (order: Order): string => {
    let str = "";
    
    // LEYENDA <BAF>:
    // B (Bold): 0=No, 1=Sí
    // A (Align): 0=Izquierda, 1=Centro, 2=Derecha
    // F (Format): 0=Normal, 1=Doble Alto, 2=Alto+Ancho, 3=Doble Ancho
    
    // 1. FECHA
    let dateStr = "";
    try {
        if (order.createdAt?.toDate) {
            dateStr = order.createdAt.toDate().toLocaleString('es-MX');
        } else {
            dateStr = new Date().toLocaleString('es-MX');
        }
    } catch (e) { dateStr = new Date().toLocaleString('es-MX'); }

    // 2. CABECERA
    // <113>: Negrita, Centro, Doble Ancho (Para que se vea grande como el título)
    str += "<113>DULCE CREPA\n"; 
    str += "<010>Ticket de Venta\n";
    str += `<010>${dateStr}\n`;
    str += `<110>Orden #${order.orderNumber}\n`;
    str += `<110>[${order.mode}]\n`;
    
    str += "<010>--------------------------------\n";
    
    // 3. PRODUCTOS
    order.items.forEach(item => {
        // Variante (si existe)
        const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
        const fullName = `${item.baseName} ${variant}`;

        // Nombre del producto (Negrita, Izquierda)
        str += `<100>${fullName}\n`;

        // Modificadores (Normal, Izquierda, con un pequeño 'tab' visual)
        if (item.details?.selectedModifiers) {
             item.details.selectedModifiers.forEach(mod => {
                 str += `<000>  + ${mod.name}\n`;
             });
        }
        
        // Precio (Negrita, Derecha)
        // Nota: En modo texto, alinear a la derecha a veces salta de línea. 
        // Si quieres que quede en la misma línea del nombre es complejo en modo texto puro.
        // Lo pondremos debajo alineado a la derecha para asegurar que se lea bien.
        str += `<120>$${item.finalPrice.toFixed(2)}\n`;
        
        // Espacio pequeño entre items
        str += "<000> \n"; 
    });
    
    str += "<010>--------------------------------\n";
    
    // 4. TOTALES
    str += `<121>TOTAL: $${order.total.toFixed(2)}\n`; // <121> Negrita, Der, Doble Alto
    
    const statusText = order.status === 'paid' ? 'PAGADO' : 'PENDIENTE';
    str += `<120>${statusText}\n`;
    
    str += "<000> \n";
    str += "<010>Gracias por su preferencia\n";
    str += "<010>Wifi: DulceCrepa_Invitados\n";
    str += "<000>\n\n"; // Saltos finales para cortar papel

    return str;
};