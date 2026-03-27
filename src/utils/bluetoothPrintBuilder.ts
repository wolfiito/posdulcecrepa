// src/utils/bluetoothPrintBuilder.ts
import { Timestamp } from '../firebase';
import type { Order } from '../types/order';

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
        let d: Date;

        // VERIFICACIÓN SEGURA DE TIPOS
        if (order.createdAt instanceof Timestamp) {
            // Si es Timestamp de Firebase, lo convertimos
            d = order.createdAt.toDate();
        } else if (order.createdAt instanceof Date) {
            // Si ya es Date, lo usamos directo
            d = order.createdAt;
        } else {
            // Si es FieldValue (aún no guardado) o null, usamos fecha actual
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
    const cashierName = order.cashier || 'Cajero General';
    // --- 1. ENCABEZADO ---
    // Format 2 = Doble Ancho y Alto (Gigante)
    add({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 2 }); 
    add({ type: 0, content: "Sucursal: Centro", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Fecha: ${date}`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Hora: ${time}`, bolde: 0, align: 0, format: 0 });
    add({ type: 0, content: `Atendió: ${cashierName}`, bold: 0, align: 0, format: 0 });
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
    add({ type: 0, content: "--------------------------------", bold: 1, align: 1, format: 0 });

  // --- 3. TOTALES Y PAGOS (LÓGICA MEJORADA) ---
  
  // A. PAGO CON TARJETA
  if (order.payment?.method === 'card') {
    add({ type: 0, content: formatLine("Subtotal:", `$${order.total.toFixed(2)}`), bold: 0, align: 2, format: 0 });
    add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
    add({ type: 0, content: "[PAGO CON TARJETA]", bold: 1, align: 1, format: 0 });

  // B. PAGO EN EFECTIVO
  } else if (order.payment?.method === 'cash') {
    add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
    const paid = order.payment.amountPaid || order.total;
    const change = order.payment.change || 0;
    add({ type: 0, content: formatLine("Su Pago:", `$${paid.toFixed(2)}`), bold: 0, align: 2, format: 0 });
    add({ type: 0, content: formatLine("Cambio:", `$${change.toFixed(2)}`), bold: 1, align: 2, format: 0 });
    add({ type: 0, content: "[PAGO EN EFECTIVO]", bold: 1, align: 1, format: 0 });

  // C. TRANSFERENCIA
  } else if (order.payment?.method === 'transfer') {
    add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
    add({ type: 0, content: "[TRANSFERENCIA]", bold: 1, align: 1, format: 0 });

  // D. 👇 NUEVO: PAGO COMBINADO (MIXTO) 👇
  } else if (order.payment?.method === 'mixed') {
    add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
    add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });
    
    // Recorremos las transacciones guardadas en order.payment.transactions
    if (order.payment.transactions && order.payment.transactions.length > 0) {
        order.payment.transactions.forEach(tx => {
            // Traducimos el método a español para el ticket
            let methodLabel = "Otro";
            if (tx.method === 'cash') methodLabel = "Efectivo";
            if (tx.method === 'card') methodLabel = "Tarjeta";
            if (tx.method === 'transfer') methodLabel = "Transf.";

            add({ 
                type: 0, 
                content: formatLine(methodLabel, `$${tx.amount.toFixed(2)}`), 
                bold: 0, 
                align: 0, 
                format: 0 
            });
        });
    }
    
    if (order.payment.change && order.payment.change > 0) {
         add({ type: 0, content: formatLine("Cambio:", `$${order.payment.change.toFixed(2)}`), bold: 1, align: 2, format: 0 });
    }

    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "[PAGO COMBINADO]", bold: 1, align: 1, format: 0 });

  // E. OTROS (Pendiente)
  } else {
      add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
      const statusText = order.status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO';
      add({ type: 0, content: statusText, bold: 1, align: 1, format: 0 });
}

// Espacios finales para corte
add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

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

// ==========================================
// 3. CONSTRUCTORES PARA CORTE Z
// ==========================================

const formatReportDate = (val: any) => {
    if (!val) return '--/-- --:--';
    const d = val instanceof Timestamp ? val.toDate() : new Date(val);
    return d.toLocaleString('es-MX', { 
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
};

export const buildZReportJSON = (shift: any, metrics: any, finalCount: number) => {
    const data: Record<string, any> = {};
    let index = 0;
    const add = (item: any) => {
      const key = index.toString().padStart(3, '0'); 
      data[key] = item;
      index++;
    };

    const difference = finalCount - metrics.expectedCash;

    add({ type: 0, content: "CORTE Z", bold: 1, align: 1, format: 2 });
    add({ type: 0, content: "DULCE CREPA", bold: 1, align: 1, format: 0 });
    add({ type: 0, content: `Cajero: ${shift.openedBy}`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Apertura: ${formatReportDate(shift.openedAt)}`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: `Cierre: ${formatReportDate(new Date())}`, bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "--------------------------------", bold: 1, align: 1, format: 0 });

    add({ type: 0, content: "BALANCE FINANCIERO", bold: 1, align: 1, format: 0 });
    add({ type: 0, content: formatLine("(+) Ventas Totales:", `$${metrics.totalSales.toFixed(2)}`), bold: 0, align: 0, format: 0 });
    add({ type: 0, content: formatLine("(-) Gastos Totales:", `-$${metrics.totalExpenses.toFixed(2)}`), bold: 0, align: 0, format: 0 });
    add({ type: 0, content: formatLine("UTILIDAD NETA:", `$${metrics.netBalance.toFixed(2)}`), bold: 1, align: 0, format: 0 });
    add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

    add({ type: 0, content: "CUADRE DE EFECTIVO", bold: 1, align: 1, format: 0 });
    add({ type: 0, content: formatLine("Fondo Inicial:", `$${shift.initialFund.toFixed(2)}`), bold: 0, align: 0, format: 0 });
    add({ type: 0, content: formatLine("(+) Venta Efec:", `$${metrics.cashTotal.toFixed(2)}`), bold: 0, align: 0, format: 0 });
    add({ type: 0, content: formatLine("(-) Gastos Efec:", `-$${metrics.totalExpenses.toFixed(2)}`), bold: 0, align: 0, format: 0 });
    add({ type: 0, content: formatLine("DEBE HABER:", `$${metrics.expectedCash.toFixed(2)}`), bold: 1, align: 0, format: 0 });
    add({ type: 0, content: formatLine("REAL (CONTADO):", `$${finalCount.toFixed(2)}`), bold: 1, align: 0, format: 0 });
    add({ type: 0, content: formatLine("DIFERENCIA:", `${difference >= 0 ? '+' : ''}$${difference.toFixed(2)}`), bold: 1, align: 0, format: 0 });
    add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });

    if (metrics.productBreakdown && metrics.productBreakdown.length > 0) {
        add({ type: 0, content: "PRODUCTOS VENDIDOS", bold: 1, align: 1, format: 0 });
        metrics.productBreakdown.forEach((p: any) => {
            add({ type: 0, content: formatLine(`${p.quantity}x ${p.name}`, `$${p.total.toFixed(2)}`), bold: 0, align: 0, format: 0 });
        });
        add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });
    }

    add({ type: 0, content: "\n\n__________________________", bold: 0, align: 1, format: 0 });
    add({ type: 0, content: "Firma de Conformidad", bold: 1, align: 1, format: 0 });
    add({ type: 0, content: "\n\n\n\n", bold: 0, align: 0, format: 0 });

    return JSON.stringify(data);
};

export const buildZReportString = (shift: any, metrics: any, finalCount: number) => {
    let str = "";
    const difference = finalCount - metrics.expectedCash;

    str += "<112>CORTE Z\n"; 
    str += "<110>DULCE CREPA\n";
    str += `<000>Cajero: ${shift.openedBy}\n`;
    str += `<000>Apertura: ${formatReportDate(shift.openedAt)}\n`;
    str += `<000>Cierre: ${formatReportDate(new Date())}\n`;
    str += "<110>--------------------------------\n";

    str += "<110>BALANCE FINANCIERO\n";
    str += `<000>${formatLine("(+) Ventas Totales:", `$${metrics.totalSales.toFixed(2)}`)}\n`;
    str += `<000>${formatLine("(-) Gastos Totales:", `-$${metrics.totalExpenses.toFixed(2)}`)}\n`;
    str += `<100>${formatLine("UTILIDAD NETA:", `$${metrics.netBalance.toFixed(2)}`)}\n`;
    str += "<110>--------------------------------\n";

    str += "<110>CUADRE DE EFECTIVO\n";
    str += `<000>${formatLine("Fondo Inicial:", `$${shift.initialFund.toFixed(2)}`)}\n`;
    str += `<000>${formatLine("(+) Venta Efec:", `$${metrics.cashTotal.toFixed(2)}`)}\n`;
    str += `<000>${formatLine("(-) Gastos Efec:", `-$${metrics.totalExpenses.toFixed(2)}`)}\n`;
    str += `<100>${formatLine("DEBE HABER:", `$${metrics.expectedCash.toFixed(2)}`)}\n`;
    str += `<100>${formatLine("REAL (CONTADO):", `$${finalCount.toFixed(2)}`)}\n`;
    str += `<120>${formatLine("DIFERENCIA:", `${difference >= 0 ? '+' : ''}$${difference.toFixed(2)}`)}\n`;
    str += "<110>--------------------------------\n";

    if (metrics.productBreakdown && metrics.productBreakdown.length > 0) {
        str += "<110>PRODUCTOS VENDIDOS\n";
        metrics.productBreakdown.forEach((p: any) => {
            str += `<100>${formatLine(`${p.quantity}x ${p.name}`, `$${p.total.toFixed(2)}`)}\n`;
        });
        str += "<110>--------------------------------\n";
    }

    str += "\n\n<010>__________________________\n";
    str += "<110>Firma de Conformidad\n\n\n\n\n";

    return str;
};