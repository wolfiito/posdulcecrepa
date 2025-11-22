// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

export const printService = {
  printReceipt: async (order: Order) => {
    // Detectar si es iOS (iPhone/iPad)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // --- ESTRATEGIA IPHONE (App Bluetooth Print) ---
      try {
        console.log("🍎 Detectado iOS: Generando enlace para Bluetooth Print App...");
        
        // 1. Generar JSON
        const jsonContent = buildReceiptJSON(order);
        
        // 2. Subir a Firebase Storage (archivo temporal)
        // Usamos el timestamp para que el nombre sea único
        const fileName = `receipts/order_${order.orderNumber}_${Date.now()}.json`;
        const storageRef = ref(storage, fileName);
        
        await uploadString(storageRef, jsonContent, 'raw', { contentType: 'application/json' });
        
        // 3. Obtener URL pública
        const downloadUrl = await getDownloadURL(storageRef);
        console.log("URL del Ticket:", downloadUrl);

        // 4. Abrir la App de Impresión
        // El esquema es bprint://<URL>
        window.location.href = `bprint://${downloadUrl}`;
        
      } catch (error) {
        console.error("Error al generar impresión iOS:", error);
        alert("Error al conectar con la App de impresión. Intenta de nuevo.");
      }

    } else {
      // --- ESTRATEGIA ANDROID / PC (Nativa) ---
      console.log("🤖 Detectado Android/PC: Usando impresión nativa (RawBT recomendado en Android)");
      
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};