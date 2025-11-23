// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';
import { storage, ref, uploadString, getDownloadURL } from '../firebase';
import { buildReceiptJSON } from '../utils/bluetoothPrintBuilder';

// --- TRUCO PARA PWA (Pantalla de Inicio) ---
// En modo Standalone, window.location.href suele fallar.
// Creamos un enlace invisible y le damos "clic" programáticamente.
const openDeepLink = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_top'; // Ayuda a "romper" el marco de la PWA si es necesario
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    setTimeout(() => {
        document.body.removeChild(link);
    }, 500);
};

export const printService = {
  printReceipt: async (order: Order) => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Detección de SO
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    // --- ESTRATEGIA MÓVIL (App Externa) ---
    if (isIOS || isAndroid) {
      try {
        console.log(`📱 ${isIOS ? 'iOS' : 'Android'} detectado en PWA...`);
        
        // 1. Construir el JSON
        const jsonString = buildReceiptJSON(order);

        if (isIOS) {
            // --- IPHONE (Directo) ---
            const encodedData = encodeURIComponent(jsonString);
            const deepLink = `thermer://?data=${encodedData}`;
            
            console.log("Abriendo Thermer...");
            openDeepLink(deepLink); // <--- USAMOS EL NUEVO MÉTODO

        } else {
            // --- ANDROID (Nube) ---
            // 2. Subir a Firebase
            const fileName = `receipts/order_${order.orderNumber}_${Date.now()}.json`;
            const storageRef = ref(storage, fileName);
            
            await uploadString(storageRef, jsonString, 'raw', { contentType: 'application/json' });
            
            // 3. Obtener URL
            const downloadUrl = await getDownloadURL(storageRef);
            
            // 4. Esquema Android
            const deepLink = `my.bluetoothprint.scheme://${downloadUrl}`;
            
            console.log("Abriendo Bluetooth Print...");
            openDeepLink(deepLink); // <--- USAMOS EL NUEVO MÉTODO
        }

        // Hack para recuperar foco en la PWA
        setTimeout(() => { window.focus(); }, 1000);

      } catch (error) {
        console.error("Error impresión móvil:", error);
        alert("Error al abrir la App de impresión. Intenta de nuevo.");
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