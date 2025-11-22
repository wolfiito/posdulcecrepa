// src/services/printService.ts
import { useUIStore } from '../store/useUIStore';
import type { Order } from './orderService';

export const printService = {
  printReceipt: (order: Order) => {
    // 1. Inyectar los datos en el componente <ReceiptTemplate />
    // Accedemos al store fuera de React usando .getState()
    useUIStore.getState().setOrderToPrint(order);

    // 2. Esperar un momento a que React renderice el ticket oculto
    setTimeout(() => {
      // 3. Lanzar el diálogo de impresión nativo
      window.print();
    }, 500); // Medio segundo de espera para asegurar que se pintó el ticket
  }
};