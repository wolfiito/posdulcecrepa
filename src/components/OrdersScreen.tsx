import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase';
import { orderService } from '../services/orderService';
import { PaymentModal } from './PaymentModal';
import { toast } from 'sonner';
import type { Order } from '../types/order';

// Estructura para agrupar
interface GroupedOrder {
    customerName: string;
    mode: string;
    orders: Order[];
    totalDebt: number;
}

export const OrdersScreen: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Para el pago
  const [selectedGroup, setSelectedGroup] = useState<GroupedOrder | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    // ESTA ES LA CLAVE: Buscamos TODO lo que sea diferente a 'paid'
    // Así no importa si KDS dice 'delivered', aquí sigue apareciendo.
    const q = query(
      collection(db, "orders"),
      where("status", "!=", "paid"), 
      orderBy("status", "asc"), // Requerido por Firestore cuando usas !=
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setActiveOrders(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando órdenes activas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Agrupar órdenes por Cliente/Mesa
  useEffect(() => {
      const groups: Record<string, GroupedOrder> = {};

      activeOrders.forEach(order => {
          // Clave única: Nombre + Modo (ej. "Juan - Para Llevar" o "Mesa 1 - Mesa 1")
          const key = `${order.customerName || 'Anónimo'}-${order.mode}`;
          
          if (!groups[key]) {
              groups[key] = {
                  customerName: order.customerName || 'Cliente Anónimo',
                  mode: order.mode,
                  orders: [],
                  totalDebt: 0
              };
          }
          groups[key].orders.push(order);
          groups[key].totalDebt += order.total;
      });

      setGroupedOrders(Object.values(groups));
  }, [activeOrders]);

  const handlePayGroup = (group: GroupedOrder) => {
      setSelectedGroup(group);
      setIsPayModalOpen(true);
  };

  const confirmPayment = async (paymentDetails: any) => {
      if (!selectedGroup) return;

      try {
          setIsPayModalOpen(false);
          await orderService.payOrders(selectedGroup.orders, paymentDetails);
          toast.success(`¡Cuenta de ${selectedGroup.customerName} pagada!`);
          setSelectedGroup(null);
      } catch (error) {
          toast.error("Error al procesar el pago");
      }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-20 p-4">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
        🧾 Cuentas Abiertas
      </h2>

      {loading ? (
          <div className="text-center py-10"><span className="loading loading-spinner"></span></div>
      ) : groupedOrders.length === 0 ? (
          <div className="text-center py-10 opacity-50 bg-base-200 rounded-box">
              <p className="font-bold">¡Todo cobrado!</p>
              <p className="text-sm">No hay cuentas pendientes.</p>
          </div>
      ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedOrders.map((group) => (
                  <div key={`${group.customerName}-${group.mode}`} className="card bg-base-100 shadow-lg border border-base-200 hover:border-primary transition-colors">
                      <div className="card-body p-5">
                          {/* Encabezado de la Tarjeta */}
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h3 className="card-title text-lg">{group.customerName}</h3>
                                  <div className="badge badge-ghost badge-sm">{group.mode}</div>
                              </div>
                              <div className="text-right">
                                  <div className="text-2xl font-black text-error">
                                      ${group.totalDebt.toFixed(2)}
                                  </div>
                                  <div className="text-xs opacity-60">{group.orders.length} ticket(s)</div>
                              </div>
                          </div>

                          {/* Lista de Tickets dentro del grupo */}
                          <div className="divider my-1 text-[10px] uppercase tracking-widest opacity-50">Detalle</div>
                          <ul className="space-y-1 mb-4 max-h-32 overflow-y-auto pr-1">
                              {group.orders.map(ord => (
                                  <li key={ord.id} className="text-xs flex justify-between p-1 bg-base-200 rounded">
                                      <span>#{ord.orderNumber} - {ord.items.length} prod.</span>
                                      <span className="font-mono font-bold">${ord.total.toFixed(2)}</span>
                                  </li>
                              ))}
                          </ul>

                          {/* Botón de Cobro */}
                          <button 
                              onClick={() => handlePayGroup(group)}
                              className="btn btn-primary btn-block shadow-md text-white"
                          >
                              Cobrar Todo
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Modal de Pago Reutilizado */}
      <PaymentModal 
          isOpen={isPayModalOpen} 
          onClose={() => setIsPayModalOpen(false)} 
          total={selectedGroup?.totalDebt || 0} 
          onConfirm={confirmPayment} 
      />
    </div>
  );
};