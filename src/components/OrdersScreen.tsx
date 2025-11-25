// src/components/OrdersScreen.tsx
import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, getDocs, updateDoc, doc, serverTimestamp } from '../firebase';
import type { Order } from '../services/orderService';
import { PaymentModal } from './PaymentModal';
import { printService } from '../services/printService';
import { useAuthStore } from '../store/useAuthStore'; // <--- 1. IMPORTAR STORE
import { useShiftStore } from '../store/useShiftStore';
import { useUIStore } from '../store/useUIStore';

export const OrdersScreen: React.FC = () => {
  const { currentUser } = useAuthStore(); // <--- 2. OBTENER USUARIO
  const { openShiftModal } = useUIStore();
  const { currentShift } = useShiftStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
        const start = new Date(); start.setHours(0,0,0,0);
        const q = query(
            collection(db, "orders"),
            where("status", "==", "pending"),
            where("createdAt", ">=", start),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id } as any));
        setOrders(loaded);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handlePay = async (paymentDetails: any) => {
      if (!selectedOrder || !selectedOrder.id) return;
      try {
          const orderRef = doc(db, "orders", selectedOrder.id);
          await updateDoc(orderRef, {
              status: 'paid',
              payment: paymentDetails,
              closedAt: serverTimestamp()
          });

          const finalOrder = { ...selectedOrder, status: 'paid', payment: paymentDetails } as Order;
          printService.printReceipt(finalOrder);

          alert("Cobrado correctamente");
          setSelectedOrder(null);
          loadOrders();
      } catch (error) {
          alert("Error al cobrar");
      }
  };

  // Helper para saber si puede cobrar
  const canCharge = currentUser?.role !== 'MESERO';

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
                <span>🔔</span> Órdenes en Cocina / Pendientes
            </h2>
            <button onClick={loadOrders} className="btn btn-sm btn-ghost">🔄 Actualizar</button>
        </div>

        {loading ? <div className="text-center"><span className="loading loading-spinner"></span></div> : 
         orders.length === 0 ? (
            <div className="text-center py-20 opacity-50 bg-base-100 rounded-box border border-base-200">
                <p className="text-xl font-bold">No hay órdenes pendientes</p>
                <p className="text-sm">Los meseros no han enviado nada aún.</p>
            </div>
         ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order: any) => (
                    <div key={order.id} className="card bg-base-100 shadow-md border border-base-200 hover:border-primary transition-colors">
                        <div className="card-body p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="badge badge-lg badge-warning font-bold text-white">
                                    #{order.orderNumber}
                                </span>
                                <span className="text-xs font-bold opacity-50 uppercase">{order.mode}</span>
                            </div>
                            
                            <ul className="text-sm space-y-1 mb-4 min-h-[60px]">
                                {order.items.map((item: any, idx: number) => (
                                    <li key={idx} className="flex justify-between">
                                        <span className="line-clamp-1">{item.baseName}</span>
                                        <span className="opacity-50">x1</span>
                                    </li>
                                ))}
                                {order.items.length > 3 && <li className="text-xs italic opacity-50">+ {order.items.length - 3} más...</li>}
                            </ul>

                            <div className="flex justify-between items-center border-t border-base-200 pt-3">
                                <div className="text-xl font-black text-primary">${order.total.toFixed(2)}</div>
                                
                                {/* --- CORRECCIÓN AQUÍ: VALIDACIÓN DE ROL --- */}
                                {canCharge ? (
                                    <button 
                                        onClick={() => {
                                            // --- CANDADO DE CAJA ---
                                            if (!currentShift) {
                                                openShiftModal();
                                                return;
                                            }
                                            setSelectedOrder(order);
                                        }}
                                        className="btn btn-sm btn-success text-white shadow-sm"
                                    >
                                        Cobrar
                                    </button>
                                ) : (
                                    <span className="badge badge-ghost text-xs opacity-50">En Caja</span>
                                )}
                            </div>
                            <div className="text-[10px] text-center mt-1 opacity-40">
                                {order.createdAt?.toDate().toLocaleTimeString()} - {order.cashier || 'Mesero'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         )}

         {selectedOrder && (
             <PaymentModal 
                isOpen={true} 
                onClose={() => setSelectedOrder(null)} 
                total={selectedOrder.total} 
                onConfirm={handlePay} 
             />
         )}
    </div>
  );
};