import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';
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
    
    // Generamos el JSON del ticket
    const jsonString = buildReceiptJSON(order);

    try {
      if (isIOS || isAndroid) {
        console.log(`📱 ${isIOS ? 'iOS' : 'Android'} detectado...`);
        
        if (isIOS) {
            // --- IPHONE (Thermer Directo) ---
            const encodedData = encodeURIComponent(jsonString);
            const deepLink = `thermer://?data=${encodedData}`;
            openDeepLink(deepLink);

        } else {
            // --- ANDROID (RawBT / Bluetooth Print - Vía Firebase) ---
            const fileName = `receipts/order_${order.orderNumber}_${Date.now()}.json`;
            const storageRef = ref(storage, fileName);
            
            // Subimos el ticket temporalmente
            await uploadString(storageRef, jsonString, 'raw', { contentType: 'application/json' });
            const downloadUrl = await getDownloadURL(storageRef);
            
            // Esquema para abrir app externa
            const deepLink = `my.bluetoothprint.scheme://${downloadUrl}`;
            openDeepLink(deepLink);
        }
        
        setTimeout(() => { window.focus(); }, 1000);

      } else {
        // --- PC / DESKTOP ---
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