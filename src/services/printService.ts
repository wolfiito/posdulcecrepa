// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

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

    } else {
      // --- ESTRATEGIA ANDROID (Nube - Bluetooth Print) ---
      try {
        console.log("🤖 Android: Subiendo ticket para compatibilidad...");
        
        // 1. Generar JSON
        const jsonContent = buildReceiptJSON(order);
        
        // 2. Subir a Firebase Storage (Necesario según docs de Android)
        const fileName = `receipts/order_${order.orderNumber}_${Date.now()}.json`;
        const storageRef = ref(storage, fileName);
        
        // Subimos el archivo
        await uploadString(storageRef, jsonContent, 'raw', { contentType: 'application/json' });
        
        // 3. Obtener URL
        const downloadUrl = await getDownloadURL(storageRef);
        
        // 4. Construir esquema para Android
        // Documentación: my.bluetoothprint.scheme://<URL>
        const deepLink = `my.bluetoothprint.scheme://${downloadUrl}`;
        
        console.log("Abriendo:", deepLink);
        window.location.href = deepLink;

      } catch (error) {
        console.error("Error Android:", error);
        alert("Error: No se pudo subir el ticket. Revisa tu internet.");
      }

    // } else {
    //   // --- ESTRATEGIA PC (Nativa) ---
    //   console.log("💻 PC: Impresión nativa");
    //   useUIStore.getState().setOrderToPrint(order);
    //   setTimeout(() => {
    //     window.print();
      // }, 500);
    }
  }
};