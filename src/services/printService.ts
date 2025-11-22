// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

export const printService = {
  printReceipt: async (order: Order) => {
    // Detectar si es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // --- ESTRATEGIA IPHONE (App Bluetooth Print) ---
      try {
        console.log("🍎 iOS detectado: Generando ticket para App Externa...");
        
        // 1. Construir JSON
        const jsonContent = buildReceiptJSON(order);
        
        // 2. Subir a Firebase Storage
        // Nombre único para evitar caché
        const fileName = `receipts/order_${order.orderNumber}_${Date.now()}.json`;
        const storageRef = ref(storage, fileName);
        
        // Subir cadena JSON
        await uploadString(storageRef, jsonContent, 'raw', { contentType: 'application/json' });
        
        // 3. Obtener URL pública
        const downloadUrl = await getDownloadURL(storageRef);
        console.log("Ticket URL:", downloadUrl);

        // 4. Abrir App Bluetooth Print
        // Esto saca al usuario de Safari y abre la App de impresión
        window.location.href = `bprint://${downloadUrl}`;
        
      } catch (error) {
        console.error("Error generando ticket iOS:", error);
        alert("Error al preparar la impresión. Verifica tu conexión.");
      }

    } else {
      // --- ESTRATEGIA ANDROID / PC (Nativa) ---
      console.log("🤖 Android/PC: Usando impresión del navegador");
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};