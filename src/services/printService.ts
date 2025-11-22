// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

export const printService = {
  printReceipt: async (order: Order) => {
    // Detectar iOS (iPhone/iPad)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // --- ESTRATEGIA IPHONE (bprint:// + URL) ---
      try {
        console.log("🍎 iOS detectado: Subiendo ticket a la nube...");
        
        // 1. Generar JSON
        const jsonContent = buildReceiptJSON(order);
        
        // 2. Subir a Firebase Storage
        // Usamos un nombre único
        const fileName = `receipts/order_${order.orderNumber}_${Date.now()}.json`;
        const storageRef = ref(storage, fileName);
        
        await uploadString(storageRef, jsonContent, 'raw', { contentType: 'application/json' });
        
        // 3. Obtener URL Pública
        const downloadUrl = await getDownloadURL(storageRef);
        console.log("Ticket URL:", downloadUrl);

        // 4. Llamar a la App con el esquema bprint://
        // Las instrucciones dicen: bprint://<RESPONSEURL>
        window.location.href = `bprint://${downloadUrl}`;
        
      } catch (error) {
        console.error("Error impresión iOS:", error);
        alert("Error al generar ticket móvil. Verifica tu internet.");
      }

    } else {
      // --- ESTRATEGIA ANDROID / PC ---
      console.log("🤖 Android/PC: Impresión nativa");
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};