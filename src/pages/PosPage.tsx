// src/pages/PosPage.tsx
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useMenuStore } from '../store/useMenuStore';
import { useTicketStore } from '../store/useTicketStore';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import { orderService } from '../services/orderService';
import type { OrderMode } from '../types/order'; // Importamos el tipo

// Componentes
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { PaymentModal } from '../components/PaymentModal';
import { CustomizeCrepeModal } from '../components/CustomizeCrepeModal';
import { CustomizeVariantModal } from '../components/CustomizeVariantModal';
import { ProductCard } from '../components/ProductCard';
import { TicketItemCard } from '../components/TicketItemCard';
import { ShiftsScreen } from '../components/ShiftsScreen';

// Iconos
import { IconCheck, IconTicket, IconBack } from '../components/Icons';

// Tipos
import type { MenuItem, MenuGroup, TicketItem } from '../types/menu';
import { toast } from 'sonner';

export const PosPage: React.FC = () => {
  const { startListening, modifiers, rules } = useMenuStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { currentUser } = useAuthStore();
  const { currentShift } = useShiftStore();

  const { 
    view, setView, 
    activeModal, groupToCustomize, itemToSelectVariant, closeModals, 
    navigateToGroup, orderToPrint, openShiftModal
  } = useUIStore();

  const { addItem, orderMode, setOrderMode, customerName, setCustomerName } = useTicketStore();

  useEffect(() => {
    const unsubscribe = startListening();
    return () => unsubscribe();
  }, []);

  // --- LÓGICA DE MESAS INTELIGENTE ---
  const handleModeChange = (mode: OrderMode) => {
      setOrderMode(mode);
      if (mode !== 'Para Llevar') {
          // Si es Mesa, el nombre ES la mesa (Automático)
          setCustomerName(mode);
      } else {
          // Si es Para Llevar, limpiamos para que escriban el nombre
          setCustomerName('');
      }
  };

  const handleAddItem = (item: TicketItem) => {
    addItem(item);
    closeModals();
    setView('menu');
    navigateToGroup(null);
  };

  const handleMainBtnClick = () => {
      const { items } = useTicketStore.getState();
      if (items.length === 0) return;
      const isMesero = currentUser?.role === 'MESERO';
      
      // VALIDACIÓN: Solo pedimos escribir nombre si es "Para Llevar"
      if (orderMode === 'Para Llevar' && !customerName.trim()) {
          toast.warning("⚠️ Escribe el nombre del cliente para llevar");
          document.getElementById('customer-name-input')?.focus();
          return;
      }
      
      if (orderMode === 'Para Llevar' && !isMesero) {
            if (!currentShift) {
                openShiftModal();
                return;
            }
          setIsPaymentModalOpen(true); 
      } else {
          // Si es Mesa o es Mesero, se envía directo (sin cobrar aun)
          handleFinalizeOrder(undefined); 
      }
  };

  const handleFinalizeOrder = async (paymentDetails?: any) => {
      const { items, getTotal, orderMode, clearTicket, customerName } = useTicketStore.getState();
      const cashierName = currentUser?.name || 'Cajero';
      
      const createOrderPromise = async () => {
          setIsPaymentModalOpen(false); 
          
          await orderService.createOrder(
              items, 
              getTotal(), 
              orderMode, 
              cashierName,
              customerName, 
              paymentDetails
          );
          
          // Al limpiar, si es Mesa, mantenemos el nombre de la mesa para seguir pidiendo rápido
          // Si es Para Llevar, limpiamos el nombre.
          const currentMode = orderMode; // Guardamos ref
          clearTicket();
          
          if (currentMode !== 'Para Llevar') {
              setCustomerName(currentMode); // Restauramos "Mesa X"
              setOrderMode(currentMode);
          }
          
          setView('menu');
      };

      toast.promise(createOrderPromise(), {
          loading: 'Enviando orden...',
          success: `¡Orden enviada!`,
          error: 'Error al procesar',
      });
  };

  return (
    <>
      {/* 1. BARRA SUPERIOR INTELIGENTE */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2 bg-base-100 p-2 rounded-box shadow-sm border border-base-200">
         
         {/* SELECTOR DE MODO (Ahora a la izquierda para jerarquía) */}
         <div className="join shadow-sm border border-base-300 bg-base-200 p-0.5 rounded-btn">
            {(['Mesa 1', 'Mesa 2', 'Para Llevar'] as const).map((mode) => (
                <button 
                    key={mode} 
                    onClick={() => handleModeChange(mode)} 
                    className={`join-item btn btn-xs sm:btn-sm border-none transition-all ${orderMode === mode ? 'bg-white text-black shadow-sm font-extrabold' : 'btn-ghost font-medium text-base-content/60'}`}
                >
                    {mode === 'Para Llevar' ? 'Llevar 🛍️' : mode}
                </button>
            ))}
        </div>

         {/* INPUT DE NOMBRE (Solo visible/habilitado según el modo) */}
         <div className="flex-1 w-full sm:w-auto text-right">
            {orderMode === 'Para Llevar' ? (
                <input 
                    id="customer-name-input"
                    type="text" 
                    placeholder="Nombre del Cliente..." 
                    className="input input-sm input-bordered w-full sm:max-w-xs font-bold text-primary"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    autoComplete="off"
                />
            ) : (
                <div className="badge badge-lg badge-ghost font-bold opacity-50">
                    {orderMode} (Cuenta Abierta)
                </div>
            )}
         </div>
      </div>

      {/* Contenido Principal */}
      {view === 'menu' ? <MenuScreen /> : <TicketScreen />}

      {/* Barra Inferior */}
      <BottomBar onAction={handleMainBtnClick} />

      {/* Modales (Sin cambios) */}
      {activeModal === 'custom_crepe' && groupToCustomize && (
          <CustomizeCrepeModal isOpen={true} onClose={closeModals} group={groupToCustomize} allModifiers={modifiers} allPriceRules={rules} onAddItem={handleAddItem} />
      )}
      {activeModal === 'variant_select' && itemToSelectVariant && (
          <CustomizeVariantModal isOpen={true} onClose={closeModals} item={itemToSelectVariant} allModifiers={modifiers} onAddItem={handleAddItem} />
      )}
      
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} total={useTicketStore.getState().getTotal()} onConfirm={handleFinalizeOrder} />
      <ReceiptTemplate order={orderToPrint} />

      <Modal 
        isOpen={activeModal === 'shift_control'} 
        onRequestClose={closeModals}
        className="bg-base-200 w-full max-w-3xl max-h-[90vh] rounded-box shadow-2xl outline-none overflow-y-auto p-4 border border-base-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      >
          <div className="flex justify-end mb-2">
              <button onClick={closeModals} className="btn btn-sm btn-circle btn-ghost">✕</button>
          </div>
          <ShiftsScreen />
      </Modal>
    </>
  );
};

const MenuScreen: React.FC = () => {
    const { groups, items } = useMenuStore();
    const { currentGroup, navigateToGroup, openCustomModal, openVariantModal } = useUIStore();
    const { addItem } = useTicketStore();
    const isRoot = !currentGroup;

    const groupsToShow = React.useMemo(() => {
        if (isRoot) return groups.filter(g => g.parent === 'root');
        return groups.filter(g => g.parent === currentGroup.id);
    }, [groups, currentGroup, isRoot]);

    const itemsToShow = React.useMemo(() => {
        if (!currentGroup?.items_ref) return [];
        return currentGroup.items_ref.map(refId => items.find(i => i.id === refId)).filter((i): i is MenuItem => !!i);
    }, [items, currentGroup]);

    const handleProductClick = (item: MenuItem | MenuGroup) => {
        if ('level' in item) { 
            const group = item as MenuGroup;
            if (group.rules_ref) openCustomModal(group);
            else navigateToGroup(group);
        } else { 
            const menuItem = item as MenuItem;
            const isVariant = 'variants' in menuItem;
            const hasModifiers = menuItem.modifierGroups && menuItem.modifierGroups.length > 0;

            if (isVariant || hasModifiers) openVariantModal(menuItem);
            else {
                addItem({
                    id: Date.now().toString(),
                    baseName: menuItem.name,
                    finalPrice: menuItem.price || 0,
                    finalCost: menuItem.cost || 0,
                    type: 'FIXED',
                    details: { itemId: menuItem.id, selectedModifiers: [] }
                });
                toast.success(`Agregado: ${menuItem.name}`);
            }
        }
    };

    return (
        <div className="animate-fade-in pb-20"> 
            <div className="flex items-center mb-4 px-1">
                {!isRoot && (
                    <button onClick={() => navigateToGroup(groups.find(g => g.id === currentGroup.parent) || null)} className="btn btn-circle btn-ghost btn-sm mr-2">
                        <IconBack />
                    </button>
                )}
                <h2 className="text-2xl font-bold text-base-content">{isRoot ? 'Menú Principal' : currentGroup.name}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {groupsToShow.map(group => (
                    <ProductCard key={group.id} item={group} onClick={() => handleProductClick(group)} isLarge={isRoot} />
                ))}
                {itemsToShow.map(item => (
                    <ProductCard key={item.id} item={item} onClick={() => handleProductClick(item)} />
                ))}
            </div>
        </div>
    );
};

const TicketScreen: React.FC = () => {
    const { items, removeItem } = useTicketStore();
    const { setView } = useUIStore();
    return (
        <div className="bg-base-100 rounded-box shadow-xl p-6 max-w-md mx-auto border border-base-200">
            <div className="text-center mb-6">
                <div className="badge badge-primary badge-outline mb-2">Pedido en curso</div>
                {/* Aquí quitamos el #101 fijo */}
                <h2 className="text-2xl font-black text-base-content tracking-tight">Nueva Orden</h2>
            </div>
            <div className="flex flex-col gap-3 mb-6 min-h-[300px]">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                        <IconTicket />
                        <p className="mt-2">Ticket vacío</p>
                        <button onClick={() => setView('menu')} className="btn btn-link">Ir al Menú</button>
                    </div>
                ) : (
                    items.map(item => <TicketItemCard key={item.id} item={item} onRemove={removeItem} />)
                )}
            </div>
        </div>
    );
};

const BottomBar: React.FC<{ onAction: () => void }> = ({ onAction }) => {
    const { items, getTotal, orderMode } = useTicketStore();
    const { view, setView } = useUIStore();
    const { currentUser } = useAuthStore();
    const total = getTotal();

    if (items.length === 0 && view !== 'ticket') return null;

    const isMesero = currentUser?.role === 'MESERO';
    const canPay = orderMode === 'Para Llevar' && !isMesero;

    const getButtonColor = () => canPay ? 'btn-success text-white' : 'btn-warning text-black';
    const getButtonLabel = () => canPay ? 'Cobrar y Finalizar' : 'Enviar a Cocina';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-base-100/95 backdrop-blur-xl border-t border-base-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-5xl mx-auto p-4 flex gap-4 items-center">
                <div className="flex-1 pl-2">
                    <div className="text-xs text-base-content/60 font-medium uppercase">Total ({orderMode})</div>
                    <div className="text-2xl font-black text-primary">${total.toFixed(2)}</div>
                </div>
                {view === 'menu' ? (
                    <button onClick={() => setView('ticket')} className="btn btn-primary rounded-box shadow-lg px-8">Ver Ticket ({items.length})</button>
                ) : (
                    <button onClick={onAction} className={`btn ${getButtonColor()} rounded-box shadow-lg px-8`} disabled={items.length === 0}>
                        {getButtonLabel()} <IconCheck />
                    </button>
                )}
            </div>
        </div>
    );
};