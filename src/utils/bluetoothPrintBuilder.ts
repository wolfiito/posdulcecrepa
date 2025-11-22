// src/utils/bluetoothPrintBuilder.ts
import type { Order } from '../services/orderService';

// Tipos basados en las instrucciones de la App Bluetooth Print
// type: 0=Text, 1=Image, 2=Barcode, 3=QR
// align: 0=Left, 1=Center, 2=Right
// format: 0=Normal, 1=DoubleHeight, 3=DoubleWidth, 4=Small

export const buildReceiptJSON = (order: Order) => {
  const data = [];
  
  const date = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleString('es-MX') 
    : new Date().toLocaleString('es-MX');

  // 1. Encabezado
  data.push({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 3 }); // Doble Ancho
  data.push({ type: 0, content: "Ticket de Venta", bold: 0, align: 1, format: 0 });
  data.push({ type: 0, content: `Fecha: ${date}`, bold: 0, align: 1, format: 4 }); // Small
  data.push({ type: 0, content: `Orden #${order.orderNumber}`, bold: 1, align: 1, format: 0 });
  data.push({ type: 0, content: `[${order.mode}]`, bold: 1, align: 1, format: 0 });
  
  // Separador
  data.push({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  // 2. Productos
  order.items.forEach(item => {
    // Nombre y precio
    const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
    const line = `${item.baseName} ${variant}`;
    
    data.push({ type: 0, content: line, bold: 1, align: 0, format: 0 });
    
    // Modificadores
    if (item.details?.selectedModifiers) {
       item.details.selectedModifiers.forEach(mod => {
           data.push({ type: 0, content: ` + ${mod.name}`, bold: 0, align: 0, format: 4 }); // Small
       });
    }
    // Precio alineado a la derecha (simulado con espacios o en línea aparte si la app no soporta columnas)
    data.push({ type: 0, content: `$${item.finalPrice.toFixed(2)}`, bold: 1, align: 2, format: 0 });
    data.push({ type: 0, content: " ", bold: 0, align: 0, format: 4 }); // Espacio pequeño
  });

  data.push({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

  // 3. Totales
  data.push({ type: 0, content: `TOTAL: $${order.total.toFixed(2)}`, bold: 1, align: 2, format: 1 }); // Doble Alto
  data.push({ type: 0, content: order.status === 'paid' ? 'PAGADO' : 'PENDIENTE', bold: 1, align: 2, format: 0 });

  // 4. Pie de página
  data.push({ type: 0, content: " ", bold: 0, align: 0, format: 0 });
  data.push({ type: 0, content: "Gracias por su preferencia", bold: 0, align: 1, format: 0 });
  data.push({ type: 0, content: "Wifi: DulceCrepa_Invitados", bold: 0, align: 1, format: 0 });
  
  // Espacio final para corte
  data.push({ type: 0, content: "\n\n", bold: 0, align: 0, format: 0 });

  return JSON.stringify(data);
};