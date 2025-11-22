// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

export const printService = {
  printReceipt: (order: Order) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Detecciones
    const isAndroid = /android/i.test(userAgent);
    // Detección robusta de iOS (incluye iPads en modo escritorio)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                  (userAgent.includes("Mac") && navigator.maxTouchPoints > 1);

    // 1. Construir los datos (Igual para ambos)
    const jsonString = buildReceiptJSON(order);
    const encodedData = encodeURIComponent(jsonString);

    if (isIOS) {
      // --- IPHONE (Enlace Directo) ---
      console.log("🍎 iOS: Abriendo Thermer...");
      window.location.href = `thermer://?data=${encodedData}`;
      
      setTimeout(() => window.focus(), 1000);
    } 
    else if (isAndroid) {
      // --- ANDROID (Intent) ---
      console.log("🤖 Android: Abriendo Thermer vía Intent...");
      
      // En Android usamos un "Intent" que fuerza a abrir la app mate.bluetoothprint
      // Si el esquema 'thermer' falla, prueba cambiarlo a 'my.bluetoothprint.scheme'
      const scheme = 'thermer'; 
      const packageId = 'mate.bluetoothprint';
      
      const intentUrl = `intent://?data=${encodedData}#Intent;scheme=${scheme};package=${packageId};end`;
      
      window.location.href = intentUrl;
    } 
    else {
      // --- PC / OTROS (Nativo) ---
      console.log("🖥️ PC: Impresión nativa");
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};