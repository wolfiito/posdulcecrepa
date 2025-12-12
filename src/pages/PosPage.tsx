// src/pages/PosPage.tsx
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useMenuStore } from '../store/useMenuStore';
import { useTicketStore } from '../store/useTicketStore';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import { orderService } from '../services/orderService';

// Componentes
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { PaymentModal } from '../components/PaymentModal';
import { CustomizeCrepeModal } from '../components/CustomizeCrepeModal';
import { CustomizeVariantModal } from '../components/CustomizeVariantModal';
import { ProductCard } from '../components/ProductCard';
import { TicketItemCard } from '../components/TicketItemCard';
import { ShiftsScreen } from '../components/ShiftsScreen';

// Iconos (Importados desde nuestro nuevo archivo)
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

  const { addItem, orderMode, setOrderMode } = useTicketStore();

  // Escuchar cambios en el menú al montar este componente
  useEffect(() => {
    const unsubscribe = startListening();
    return () => unsubscribe();
  }, []);

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
      
      if (orderMode === 'Para Llevar' && !isMesero) {
            // Validar turno abierto para cobrar
            if (!currentShift) {
                openShiftModal();
                return;
            }
          setIsPaymentModalOpen(true); 
      } else {
          handleFinalizeOrder(undefined); 
      }
  };

  const handleFinalizeOrder = async (paymentDetails?: any) => {
    // Obtenemos el estado actual
    const { items, getTotal, orderMode, orderNumber, incrementOrderNumber, clearTicket } = useTicketStore.getState();
    
    // Obtenemos el nombre del cajero de forma segura
    const cashierName = currentUser?.name || 'Cajero Genérico';

    const createOrderPromise = async () => {
        setIsPaymentModalOpen(false); 
        
        // <--- AQUÍ ESTÁ EL CAMBIO PRINCIPAL:
        // Ahora pasamos 'cashierName' como argumento.
        await orderService.createOrder(
            items, 
            getTotal(), 
            orderMode, 
            orderNumber, 
            cashierName, // Pasamos el nombre explícitamente
            paymentDetails
        );
        
        incrementOrderNumber();
        clearTicket();
        setView('menu');
    };

    toast.promise(createOrderPromise(), {
        loading: 'Procesando orden...',
        success: `¡Orden #${orderNumber} ${paymentDetails ? 'cobrada' : 'enviada'} con éxito!`,
        error: 'Error al procesar la orden. Verifique conexión.', // Mensaje amigable
    });
};

  // Renderizado principal
  return (
    <>
      {/* Selector de Modo (Mesa/Llevar) - Lo inyectamos aquí o en el Navbar (por ahora aquí arriba) */}
      <div className="flex justify-end mb-2">
         <div className="join shadow-sm border border-base-300 bg-base-100 p-1 rounded-btn">
            {(['Mesa 1', 'Mesa 2', 'Para Llevar'] as const).map((mode) => (
                <button key={mode} onClick={() => setOrderMode(mode)} className={`join-item btn btn-xs sm:btn-sm border-none ${orderMode === mode ? 'bg-base-200 shadow-sm font-extrabold' : 'btn-ghost font-medium'}`}>
                    {mode === 'Para Llevar' ? 'Llevar' : mode}
                </button>
            ))}
        </div>
      </div>

      {/* Contenido Principal: Menú o Ticket */}
      {view === 'menu' ? <MenuScreen /> : <TicketScreen />}

      {/* Barra Inferior Flotante */}
      <BottomBar onAction={handleMainBtnClick} />

      {/* --- MODALES --- */}
      
      {/* Modal de Personalización (Crepas) */}
      {activeModal === 'custom_crepe' && groupToCustomize && (
          <CustomizeCrepeModal isOpen={true} onClose={closeModals} group={groupToCustomize} allModifiers={modifiers} allPriceRules={rules} onAddItem={handleAddItem} />
      )}
      
      {/* Modal de Variantes (Tamaños) */}
      {activeModal === 'variant_select' && itemToSelectVariant && (
          <CustomizeVariantModal isOpen={true} onClose={closeModals} item={itemToSelectVariant} allModifiers={modifiers} onAddItem={handleAddItem} />
      )}
      
      {/* Modal de Pago */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} total={useTicketStore.getState().getTotal()} onConfirm={handleFinalizeOrder} />
      
      {/* Template de Impresión (Invisible) */}
      <ReceiptTemplate order={orderToPrint} />

      {/* Modal de Control de Turno (Si intentan cobrar sin turno) */}
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

// --- SUB-COMPONENTES LOCALES (MenuScreen, TicketScreen, BottomBar) ---
// Nota de Sr Developer: En un futuro, estos deberían ir a src/components/pos/

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
    const { items, removeItem, orderNumber } = useTicketStore();
    const { setView } = useUIStore();
    return (
        <div className="bg-base-100 rounded-box shadow-xl p-6 max-w-md mx-auto border border-base-200">
            <div className="text-center mb-6">
                <div className="badge badge-primary badge-outline mb-2">Pedido en curso</div>
                <h2 className="text-3xl font-black text-base-content">#{String(orderNumber).padStart(3, '0')}</h2>
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
    const getButtonLabel = () => canPay ? 'Cobrar y Finalizar' : 'Enviar a Cocina/Caja';

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