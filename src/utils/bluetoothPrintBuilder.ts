// src/utils/bluetoothPrintBuilder.ts
import { Timestamp } from '../firebase';
import type { Order } from '../types/order';
import type { TicketItem } from '../types/menu';
import { getBranchPrice } from './pricing';

// CONFIGURACIÓN DE ANCHO (58mm suele ser 32 caracteres con fuente normal)
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
// 1. DISEÑO DEL TICKET (compartido por Thermer y Android)
// ==========================================

export interface ReceiptBranchInfo {
    name: string;
    address?: string;
}

// Renglón del ticket, independiente del formato de salida (JSON o <tags>)
interface ReceiptLine {
    content: string;
    bold: 0 | 1;
    align: 0 | 1 | 2;   // 0 Izq, 1 Centro, 2 Der
    format: 0 | 1 | 2;  // 0 Normal, 1 Doble Alto, 2 Doble Ancho y Alto
}

const LOGO_PATH = '/logo-dulcecrepa-mono.png';
const DIVIDER = "-".repeat(MAX_CHARS);
const DOUBLE_DIVIDER = "=".repeat(MAX_CHARS);

// Columnas de la tabla de productos: CANT (5) + DESCRIPCION (17) + IMPORTE (10) = 32
const QTY_WIDTH = 5;
const AMOUNT_WIDTH = 10;
const DESC_WIDTH = MAX_CHARS - QTY_WIDTH - AMOUNT_WIDTH;

const money = (value: number) => `$${value.toFixed(2)}`;

const itemRow = (qty: string, desc: string, amount: string) =>
    qty.padEnd(QTY_WIDTH) + desc.padEnd(DESC_WIDTH) + amount.padStart(AMOUNT_WIDTH);

/**
 * Parte un texto en renglones de máximo `width` caracteres sin cortar palabras
 * (solo corta una palabra si por sí sola no cabe en el renglón).
 */
const wrapText = (text: string, width: number): string[] => {
    const lines: string[] = [];
    let current = '';

    text.split(/\s+/).filter(Boolean).forEach(word => {
        while (word.length > width) {
            if (current) { lines.push(current); current = ''; }
            lines.push(word.slice(0, width));
            word = word.slice(width);
        }
        if (!current) current = word;
        else if (`${current} ${word}`.length <= width) current = `${current} ${word}`;
        else { lines.push(current); current = word; }
    });

    if (current) lines.push(current);
    return lines.length > 0 ? lines : [''];
};

/**
 * Junta en un solo renglón los productos idénticos (mismo producto, variante,
 * precio y extras). Pasa al cobrar varias órdenes de un mismo cliente.
 */
const consolidateItems = (items: TicketItem[]): TicketItem[] => {
    const grouped = new Map<string, TicketItem>();

    items.forEach(item => {
        const modsSig = (item.details?.selectedModifiers || []).map(m => m.id).sort().join(',');
        const sig = [
            item.productId || item.baseName,
            item.details?.variantName || '',
            item.finalPrice.toFixed(2),
            modsSig
        ].join('|');

        const existing = grouped.get(sig);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
        } else {
            grouped.set(sig, { ...item, quantity: item.quantity || 1 });
        }
    });

    return Array.from(grouped.values());
};

const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia'
};

const buildReceiptLines = (order: Order, branch?: ReceiptBranchInfo): ReceiptLine[] => {
    const lines: ReceiptLine[] = [];
    const add = (content: string, opts: Partial<Omit<ReceiptLine, 'content'>> = {}) =>
        lines.push({ content, bold: 0, align: 0, format: 0, ...opts });
    const center = (content: string, opts: Partial<Omit<ReceiptLine, 'content'>> = {}) =>
        add(content, { align: 1, ...opts });

    // --- 1. ENCABEZADO DE SUCURSAL ---
    if (branch?.name) center(branch.name, { bold: 1 });
    if (branch?.address) wrapText(branch.address, MAX_CHARS).forEach(l => center(l));
    add(DIVIDER);

    // --- 2. DATOS DE LA ORDEN ---
    const { date, time } = getFormattedDate(order);
    const formatFolio = (n: number) => `#${String(n ?? 0).padStart(4, '0')}`;
    const folios = order.mergedOrderNumbers && order.mergedOrderNumbers.length > 1
        ? order.mergedOrderNumbers
        : [order.orderNumber];

    if (folios.length === 1) {
        add(formatLine(`Folio: ${formatFolio(folios[0])}`, order.mode || ''), { bold: 1 });
    } else {
        // Cuenta con varias órdenes: todos los folios, ajustados al ancho
        add(order.mode || '', { bold: 1 });
        wrapText(`Folios: ${folios.map(formatFolio).join(', ')}`, MAX_CHARS).forEach(l => add(l, { bold: 1 }));
    }
    add(formatLine(`Fecha: ${date}`, time));
    if (order.customerName) add(`Cliente: ${order.customerName}`);
    add(`Atendió: ${order.cashier || 'Cajero General'}`);
    add(DOUBLE_DIVIDER);

    // --- 3. PRODUCTOS ---
    add(itemRow('CANT', 'DESCRIPCION', 'IMPORTE'), { bold: 1 });
    add(DIVIDER);

    const items = consolidateItems(order.items);
    items.forEach(item => {
        const qty = item.quantity || 1;
        const variant = item.details?.variantName ? ` (${item.details.variantName})` : '';
        const [firstLine, ...restLines] = wrapText(`${item.baseName}${variant}`, DESC_WIDTH);

        add(itemRow(String(qty), firstLine, money(item.finalPrice * qty)), { bold: 1 });
        restLines.forEach(l => add(itemRow('', l, '')));

        // Extras con el precio que se cobró en la sucursal de la orden
        item.details?.selectedModifiers?.forEach(mod => {
            const modPrice = getBranchPrice(mod.price, mod.branchPrices, order.branchId);
            const modText = modPrice > 0 ? `+ ${mod.name} ${money(modPrice)}` : `+ ${mod.name}`;
            wrapText(modText, MAX_CHARS - QTY_WIDTH).forEach(l => add(' '.repeat(QTY_WIDTH) + l));
        });

        // Precio unitario cuando hay más de una pieza
        if (qty > 1) add(' '.repeat(QTY_WIDTH) + `${qty} x ${money(item.finalPrice)}`);
    });

    add(DIVIDER);

    // --- 4. TOTALES ---
    const totalUnits = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    add(formatLine('Artículos:', String(totalUnits)));
    add(formatLine('TOTAL:', money(order.total)), { bold: 1, format: 1 });
    add(DIVIDER);

    // --- 5. FORMA DE PAGO ---
    const payment = order.payment;
    if (!payment) {
        center('PENDIENTE DE PAGO', { bold: 1 });
    } else if (payment.method === 'mixed') {
        center('PAGO COMBINADO', { bold: 1 });
        payment.transactions?.forEach(tx => {
            add(formatLine(`${PAYMENT_LABELS[tx.method] || 'Otro'}:`, money(tx.amount)));
        });
        if (payment.change > 0) add(formatLine('Cambio:', money(payment.change)), { bold: 1 });
    } else if (payment.method === 'cash') {
        // totalPaid = lo que entregó el cliente (ej. billete de $500)
        const received = payment.totalPaid || payment.amountPaid || order.total;
        add(formatLine('Efectivo:', money(received)));
        add(formatLine('Cambio:', money(payment.change || 0)), { bold: 1 });
    } else {
        add(formatLine(`${PAYMENT_LABELS[payment.method] || 'Otro'}:`, money(order.total)));
    }

    // --- 6. PIE ---
    add('');
    center('¡Gracias por su visita!', { bold: 1 });
    center('Este no es un comprobante fiscal');

    // Espacios finales para corte
    add('');
    add('');
    add('');

    return lines;
};

// --- Salida para IPHONE / PC (JSON Thermer) ---
export const buildReceiptJSON = (order: Order, branch?: ReceiptBranchInfo) => {
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

    // Type 1 = Imagen. Thermer la descarga desde la URL pública (requiere internet al imprimir)
    add({ type: 1, path: `${window.location.origin}${LOGO_PATH}`, align: 1 });

    buildReceiptLines(order, branch).forEach(line => {
        // Thermer necesita "\n" para imprimir un renglón vacío
        add({ type: 0, ...line, content: line.content || "\n" });
    });

    return JSON.stringify(data);
};

// --- Salida para ANDROID (texto con <tags> para compartir) ---
export const buildReceiptString = (order: Order, branch?: ReceiptBranchInfo) => {
  // Tags: <BAF> -> B:Bold(0/1), A:Align(0L,1C,2R), F:Font(0N,1DH,2DHW,3DW)
  // El modo texto no imprime imágenes, así que el nombre va como encabezado
  let str = "<112>DULCE CREPA\n";

  buildReceiptLines(order, branch).forEach(line => {
      str += `<${line.bold}${line.align}${line.format}>${line.content}\n`;
  });

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
