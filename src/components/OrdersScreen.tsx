// src/components/OrdersScreen.tsx
import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, Timestamp } from '../firebase';
import { orderService } from '../services/orderService';
import { PaymentModal } from './PaymentModal';
import { toast } from 'sonner';
import type { Order } from '../types/order';

// Stores
import { useShiftStore } from '../store/useShiftStore';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { printService } from '../services/printService';

interface GroupedOrder {
  id: string;
  customerName: string;
  mode: string;
  orders: Order[];
  totalDebt: number;
  oldestOrderTime: any;
}

export const OrdersScreen: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pago
  const [selectedGroup, setSelectedGroup] = useState<GroupedOrder | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Seguridad
  const { currentShift } = useShiftStore();
  const { openShiftModal } = useUIStore();
  const { activeBranchId } = useAuthStore();

  useEffect(() => {
    // Escuchar órdenes pendientes
    if (!activeBranchId) {
        setLoading(false);
        return;
    }

    setLoading(true);

    const q = query(
      collection(db, "orders"),
      where("branchId", "==", activeBranchId),
      where("status", "!=", "paid"), 
      orderBy("status", "asc"), 
      orderBy("createdAt", "asc") // Las más viejas primero (FIFO)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setActiveOrders(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error cargando órdenes:", error);
      if (error.code === 'failed-precondition') {
          toast.error("Falta índice en Firebase. Revisa la consola.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeBranchId]);

  // Agrupar
  useEffect(() => {
      const groups: Record<string, GroupedOrder> = {};

      activeOrders.forEach(order => {
          const key = `${order.customerName || 'Anónimo'}-${order.mode}`;
          
          if (!groups[key]) {
              groups[key] = {
                  id: key,
                  customerName: order.customerName || 'Cliente Anónimo',
                  mode: order.mode,
                  orders: [],
                  totalDebt: 0,
                  oldestOrderTime: order.createdAt
              };
          }
          groups[key].orders.push(order);
          groups[key].totalDebt += order.total;
          
          // Mantener la fecha más antigua del grupo
          if (order.createdAt < groups[key].oldestOrderTime) {
              groups[key].oldestOrderTime = order.createdAt;
          }
      });

      setGroupedOrders(Object.values(groups));
  }, [activeOrders]);

  const handlePayGroup = (group: GroupedOrder) => {
      if (!currentShift) {
          toast.error("⛔ CAJA CERRADA: Abre turno para cobrar.");
          openShiftModal();
          return;
      }
      setSelectedGroup(group);
      setIsPayModalOpen(true);
  };

  const confirmPayment = async (paymentDetails: any) => {
    if (!selectedGroup) return;
    try {
        setIsPayModalOpen(false);
        const orderIds = selectedGroup.orders.map(o => o.id as string);
        const activeShiftId = currentShift?.isOpen ? currentShift.id : undefined;

        await orderService.payOrders(orderIds, paymentDetails, activeShiftId);

        const allItems = selectedGroup.orders.flatMap(o => o.items);
        
        const consolidatedOrder = {
            items: allItems,
            total: selectedGroup.totalDebt,
            mode: selectedGroup.mode,
            status: 'paid', 
            kitchenStatus: 'delivered',
            orderNumber: selectedGroup.orders[0].orderNumber, 
            customerName: selectedGroup.customerName,
            createdAt: new Date(), 
            payment: paymentDetails,
            cashier: "Cajero"
        };
        
        printService.printReceipt(consolidatedOrder as any);

        toast.success(`Cuenta de ${selectedGroup.customerName} cerrada e impresa`);
        setSelectedGroup(null);
    } catch (error) {
        toast.error("Error al procesar el pago");
    }
  };

  // Helper para "Hace X min"
  const getTimeAgo = (timestamp: any) => {
      if (!timestamp) return 'Reciente';
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
      const diffMs = new Date().getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `${diffMins} min`;
      const diffHrs = Math.floor(diffMins / 60);
      return `${diffHrs} h ${diffMins % 60} m`;
  };

  return (
    <div className="animate-fade-in pb-24 px-4 max-w-7xl mx-auto">
      
      <div className="flex items-center gap-3 mb-8 mt-4">
        <h2 className="text-3xl font-black text-base-content flex items-center gap-2">
            🧾 Comandas Activas
            {activeBranchId && groupedOrders.length > 0 && (
                 <span className="badge badge-primary badge-lg text-white font-bold">{groupedOrders.length}</span>
            )}
        </h2>
      </div>

      {loading ? (
          <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : groupedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <div className="text-6xl mb-4">🧹</div>
              <h3 className="text-xl font-bold">Todo limpio</h3>
              <p>No hay cuentas abiertas por cobrar.</p>
          </div>
      ) : (
          // GRID DE TICKETS
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groupedOrders.map((group) => {
                  const timeAgo = getTimeAgo(group.oldestOrderTime);
                  // Colores según modo
                  const isTakeout = group.mode === 'Para Llevar';
                  const accentColor = isTakeout ? 'border-orange-400' : 'border-blue-500';
                  const badgeColor = isTakeout ? 'badge-warning' : 'badge-info';

                  // Juntamos todos los items de todas las ordenes del grupo para mostrarlos
                  const allItems = group.orders.flatMap(o => o.items);
                  const displayItems = allItems.slice(0, 4); // Solo mostramos 4
                  const remaining = allItems.length - 4;

                  return (
                    <div 
                        key={group.id} 
                        className={`
                            relative bg-[#fffdf5] text-gray-800 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                            flex flex-col rounded-t-lg
                            border-t-4 ${accentColor}
                        `}
                    >
                        {/* Clavo virtual (decoración) */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-300 border-2 border-white shadow-sm z-10"></div>

                        {/* HEADER TICKET */}
                        <div className="p-4 pb-2 border-b border-dashed border-gray-300">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-black text-lg leading-tight line-clamp-1">{group.customerName}</h3>
                                <span className={`badge ${badgeColor} badge-sm font-bold text-white shadow-sm shrink-0`}>
                                    {group.mode === 'Para Llevar' ? '🥡 Llevar' : '🍽️ Mesa'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                                <span>🕒 Abierto hace: {timeAgo}</span>
                            </div>
                        </div>

                        {/* CUERPO TICKET (Lista) */}
                        <div className="p-4 flex-1 bg-[linear-gradient(transparent_95%,rgba(0,0,0,0.02)_100%)] bg-[length:100%_20px]">
                            <ul className="space-y-1.5">
                                {displayItems.map((item, idx) => (
                                    <li key={`${item.id}-${idx}`} className="text-sm flex justify-between items-start leading-tight">
                                        <span className="font-medium text-gray-700 w-full truncate">
                                            <span className="font-bold text-gray-900 mr-1">1x</span> 
                                            {item.baseName}
                                            {item.type === 'CUSTOM' && ' (Armada)'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            
                            {remaining > 0 && (
                                <div className="mt-2 text-xs text-center font-bold text-gray-400 italic bg-gray-50 rounded py-1">
                                    + {remaining} productos más...
                                </div>
                            )}
                        </div>

                        {/* FOOTER TICKET (Total + Cobrar) */}
                        <div className="p-4 pt-2 bg-[#fffdf5] relative">
                            {/* Efecto borde dentado abajo */}
                            <div className="absolute -bottom-1 left-0 w-full h-2 bg-transparent"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, transparent 50%, #fffdf5 50%)',
                                    backgroundSize: '10px 10px',
                                    backgroundPosition: '0 -5px'
                                }}
                            ></div>
                            
                            {/* Separador */}
                            <div className="border-t-2 border-dashed border-gray-300 mb-3 mx-2"></div>

                            <div className="flex justify-between items-end mb-3">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total</span>
                                <span className="text-3xl font-mono font-black text-gray-900 tracking-tighter">
                                    ${group.totalDebt.toFixed(2)}
                                </span>
                            </div>

                            <button 
                                onClick={() => handlePayGroup(group)}
                                className={`
                                    btn btn-block border-none text-white shadow-lg
                                    ${isTakeout ? 'btn-warning' : 'btn-primary'}
                                    hover:scale-[1.02] active:scale-95 transition-all
                                `}
                            >
                                COBRAR
                            </button>
                        </div>
                    </div>
                  );
              })}
          </div>
      )}

      {/* Modal de Pago */}
      <PaymentModal 
          isOpen={isPayModalOpen} 
          onClose={() => setIsPayModalOpen(false)} 
          total={selectedGroup?.totalDebt || 0} 
          onConfirm={confirmPayment} 
      />
    </div>
  );
};