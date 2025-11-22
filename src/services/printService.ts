// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';
import { buildReceiptString } from '../utils/bluetoothPrintBuilder';
export const printService = {
  printReceipt: async (order: Order) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Detección de Sistema Operativo
    // (Nota: iPad/iPhone se detectan como iOS, el resto asumimos Android o PC)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    if (isIOS) {
      // --- ESTRATEGIA IPHONE (Directa - Thermer) ---
      try {
        console.log("🍎 iOS: Enviando datos directos...");
        const jsonString = buildReceiptJSON(order);
        const encodedData = encodeURIComponent(jsonString);
        const deepLink = `thermer://?data=${encodedData}`;
        
        window.location.href = deepLink;
        
        setTimeout(() => { window.focus(); }, 1000);

      } catch (error) {
        console.error("Error iOS:", error);
        alert("Error al abrir Thermer.");
      }

    } else if (isAndroid) {
      // --- ESTRATEGIA ANDROID OFFLINE (Web Share API) ---
      try {
        console.log("🤖 Android: Intentando compartir texto nativo...");
        
        const receiptText = buildReceiptString(order);

        // Verificamos si el navegador soporta compartir
        if (navigator.share) {
            await navigator.share({
                title: `Ticket #${order.orderNumber}`,
                text: receiptText, // Aquí va el string con etiquetas <BAF>
            });
            console.log("Menú de compartir abierto con éxito");
        } else {
            // Fallback por si el navegador es muy viejo (raro hoy en día)
            alert("Tu navegador no soporta la impresión nativa directa. Intenta usar Chrome actualizado.");
        }

      } catch (error) {
        // El usuario canceló el menú de compartir o hubo error
        if ((error as any).name !== 'AbortError') {
             console.error("Error al compartir:", error);
             alert("Error al intentar abrir el menú de impresión.");
        }
      }

    } else {
      // --- ESTRATEGIA PC (Nativa) ---
      console.log("💻 PC: Impresión nativa");
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};