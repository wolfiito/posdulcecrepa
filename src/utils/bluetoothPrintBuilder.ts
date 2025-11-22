// src/utils/bluetoothPrintBuilder.ts
import type { Order } from '../services/orderService';

// Basado en la documentación de "Bluetooth Print" App
// type: 0=Text
// align: 0=Left, 1=Center, 2=Right
// format: 0=Normal, 1=Double Height, 2=Double H+W, 3=Double Width, 4=Small

export const buildReceiptJSON = (order: Order) => {
  const data: any[] = [];
  
  // Helper para fecha
  let dateStr = "";
  try {
      if (order.createdAt?.toDate) {
          dateStr = order.createdAt.toDate().toLocaleString('es-MX');
      } else {
          dateStr = new Date().toLocaleString('es-MX');
      }
  } catch (e) { dateStr = new Date().toLocaleString('es-MX'); }

  // 1. ENCABEZADO
  // DULCE CREPA (Centrado, Doble Ancho)
  data.push({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 3 });
  // Ticket (Normal)
  data.push({ type: 0, content: "Ticket de Venta", bold: 0, align: 1, format: 0 });
  // Fecha (Pequeña)
  data.push({ type: 0, content: dateStr, bold: 0, align: 1, format: 4 });
  // Orden (Normal Negrita)
  data.push({ type: 0, content: `Orden #${order.orderNumber}`, bold: 1, align: 1, format: 0 });
  // Modo (Normal Negrita)
  data.push({ type: 0, content: `[${order.mode}]`, bold: 1, align: 1, format: 0 });
  
  // Línea separadora
  data.push({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  // 2. PRODUCTOS
  order.items.forEach(item => {
    const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
    // Nombre del producto (Alineado Izquierda)
    data.push({ type: 0, content: `${item.baseName} ${variant}`, bold: 1, align: 0, format: 0 });
    
    // Modificadores (Pequeño)
    if (item.details?.selectedModifiers) {
       item.details.selectedModifiers.forEach(mod => {
           data.push({ type: 0, content: ` + ${mod.name}`, bold: 0, align: 0, format: 4 });
       });
    }
    
    // Precio (Alineado Derecha)
    data.push({ type: 0, content: `$${item.finalPrice.toFixed(2)}`, bold: 1, align: 2, format: 0 });
    // Espacio pequeño vacio
    data.push({ type: 0, content: " ", bold: 0, align: 0, format: 4 });
  });

  data.push({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  // 3. TOTALES
  // Total (Doble Alto, Derecha)
  data.push({ type: 0, content: `TOTAL: $${order.total.toFixed(2)}`, bold: 1, align: 2, format: 1 });
  
  const statusText = order.status === 'paid' ? 'PAGADO' : 'PENDIENTE';
  data.push({ type: 0, content: statusText, bold: 1, align: 2, format: 0 });

  // 4. PIE DE PAGINA
  data.push({ type: 0, content: " ", bold: 0, align: 0, format: 0 });
  data.push({ type: 0, content: "Gracias por su preferencia", bold: 0, align: 1, format: 0 });
  data.push({ type: 0, content: "Wifi: DulceCrepa_Invitados", bold: 0, align: 1, format: 0 });
  
  // Espacio final para corte (Salto de línea x2)
  data.push({ type: 0, content: "\n\n", bold: 0, align: 0, format: 0 });

  return JSON.stringify(data);
};