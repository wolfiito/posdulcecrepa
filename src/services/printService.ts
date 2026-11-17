// src/services/printService.ts

import { buildReceiptJSON, buildReceiptString, buildZReportJSON, buildZReportString } from '../utils/bluetoothPrintBuilder';
import type { ReceiptBranchInfo } from '../utils/bluetoothPrintBuilder';
import type { Order } from '../types/order';
import type { Branch } from '../types/branch';
import { db, doc, getDoc } from '../firebase';

// --- DATOS DE SUCURSAL PARA EL ENCABEZADO ---
// Se cargan antes (preloadBranch) para no esperar a Firestore al imprimir:
// en iPhone el deep link a Thermer debe abrirse sin demoras.
const branchCache = new Map<string, ReceiptBranchInfo>();

const preloadBranch = async (branchId?: string | null) => {
    if (!branchId || branchCache.has(branchId)) return;
    try {
        const snap = await getDoc(doc(db, 'branches', branchId));
        if (snap.exists()) {
            const { name, address } = snap.data() as Branch;
            branchCache.set(branchId, { name, address });
        }
    } catch (error) {
        // Sin sucursal el ticket se imprime igual, solo sin encabezado
        console.error("No se pudo cargar la sucursal para el ticket:", error);
    }
};

// --- TRUCO PARA PWA (Pantalla de Inicio) ---
const openDeepLink = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_top'; 
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); }, 500);
};

export const printService = {
  preloadBranch,

  printReceipt: async (order: Order) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const branch = branchCache.get(order.branchId);

    try {
      if (isIOS) {
            // --- IPHONE (NO TOCAR) ---
            // Sigue funcionando como antes
            const jsonString = buildReceiptJSON(order, branch);
            const encodedData = encodeURIComponent(jsonString);
            const deepLink = `thermer://?data=${encodedData}`;
            openDeepLink(deepLink);

          } else if (isAndroid) {
            // --- ANDROID (Método Simple / Offline) ---
            // Generamos el TEXTO con comandos <tags> en lugar de JSON
            const receiptText = buildReceiptString(order, branch);
    
            if (navigator.share) {
                // Esto abrirá el menú nativo de compartir
                // Selecciona "Bluetooth Print" o tu app preferida en la lista
                await navigator.share({
                    text: receiptText,
                    title: `Ticket ${order.orderNumber}` 
                });
            } else {
                alert("Tu dispositivo no soporta la función de compartir nativa.");
            }
      } else {
            // --- PC / DESKTOP ---
            const jsonString = buildReceiptJSON(order, branch);
            const encodedData = encodeURIComponent(jsonString);
            openDeepLink(`thermer://?data=${encodedData}`);
      }
    } catch (error) {
      console.error("Error al intentar imprimir:", error);
      throw new Error("Error de impresión o bloqueo de navegador"); 
    }
  },

  printZReport: async (shift: any, metrics: any, finalCount: number) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    
    try {
      if (isIOS) {
        const jsonString = buildZReportJSON(shift, metrics, finalCount);
        const encodedData = encodeURIComponent(jsonString);
        openDeepLink(`thermer://?data=${encodedData}`);
      } else if (isAndroid) {
        const reportText = buildZReportString(shift, metrics, finalCount);
        if (navigator.share) {
          await navigator.share({
            text: reportText,
            title: `Corte Z - ${new Date().toLocaleDateString()}`
          });
        } else {
          alert("Tu dispositivo no soporta la función de compartir nativa.");
        }
      } else {
        const jsonString = buildZReportJSON(shift, metrics, finalCount);
        const encodedData = encodeURIComponent(jsonString);
        openDeepLink(`thermer://?data=${encodedData}`);
      }
    } catch (error) {
      console.error("Error al imprimir Corte Z:", error);
      throw new Error("Error de impresión");
    }
  }
};