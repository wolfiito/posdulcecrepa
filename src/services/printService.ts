// src/services/printService.ts

import { buildReceiptJSON, buildReceiptString } from '../utils/bluetoothPrintBuilder';
import type { Order } from '../types/order';

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
  printReceipt: async (order: Order) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    
    try {
      if (isIOS) {
            // --- IPHONE (NO TOCAR) ---
            // Sigue funcionando como antes
            const jsonString = buildReceiptJSON(order);
            const encodedData = encodeURIComponent(jsonString);
            const deepLink = `thermer://?data=${encodedData}`;
            openDeepLink(deepLink);

          } else if (isAndroid) {
            // --- ANDROID (Método Simple / Offline) ---
            // Generamos el TEXTO con comandos <tags> en lugar de JSON
            const receiptText = buildReceiptString(order);
    
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
            const jsonString = buildReceiptJSON(order);
            const encodedData = encodeURIComponent(jsonString);
            openDeepLink(`thermer://?data=${encodedData}`);
      }
    } catch (error) {
      console.error("Error al intentar imprimir:", error);
      throw new Error("Error de impresión o bloqueo de navegador"); 
    }
  }
};