import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { printService } from './printService'; // <--- Importamos el nuevo servicio
import type { TicketItem } from '../types/menu';

export interface Order {
  items: TicketItem[];
  total: number;
  mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar';
  status: 'pending' | 'paid' | 'cancelled';
  orderNumber: number;
  createdAt: any;
}

export const orderService = {
  async createOrder(
    items: TicketItem[], 
    total: number, 
    mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar', 
    orderNumber: number
  ): Promise<string> {
    
    const initialStatus = mode === 'Para Llevar' ? 'paid' : 'pending';

    const newOrder: Order = {
      items,
      total,
      mode,
      status: initialStatus,
      orderNumber,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), newOrder);
      
      // --- LÓGICA DE IMPRESIÓN AUTOMÁTICA ---
      if (initialStatus === 'paid') {
        // Si se cobró, imprimimos ticket cliente
        console.log("🖨️ Imprimiendo Ticket...");
        printService.printReceipt(newOrder);
      } else {
        // Si es para mesa (pendiente), podríamos imprimir solo comanda
        // Por ahora imprimimos el mismo ticket para probar
        printService.printReceipt(newOrder); 
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creando orden:", error);
      throw error;
    }
  }
};