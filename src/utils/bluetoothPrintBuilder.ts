// src/utils/bluetoothPrintBuilder.ts
import { Timestamp } from '../firebase';
import type { Order } from '../types/order';

// CONFIGURACIÓN DE ANCHO (32 caracteres es estándar para 58mm)
const MAX_CHARS = 32;

const formatLine = (leftText: string, rightText: string): string => {
    const spaceNeeded = MAX_CHARS - (leftText.length + rightText.length);
    if (spaceNeeded < 1) return `${leftText.substring(0, MAX_CHARS - rightText.length - 1)} ${rightText}`;
    const spaces = " ".repeat(spaceNeeded);
    return `${leftText}${spaces}${rightText}`;
};
  
const getFormattedDate = (order: Order) => {
    try {
        let d: Date;
        if (order.createdAt instanceof Timestamp) {
            d = order.createdAt.toDate();
        } else if (order.createdAt instanceof Date) {
            d = order.createdAt;
        } else {
            d = new Date();
        }
        return {
            date: d.toLocaleDateString('es-MX'),
            time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        };
    } catch (e) { 
        return { date: "--/--/--", time: "--:--" }; 
    }
};

// ==========================================
// 1. CONSTRUCTOR JSON (Para iPhone/Thermer)
// ==========================================
export const buildReceiptJSON = (order: Order) => {
    const data: Record<string, any> = {};
    let index = 0;
    const add = (item: any) => { data[index.toString().padStart(3, '0')] = item; index++; };
    const { date, time } = getFormattedDate(order);
    const cashierName = order.cashier || 'Cajero General'; 
  
    // Encabezado
    add({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 2 }); 
    add({ type: 0, content: "Sucursal: Centro", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Fecha: ${date}`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Hora: ${time}`, bolde: 0, align: 0, format: 0 });
    add({ type: 0, content: `Atendió: ${cashierName}`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "--------------------------------", bold: 1, align: 1, format: 0 });
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

    // Productos
    order.items.forEach(item => {
      const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
      add({ type: 0, content: formatLine(`${item.baseName} ${variant}`, `$${item.finalPrice.toFixed(2)}`), bold: 1, align: 0, format: 0 });  
      if (item.details?.selectedModifiers) {
         item.details.selectedModifiers.forEach(mod => {
             add({ type: 0, content: formatLine(` + ${mod.name}`, mod.price > 0 ? `$${mod.price.toFixed(2)}` : '$0.00'), bold: 1, align: 0, format: 0 }); 
         });
      }
      add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    });
    
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "--------------------------------", bold: 1, align: 1, format: 0 });

    // Totales
    if (order.payment?.method === 'mixed') {
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });
        if (order.payment.transactions) {
            order.payment.transactions.forEach(tx => {
                let mLabel = tx.method === 'cash' ? "Efectivo" : (tx.method === 'card' ? "Tarjeta" : "Transf.");
                add({ type: 0, content: formatLine(mLabel, `$${tx.amount.toFixed(2)}`), bold: 0, align: 0, format: 0 });
            });
        }
        if (order.payment.change && order.payment.change > 0) add({ type: 0, content: formatLine("Cambio:", `$${order.payment.change.toFixed(2)}`), bold: 1, align: 2, format: 0 });
        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
        add({ type: 0, content: "[PAGO COMBINADO]", bold: 1, align: 1, format: 0 });
    } else {
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        if (order.payment?.method === 'cash') {
             const paid = order.payment.amountPaid || order.total;
             const change = order.payment.change || 0;
             add({ type: 0, content: formatLine("Su Pago:", `$${paid.toFixed(2)}`), bold: 0, align: 2, format: 0 });
             add({ type: 0, content: formatLine("Cambio:", `$${change.toFixed(2)}`), bold: 1, align: 2, format: 0 });
        }
        add({ type: 0, content: `[PAGO ${order.payment?.method === 'card' ? 'TARJETA' : (order.payment?.method === 'transfer' ? 'TRANSFERENCIA' : 'EFECTIVO')}]`.toUpperCase(), bold: 1, align: 1, format: 0 });
    }
    
    add({ type: 0, content: "\n\n\n", bold: 0, align: 0, format: 0 });
    return JSON.stringify(data);
};

// ==========================================
// 2. CONSTRUCTOR STRING (Para Android Share)
// ==========================================
export const buildReceiptString = (order: Order) => {
  let str = "";
  const { date, time } = getFormattedDate(order);
  const cashierName = order.cashier || 'Cajero General';

  // Tags: <BAF> -> B:Bold(0/1), A:Align(0L,1C,2R), F:Font(0N,1DH,2DHW,3DW)
  str += "<112>DULCE CREPA\n"; 
  str += "<010>Sucursal: Centro\n";
  str += `<000>Fecha: ${date}\n`;
  str += `<000>Hora: ${time}\n`;
  str += `<000>Atendió: ${cashierName}\n`;
  str += "<110>--------------------------------\n";

  order.items.forEach(item => {
    const variant = item.details?.variantName ? `(${item.details.variantName})` : '';
    str += `<100>${formatLine(`${item.baseName} ${variant}`, `$${item.finalPrice.toFixed(2)}`)}\n`;
    if (item.details?.selectedModifiers) {
        item.details.selectedModifiers.forEach(mod => {
            str += `<100>  + ${mod.name}\n`;
        });
    }
  });

  str += "<110>--------------------------------\n";

  if (order.payment?.method === 'mixed') {
      str += `<121>Total: $${order.total.toFixed(2)}\n`;
      str += "<010>--------------------------------\n";
      if (order.payment.transactions) {
          order.payment.transactions.forEach(tx => {
              let mLabel = tx.method === 'cash' ? "Efectivo" : (tx.method === 'card' ? "Tarjeta" : "Transf.");
              str += `<000>${formatLine(mLabel, `$${tx.amount.toFixed(2)}`)}\n`;
          });
      }
      if (order.payment.change && order.payment.change > 0) {
          str += `<120>${formatLine("Cambio:", `$${order.payment.change.toFixed(2)}`)}\n`;
      }
      str += "\n<110>[PAGO COMBINADO]\n";
  } else {
      str += `<121>Total: $${order.total.toFixed(2)}\n`;
      if (order.payment?.method === 'cash') {
          const paid = order.payment.amountPaid || order.total;
          const change = order.payment.change || 0;
          str += `<020>${formatLine("Su Pago:", `$${paid.toFixed(2)}`)}\n`;
          str += `<120>${formatLine("Cambio:", `$${change.toFixed(2)}`)}\n`;
      }
      const method = order.payment?.method === 'card' ? 'TARJETA' : (order.payment?.method === 'transfer' ? 'TRANSFERENCIA' : 'EFECTIVO');
      str += `<110>[PAGO ${method}]\n`;
  }

  str += "<010>\n<010>¡Gracias por su compra!\n\n\n\n";
  return str;
};