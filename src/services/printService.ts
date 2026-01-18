import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON, buildReceiptString } from '../utils/bluetoothPrintBuilder';
import type { Order } from '../types/order'; // <--- Importación corregida

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
      if (isIOS || isAndroid) {
        console.log(`📱 ${isIOS ? 'iOS' : 'Android'} detectado...`);
        
        if (isIOS) {
            // --- IPHONE (Thermer Directo) ---
               // Generamos el JSON del ticket
            const jsonString = buildReceiptJSON(order);
            const encodedData = encodeURIComponent(jsonString);
            const deepLink = `thermer://?data=${encodedData}`;
            openDeepLink(deepLink);

        }  
      } else if (isAndroid) {
           try {
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
        
        setTimeout(() => { window.focus(); }, 1000);

      } else {
        // --- PC / DESKTOP ---
        const jsonString = buildReceiptJSON(order);
        const encodedData = encodeURIComponent(jsonString);
        const deepLink = `thermer://?data=${encodedData}`;
        openDeepLink(deepLink);
      }
    } catch (error) {
      console.error("Error al intentar imprimir:", error);
      // Lanzamos el error para que la UI (el Toast) avise al usuario, en lugar de un alert feo.
      throw new Error("No se pudo abrir la app de impresión"); 
    }
  }
};