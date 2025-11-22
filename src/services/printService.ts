// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

export const printService = {
  printReceipt: (order: Order) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Detección robusta de SO
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    // ESTRATEGIA MÓVIL (App Externa Directa)
    if (isIOS || isAndroid) {
      try {
        console.log(`📱 ${isIOS ? 'iOS' : 'Android'} detectado: Generando enlace directo...`);
        
        // 1. Construir el JSON del ticket
        const jsonString = buildReceiptJSON(order);
        
        // 2. Codificarlo para URL (Indispensable)
        const encodedData = encodeURIComponent(jsonString);
        
        // 3. Seleccionar el esquema correcto según la App instalada
        let deepLink = '';
        
        if (isIOS) {
            // Para iPhone (App Thermer) - Ya validaste que este funciona
            deepLink = `thermer://?data=${encodedData}`;
        } else {
            // Para Android (App Bluetooth Print)
            // Usamos el esquema de la documentación, pero con el método de datos directo
            deepLink = `my.bluetoothprint.scheme://?data=${encodedData}`;
        }
        
        // 4. Lanzar la App
        console.log("Abriendo App de impresión:", deepLink);
        window.location.href = deepLink;
        
        // Hack para recuperar el foco si el usuario regresa al navegador
        setTimeout(() => {
            window.focus();
        }, 1000);

      } catch (error) {
        console.error("Error generando link móvil:", error);
        alert("Error al intentar abrir la App de impresión.");
      }

    } else {
      // ESTRATEGIA PC/LAPTOP (Nativa)
      console.log("💻 PC detectada: Impresión nativa del navegador");
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};