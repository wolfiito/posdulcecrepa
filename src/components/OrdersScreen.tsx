import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, Timestamp, doc, getDoc } from '../firebase';
import { OrderTicketItem } from './OrderTicketItem';
import { orderService } from '../services/orderService';
import { PaymentModal } from './PaymentModal';
import { toast } from 'sonner';
import type { Order } from '../types/order';
import type { TicketItem } from '../types/menu';

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
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

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
      where("status", "==", "pending"), // <--- Fix: Solo mostrar las que están realmente pendientes
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

  const handleRemoveItem = async (itemToRemove: TicketItem, orderId: string) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnapshot = await getDoc(orderRef);
        if (!orderSnapshot.exists()) return;
        
        const orderData = orderSnapshot.data();
        const currentItems: TicketItem[] = orderData.items || [];
        
        // Encontrar el item exacto
        const itemIndex = currentItems.findIndex(i => 
            i.id === itemToRemove.id && i.finalPrice === itemToRemove.finalPrice
        );

        if (itemIndex === -1) {
            toast.error("No se encontró el producto en la orden");
            return;
        }

        const remainingItems = [...currentItems];
        remainingItems.splice(itemIndex, 1);
        
        const newTotal = remainingItems.reduce((acc, i) => acc + (i.finalPrice || 0), 0);
        
        // IMPORTANTE: Al eliminar desde la UI (swipe), eliminamos de a 1 unidad.
        // Creamos una copia del item con quantity = 1 para que el servicio restaure solo eso.
        const itemWithSingleQty = { ...itemToRemove, quantity: 1 };
        
        await orderService.removeItemFromOrder(activeBranchId!, orderId, itemWithSingleQty, remainingItems, newTotal);
        toast.success("Producto eliminado e inventario restaurado");
    } catch (error) {
        console.error(error);
        toast.error("Error al eliminar producto");
    }
  };

  const handleDeleteGroup = async (group: GroupedOrder) => {
    if (!activeBranchId) return;
    if (!window.confirm(`¿Estás seguro de que quieres eliminar TODAS las órdenes de ${group.customerName}?`)) return;
    
    try {
        for (const order of group.orders) {
            await orderService.cancelOrder(activeBranchId, order.id!, order.items);
        }
        toast.success(`Cuenta de ${group.customerName} eliminada`);
    } catch (error) {
        console.error(error);
        toast.error("Error al eliminar la cuenta");
    }
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

                  // Juntamos todos los items de cada orden
                  const groupId = group.id;
                  const allRawItems = group.orders.flatMap(o => o.items.map(i => ({ ...i, orderRefId: o.id })));
                  
                  // Consolidación por Producto + Detalles (IGNORAMOS id ya que es único por línea)
                  const consolidatedItems = allRawItems.reduce((acc, current) => {
                      // Signature: productId/baseName + price + details stringified
                      const detailsSig = current.details ? JSON.stringify(current.details) : "";
                      const sig = (current.productId || current.baseName) + current.finalPrice + detailsSig;
                      
                      const existingIndex = acc.findIndex(i => {
                          const iDetailsSig = i.details ? JSON.stringify(i.details) : "";
                          const iSig = (i.productId || i.baseName) + i.finalPrice + iDetailsSig;
                          return iSig === sig;
                      });

                      if (existingIndex > -1) {
                          acc[existingIndex].quantity = (acc[existingIndex].quantity || 1) + (current.quantity || 1);
                      } else {
                          // Quitamos el id de la signature para que agrupe, pero mantenemos una referencia para delete
                          acc.push({ ...current, quantity: current.quantity || 1 });
                      }
                      return acc;
                  }, [] as any[]);

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
                            {/* PRODUCTOS */}
                            <ul className="space-y-0 relative">
                                {consolidatedItems.map((item, idx) => (
                                    <OrderTicketItem 
                                        key={`${item.productId || item.baseName}-${item.quantity}-${idx}`}
                                        item={item}
                                        orderId={item.orderRefId!} 
                                        isEditable={editingGroupId === groupId}
                                        onRemove={handleRemoveItem}
                                    />
                                ))}
                                
                                {consolidatedItems.length === 0 && (
                                    <li className="text-xs text-gray-400 italic py-2 text-center">Sin productos</li>
                                )}
                            </ul>
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

                            <div className="flex justify-between items-end mb-3 px-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total a cobrar</span>
                                <span className="text-3xl font-mono font-black text-gray-900 tracking-tighter">
                                    ${group.totalDebt.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setEditingGroupId(editingGroupId === groupId ? null : groupId)}
                                        className={`btn btn-outline border-none text-[10px] font-bold h-10 min-h-0 ${editingGroupId === groupId ? 'btn-success bg-green-50' : 'bg-gray-50'}`}
                                        title="Activar edición de productos"
                                    >
                                        {editingGroupId === groupId ? '✅ LISTO' : '✏️ EDITAR'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteGroup(group)}
                                        className="btn btn-outline btn-error border-none bg-red-50 hover:bg-red-100 text-[10px] font-bold h-10 min-h-0"
                                        title="Eliminar toda la comanda"
                                    >
                                        🗑️ ELIMINAR
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handlePayGroup(group)}
                                    className={`
                                        w-full btn border-none text-white shadow-lg h-12 min-h-0 text-sm font-black
                                        ${isTakeout ? 'btn-warning' : 'btn-primary'}
                                        hover:scale-[1.01] active:scale-95 transition-all
                                    `}
                                >
                                    COBRAR ${group.totalDebt.toFixed(2)}
                                </button>
                            </div>
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
          items={selectedGroup?.orders.flatMap(o => o.items) || []}
          onConfirm={confirmPayment} 
      />
    </div>
  );
};