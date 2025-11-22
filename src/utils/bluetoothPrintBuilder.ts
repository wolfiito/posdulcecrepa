// src/utils/bluetoothPrintBuilder.ts
import type { Order } from '../services/orderService';

export const buildReceiptJSON = (order: Order) => {
  // La app espera un OBJETO con índices numéricos (0, 1, 2...)
  const data: Record<string, any> = {};
  let index = 0;
  
  const add = (item: any) => {
    data[`${index}`] = item;
    index++;
  };

  // Fecha
  let dateStr = "";
  try {
      if (order.createdAt?.toDate) {
          dateStr = order.createdAt.toDate().toLocaleString('es-MX');
      } else {
          dateStr = new Date().toLocaleString('es-MX');
      }
  } catch (e) { dateStr = new Date().toLocaleString('es-MX'); }

  // --- TICKET ---
  add({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 3 }); // Título Grande
  add({ type: 0, content: "Ticket de Venta", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: dateStr, bold: 0, align: 1, format: 4 });
  add({ type: 0, content: `Orden #${order.orderNumber}`, bold: 1, align: 1, format: 0 });
  add({ type: 0, content: `[${order.mode}]`, bold: 1, align: 1, format: 0 });
  
  add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  // Productos
  order.items.forEach(item => {
    const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
    
    // Nombre
    add({ type: 0, content: `${item.baseName} ${variant}`, bold: 1, align: 0, format: 0 });
    
    // Extras
    if (item.details?.selectedModifiers) {
       item.details.selectedModifiers.forEach(mod => {
           add({ type: 0, content: ` + ${mod.name}`, bold: 0, align: 0, format: 4 });
       });
    }
    
    // Precio
    add({ type: 0, content: `$${item.finalPrice.toFixed(2)}`, bold: 1, align: 2, format: 0 });
    add({ type: 0, content: " ", bold: 0, align: 0, format: 4 }); // Espacio
  });

  add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  // Totales
  add({ type: 0, content: `TOTAL: $${order.total.toFixed(2)}`, bold: 1, align: 2, format: 1 });
  const statusText = order.status === 'paid' ? 'PAGADO' : 'PENDIENTE';
  add({ type: 0, content: statusText, bold: 1, align: 2, format: 0 });

  // Footer
  add({ type: 0, content: " ", bold: 0, align: 0, format: 0 });
  add({ type: 0, content: "Gracias por su preferencia", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: "Wifi: DulceCrepa_Invitados", bold: 0, align: 1, format: 0 });
  add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
  add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

  return JSON.stringify(data);
};