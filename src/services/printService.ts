// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

export const printService = {
  printReceipt: (order: Order) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      try {
        console.log("🍎 iOS: Generando enlace directo Thermer...");
        
        // 1. Construir el JSON (El formato Objeto que ya verificaste que funciona)
        const jsonString = buildReceiptJSON(order);
        
        // 2. Codificarlo para URL
        const encodedData = encodeURIComponent(jsonString);
        
        // 3. Crear el Deep Link
        const deepLink = `thermer://?data=${encodedData}`;
        
        console.log("Abriendo:", deepLink);

        // 4. Lanzar la App
        // Usamos window.location.href que es lo estándar para deep links
        window.location.href = deepLink;
        
        // Hack para evitar que la pantalla se congele si el usuario regresa:
        // Forzamos un pequeño repintado o focus después de un tiempo
        setTimeout(() => {
            window.focus();
        }, 1000);

      } catch (error) {
        console.error("Error generando link:", error);
        alert("Error al crear el ticket.");
      }

    } else {
      // Estrategia Android/PC
      console.log("🤖 Android/PC: Impresión nativa");
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};