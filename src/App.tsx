// src/App.tsx
import React, { useEffect, useState } from 'react';
import { useMenuStore } from './store/useMenuStore';
import { useTicketStore } from './store/useTicketStore';
import { useUIStore } from './store/useUIStore';
// import { orderService } from './services/orderService'; // No se usa directamente aquí, pero está bien tenerlo
import { ReceiptTemplate } from './components/ReceiptTemplate';
import { PaymentModal } from './components/PaymentModal';
// Componentes
import { CustomizeCrepeModal } from './components/CustomizeCrepeModal';
import { CustomizeVariantModal } from './components/CustomizeVariantModal';
import { ProductCard } from './components/ProductCard';
import { TicketItemCard } from './components/TicketItemCard';
import type { MenuItem, MenuGroup, TicketItem } from './types/menu';
import { DailyReportModal } from './components/DailyReportModal';

// --- Iconos SVG ---
const IconMoon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const IconSun = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconTicket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;
const IconBack = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;

// --- Componente Principal ---
function App() {
  // Conexión a Stores
  const { fetchMenuData, isLoading, modifiers, rules } = useMenuStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
  // CORRECCIÓN AQUÍ: Extraemos 'orderToPrint' del store global en lugar de usar useState local
  const { 
    view, theme, toggleTheme, setView, 
    activeModal, groupToCustomize, itemToSelectVariant, closeModals, 
    currentGroup, navigateToGroup,
    orderToPrint // <--- ¡Esto es lo que faltaba!
  } = useUIStore();
  
  const { addItem, orderMode, setOrderMode } = useTicketStore();

  // Cargar datos al inicio
  useEffect(() => {
    fetchMenuData();
    const savedTheme = localStorage.getItem('theme') as 'dulce-light' | 'dulce-dark';
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Handlers
  const handleAddItem = (item: TicketItem) => {
    addItem(item);
    closeModals();
    setView('menu');
    navigateToGroup(null);
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen bg-base-200">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );
  }
  // --- NUEVA LÓGICA DE COBRO Y PEDIDOS ---
  
  // 1. Esta función decide qué hacer cuando picas el botón verde
  const handleMainBtnClick = () => {
      const { items, orderMode } = useTicketStore.getState();
      if (items.length === 0) return;

      if (orderMode === 'Para Llevar') {
          setIsPaymentModalOpen(true); // Abrir modal de cobro
      } else {
          handleFinalizeOrder(undefined); // Mesa: Enviar directo a cocina
      }
  };

  // 2. Esta función hace el trabajo sucio (Guardar en Firebase + Imprimir)
  const handleFinalizeOrder = async (paymentDetails?: any) => {
      const { items, getTotal, orderMode, orderNumber, incrementOrderNumber, clearTicket } = useTicketStore.getState();
      
      try {
          setIsPaymentModalOpen(false); 
          
          // Llamamos al servicio (que ya configuramos para imprimir en iPhone/Android)
          await orderService.createOrder(
              items,
              getTotal(), 
              orderMode,
              orderNumber,
              paymentDetails
          );

          const actionMsg = orderMode === 'Para Llevar' ? 'cobrada' : 'enviada a cocina';
          alert(`¡Orden #${orderNumber} ${actionMsg} con éxito!`);
          
          incrementOrderNumber();
          clearTicket();
          useUIStore.getState().setView('menu');

      } catch (e) {
          console.error("Error:", e);
          alert("Error al procesar la orden.");
      }
  };
  return (
    <div className="min-h-screen bg-base-200 pb-[140px] font-sans transition-colors duration-300">
      
      {/* Navbar Superior */}
      <div className="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-50 shadow-sm px-2 border-b border-base-200 h-16">
        <div className="navbar-start flex gap-1 items-center w-auto">
            {view === 'ticket' ? (
                <button onClick={() => setView('menu')} className="btn btn-ghost btn-circle m-1 text-primary">
                    <IconBack />
                </button>
            ) : (
                <div className="dropdown dropdown-bottom">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle m-1">
                        <IconMenu />
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-xl bg-base-100 rounded-box w-60 border border-base-200 mt-2">
                        <li className="menu-title text-xs uppercase opacity-50">Configuración</li>
                        <li className="mb-2">
                            <label className="flex justify-between cursor-pointer active:bg-base-200">
                                <span className="flex gap-2 items-center">
                                    {theme === 'dulce-light' ? <IconSun /> : <IconMoon />}
                                    Modo Oscuro
                                </span>
                                <input type="checkbox" className="toggle toggle-sm toggle-primary" checked={theme === 'dulce-dark'} onChange={toggleTheme} />
                            </label>
                        </li>
                        <li>
                            <a onClick={() => {
                                // Cerramos el dropdown (truco de blur)
                                (document.activeElement as HTMLElement)?.blur();
                                useUIStore.getState().openReportModal();
                            }} className="active:bg-primary active:text-white">
                                💰 Corte de Caja
                            </a>
                        </li>
                    </ul>
                </div>
            )}
            <span className="text-lg font-black tracking-tight text-base-content hidden sm:block ml-2">DulceCrepa</span>
        </div>

        <div className="navbar-end flex-1 w-full justify-end min-w-0">
            <div className="join shadow-sm border border-base-300 bg-base-200/80 p-1 rounded-btn">
                {(['Mesa 1', 'Mesa 2', 'Para Llevar'] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setOrderMode(mode)}
                        className={`join-item btn btn-sm border-none ${orderMode === mode ? 'bg-base-100 shadow-sm font-extrabold' : 'btn-ghost font-medium'}`}
                    >
                        {mode === 'Para Llevar' ? 'Llevar' : mode}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="p-4 max-w-5xl mx-auto animate-fade-in">
        {view === 'menu' ? <MenuScreen /> : <TicketScreen />}
      </main>

      {/* Bottom Bar Inteligente */}
      <BottomBar onAction={handleMainBtnClick} />

      {/* Modales */}
      {activeModal === 'custom_crepe' && groupToCustomize && (
        <CustomizeCrepeModal 
            isOpen={true} 
            onClose={closeModals} 
            group={groupToCustomize} 
            allModifiers={modifiers} 
            allPriceRules={rules} 
            onAddItem={handleAddItem} 
        />
      )}
      
      {activeModal === 'variant_select' && itemToSelectVariant && (
        <CustomizeVariantModal 
            isOpen={true} 
            onClose={closeModals} 
            item={itemToSelectVariant} 
            allModifiers={modifiers} 
            onAddItem={handleAddItem} 
        />
      )}


      {/* COMPONENTE DE IMPRESIÓN - Ahora conectado al Store Correcto */}
      {/* Modal de Pago */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        total={useTicketStore.getState().getTotal()} 
        onConfirm={handleFinalizeOrder} 
      />
      <ReceiptTemplate order={orderToPrint} />
      <DailyReportModal 
        isOpen={activeModal === 'daily_report'} 
        onClose={closeModals} 
      />
    </div>
  );
}

// --- Sub-componentes ---
// (Importamos el BottomBar de forma local, pero idealmente debería estar en otro archivo para evitar ciclos, 
// pero como ya lo tenías aquí, lo dejamos para no romper tu estructura)
import { orderService } from './services/orderService';
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;

const IconCheckSVG = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;


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
        return currentGroup.items_ref
            .map(refId => items.find(i => i.id === refId))
            .filter((i): i is MenuItem => !!i);
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
                    type: 'FIXED',
                    details: { itemId: menuItem.id, selectedModifiers: [] }
                });
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
                <h2 className="text-2xl font-bold text-base-content">
                    {isRoot ? 'Menú Principal' : currentGroup.name}
                </h2>
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
                    items.map(item => (
                        <TicketItemCard key={item.id} item={item} onRemove={removeItem} />
                    ))
                )}
            </div>
        </div>
    );
};


// Modifica la definición de BottomBar al final del archivo:
const BottomBar: React.FC<{ onAction: () => void }> = ({ onAction }) => {
    // Usamos los hooks para saber si mostrarse o no
    const { items, getTotal, orderMode } = useTicketStore();
    const { view, setView } = useUIStore();
    const total = getTotal();

    // Si no hay items y no estoy en el ticket, ME OCULTO
    if (items.length === 0 && view !== 'ticket') return null;

    const getButtonColor = () => orderMode === 'Para Llevar' ? 'btn-success text-white' : 'btn-warning text-black';
    const getButtonLabel = () => orderMode === 'Para Llevar' ? 'Cobrar y Finalizar' : 'Enviar a Cocina';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-xl border-t border-base-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-5xl mx-auto p-4 flex gap-4 items-center">
                <div className="flex-1 pl-2">
                    <div className="text-xs text-base-content/60 font-medium uppercase">Total ({orderMode})</div>
                    <div className="text-2xl font-black text-primary">${total.toFixed(2)}</div>
                </div>
                {view === 'menu' ? (
                    <button onClick={() => setView('ticket')} className="btn btn-primary rounded-box shadow-lg px-8">
                        Ver Ticket ({items.length})
                    </button>
                ) : (
                    // AQUÍ ESTÁ EL CAMBIO: Ejecuta onAction al hacer click
                    <button onClick={onAction} className={`btn ${getButtonColor()} rounded-box shadow-lg px-8`} disabled={items.length === 0}>
                        {getButtonLabel()} <IconCheck />
                    </button>
                )}
            </div>
        </div>
    );
};

export default App;