// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';
import { buildReceiptString } from '../utils/bluetoothPrintBuilder';
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

    } else if (isAndroid) {
      try {
          console.log("🤖 Android: Generando Intent...");
          
          // 1. Obtener el String formateado con <BAF>
          const receiptText = buildReceiptString(order);
          
          // 2. Codificar URL (Vital para que funcionen los símbolos como $ y acentos)
          const encodedText = encodeURIComponent(receiptText);
          
          // 3. Crear el esquema Intent
          // package=mate.bluetoothprint asegura que abra ESA app y no otra
          const intentUrl = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodedText};package=mate.bluetoothprint;end`;
          
          // 4. Lanzar
          window.location.href = intentUrl;
  
      } catch (error) {
          console.error("Error Android intent:", error);
          alert("No se pudo abrir la app de impresión.");
      }
    } else {
      // --- ESTRATEGIA PC (Nativa) ---
      console.log("💻 PC: Impresión nativa");
      useUIStore.getState().setOrderToPrint(order);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
};