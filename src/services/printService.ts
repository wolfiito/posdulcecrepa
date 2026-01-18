// src/services/printService.ts
import { buildReceiptJSON, buildReceiptString } from '../utils/bluetoothPrintBuilder';
import type { Order } from '../types/order';

export const printService = {
  printReceipt: async (order: Order) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    
    try {
      if (isIOS) {
        // --- IPHONE (Thermer) ---
        const jsonString = buildReceiptJSON(order);
        const encodedData = encodeURIComponent(jsonString);
        window.location.href = `thermer://?data=${encodedData}`;

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
        // --- PC (Descarga JSON para pruebas) ---
        const jsonString = buildReceiptJSON(order);
        console.log(jsonString);
        alert("En PC no se puede imprimir directo. Revisa la consola.");
      }
    } catch (error: any) {
       // Ignoramos el error si el usuario cancela el menú de compartir
       if (error.name !== 'AbortError') {
         console.error("Error al imprimir:", error);
         alert("Error al intentar imprimir.");
       }
    }
  }
};