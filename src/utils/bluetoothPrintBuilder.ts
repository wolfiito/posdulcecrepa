// src/utils/bluetoothPrintBuilder.ts
import { Timestamp } from '../firebase';
import type { Order } from '../types/order';

// CONFIGURACIÓN DE ANCHO (Estándar 58mm = 32 caracteres)
const MAX_CHARS = 32;

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
// 1. CONSTRUCTOR JSON (Para bprint:// y Thermer)
// ==========================================
export const buildReceiptJSON = (order: Order) => {
    const data: Record<string, any> = {};
    let index = 0;
    
    // Función auxiliar para agregar líneas al objeto JSON
    // Usamos padStart para asegurar el orden (000, 001, 002...)
    const add = (item: any) => {
      const key = index.toString().padStart(3, '0'); 
      data[key] = item;
      index++;
    };
  
    const { date, time } = getFormattedDate(order);
    
    // Recuperamos el nombre del cajero o ponemos un default
    const cashierName = order.cashier || 'Cajero General'; 
  
    // --- 1. ENCABEZADO ---
    // Format: 0=Normal, 1=Doble Alto, 2=Doble Alto+Ancho
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
      
      // Extras / Modificadores
      if (item.details?.selectedModifiers) {
         item.details.selectedModifiers.forEach(mod => {
            const modName = ` + ${mod.name}`;
            const modPrice = mod.price > 0 ? `$${mod.price.toFixed(2)}` : '$0.00';
             add({ 
                type: 0, 
                content: formatLine(modName, modPrice), 
                bold: 1, 
                align: 0, 
                format: 0 }); 
         });
      }
      // Espacio pequeño entre items
      add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    });
    
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "--------------------------------", bold: 1, align: 1, format: 0 });

    // --- 3. TOTALES Y PAGOS (Lógica Completa) ---
  
    // CASO A: PAGO CON TARJETA
    if (order.payment?.method === 'card') {
        add({ type: 0, content: formatLine("Subtotal:", `$${order.total.toFixed(2)}`), bold: 0, align: 2, format: 0 });
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        add({ type: 0, content: "[PAGO CON TARJETA]", bold: 1, align: 1, format: 0 });

    // CASO B: PAGO EN EFECTIVO
    } else if (order.payment?.method === 'cash') {
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        
        const paid = order.payment.amountPaid || order.total;
        const change = order.payment.change || 0;

        add({ type: 0, content: formatLine("Su Pago:", `$${paid.toFixed(2)}`), bold: 0, align: 2, format: 0 });
        add({ type: 0, content: formatLine("Cambio:", `$${change.toFixed(2)}`), bold: 1, align: 2, format: 0 });
        add({ type: 0, content: "[PAGO EN EFECTIVO]", bold: 1, align: 1, format: 0 });

    // CASO C: TRANSFERENCIA
    } else if (order.payment?.method === 'transfer') {
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        add({ type: 0, content: "[TRANSFERENCIA]", bold: 1, align: 1, format: 0 });

    // CASO D: PAGO COMBINADO (MIXTO)
    } else if (order.payment?.method === 'mixed') {
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        add({ type: 0, content: "--------------------------------", bold: 0, align: 1, format: 0 });
        
        // Desglose de transacciones
        if (order.payment.transactions && order.payment.transactions.length > 0) {
            order.payment.transactions.forEach(tx => {
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
        
        // Cambio (si aplica en la parte de efectivo)
        if (order.payment.change && order.payment.change > 0) {
             add({ type: 0, content: formatLine("Cambio:", `$${order.payment.change.toFixed(2)}`), bold: 1, align: 2, format: 0 });
        }

        add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
        add({ type: 0, content: "[PAGO COMBINADO]", bold: 1, align: 1, format: 0 });

    // CASO E: DEFAULT (Pendiente o sin pago)
    } else {
        add({ type: 0, content: formatLine("TOTAL:", `$${order.total.toFixed(2)}`), bold: 1, align: 2, format: 1 });
        const statusText = order.status === 'paid' ? 'PAGADO' : 'PENDIENTE DE PAGO';
        add({ type: 0, content: statusText, bold: 1, align: 1, format: 0 });
    }

    // Espacios finales para corte de papel
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });
    add({ type: 0, content: "\n", bold: 0, align: 0, format: 0 });

    return JSON.stringify(data);
};

// ==========================================
// 2. CONSTRUCTOR STRING (Opcional / Fallback)
// ==========================================
// Mantenemos esta función por si decides usar navigator.share en el futuro
export const buildReceiptString = (order: Order) => {
  // Por ahora retornamos vacío ya que usarás bprint:// (JSON)
  // Si necesitas la versión texto avísame y la agrego aquí también.
  return ""; 
};