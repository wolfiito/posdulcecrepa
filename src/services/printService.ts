// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

export const printService = {
  printReceipt: (order: Order) => {
    // Detectar si es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // --- ESTRATEGIA IPHONE (Thermer Directo) ---
      try {
        console.log("🍎 iOS detectado: Enviando datos a Thermer...");
        
        // 1. Construir el JSON (Ahora en formato Objeto correcto)
        const jsonString = buildReceiptJSON(order);
        
        // 2. Codificar para URL (Vital para que no se rompa el link)
        const encodedData = encodeURIComponent(jsonString);
        
        // 3. Construir el Link Mágico
        // Usamos el esquema que vimos en el código Swift: thermer://?data=...
        const deepLink = `thermer://?data=${encodedData}`;
        
        // 4. Abrir la App
        window.location.href = deepLink;
        
      } catch (error) {
        console.error("Error impresión iOS:", error);
        alert("Error al generar datos para Thermer.");
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