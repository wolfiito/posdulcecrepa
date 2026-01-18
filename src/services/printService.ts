// src/services/printService.ts
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';
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
            // --- ANDROID (Nueva Lógica bprint://) ---
            console.log("🤖 Android: Subiendo ticket para bprint...");

            // 1. Generamos el JSON con los datos corregidos (Cajero, Pagos)
            const jsonString = buildReceiptJSON(order);
            
            // 2. Subimos a Firebase (porque bprint:// necesita una URL)
            const fileName = `receipts/order_${order.orderNumber}_${Date.now()}.json`;
            const storageRef = ref(storage, fileName);
            
            // Subimos como JSON válido
            await uploadString(storageRef, jsonString, 'raw', { contentType: 'application/json' });
            const downloadUrl = await getDownloadURL(storageRef);
            
            // 3. Construimos el link según las instrucciones: bprint://<URL>
            const deepLink = `bprint://${downloadUrl}`;
            
            console.log("Abriendo:", deepLink);
            
            // 4. Intentamos abrir la app
            // IMPORTANTE: Si Chrome bloquea esto, el usuario deberá darle a "Permitir pop-up"
            // o intentar de nuevo.
            window.location.href = deepLink;

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