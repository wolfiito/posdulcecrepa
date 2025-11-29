// src/App.tsx
import React, { useEffect, useState } from 'react';
import { useMenuStore } from './store/useMenuStore';
import { useTicketStore } from './store/useTicketStore';
import { useUIStore } from './store/useUIStore';
import { useAuthStore } from './store/useAuthStore'; // Store de Auth
import { orderService } from './services/orderService';
import { useShiftStore } from './store/useShiftStore';
import Modal from 'react-modal';

// Componentes
import { ReceiptTemplate } from './components/ReceiptTemplate';
import { PaymentModal } from './components/PaymentModal';
import { CustomizeCrepeModal } from './components/CustomizeCrepeModal';
import { CustomizeVariantModal } from './components/CustomizeVariantModal';
import { ProductCard } from './components/ProductCard';
import { TicketItemCard } from './components/TicketItemCard';
import { LoginScreen } from './components/LoginScreen';
import { DailyReportModal } from './components/DailyReportModal';
import { AdminMenuScreen } from './components/AdminMenuScreen';

// Pantallas Nuevas
import { ShiftsScreen } from './components/ShiftsScreen';
import { MovementsScreen } from './components/MovementsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { UsersScreen } from './components/UsersScreen';
import { OrdersScreen } from './components/OrdersScreen';

import type { MenuItem, MenuGroup, TicketItem } from './types/menu';

// --- ICONOS ---
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconBack = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const IconPOS = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
const IconBox = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconChart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconTicket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconSun = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const IconMoon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;

function App() {
  const { fetchMenuData, isLoading, modifiers, rules } = useMenuStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { currentUser, logout } = useAuthStore();
  const { currentShift } = useShiftStore();

  const { 
    view, theme, toggleTheme, setView, 
    activeModal, groupToCustomize, itemToSelectVariant, closeModals, 
    currentGroup, navigateToGroup, orderToPrint,
    activeSection, setSection , openShiftModal
  } = useUIStore();

  const { addItem, orderMode, setOrderMode } = useTicketStore();

  useEffect(() => {
    fetchMenuData();
    const savedTheme = localStorage.getItem('theme') as 'dulce-light' | 'dulce-dark';
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleAddItem = (item: TicketItem) => {
    addItem(item);
    closeModals();
    setView('menu');
    navigateToGroup(null);
  };

  // --- LÓGICA BLINDADA PARA MESEROS ---
  const handleMainBtnClick = () => {
      const { items, orderMode } = useTicketStore.getState();
      if (items.length === 0) return;

      const isMesero = currentUser?.role === 'MESERO';

      // Si es Para Llevar Y NO ES MESERO, cobramos.
      // Si es Mesero, SIEMPRE enviamos a caja (sin pago).
      if (orderMode === 'Para Llevar' && !isMesero) {
            if (!currentShift) {
                openShiftModal();
                return;
            }
          setIsPaymentModalOpen(true); 
      } else {
          // Envío directo (Mesa o Mesero para llevar)
          handleFinalizeOrder(undefined); 
      }
  };

  const handleFinalizeOrder = async (paymentDetails?: any) => {
      const { items, getTotal, orderMode, orderNumber, incrementOrderNumber, clearTicket } = useTicketStore.getState();
      try {
          setIsPaymentModalOpen(false); 
          await orderService.createOrder(items, getTotal(), orderMode, orderNumber, paymentDetails);
          
          const actionMsg = (orderMode === 'Para Llevar' && paymentDetails) ? 'cobrada' : 'enviada a caja/cocina';
          alert(`¡Orden #${orderNumber} ${actionMsg} con éxito!`);
          
          incrementOrderNumber();
          clearTicket();
          useUIStore.getState().setView('menu');
      } catch (e) {
          console.error("Error:", e);
          alert("Error al procesar la orden.");
      }
  };

  if (!currentUser) return <LoginScreen />;
  if (isLoading) return <div className="flex justify-center items-center h-screen bg-base-200"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="drawer">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col min-h-screen bg-base-200 transition-colors duration-300 pb-[140px]">
        {/* Navbar */}
        <div className="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-40 shadow-sm px-2 border-b border-base-200 h-16">
          <div className="navbar-start flex gap-1 items-center w-auto">
              {view === 'ticket' && activeSection === 'pos' ? (
                  <button onClick={() => setView('menu')} className="btn btn-ghost btn-circle m-1 text-primary">
                      <IconBack />
                  </button>
              ) : (
                  <label htmlFor="main-drawer" className="btn btn-ghost btn-circle m-1 drawer-button">
                      <IconMenu />
                  </label>
              )}
              <span className="text-lg font-black tracking-tight text-base-content ml-2 hidden sm:inline">
                  DulceCrepa
              </span>
          </div>

          {activeSection === 'pos' && (
            <div className="navbar-end flex-1 w-full justify-end min-w-0">
                <div className="join shadow-sm border border-base-300 bg-base-200/80 p-1 rounded-btn">
                    {(['Mesa 1', 'Mesa 2', 'Para Llevar'] as const).map((mode) => (
                        <button key={mode} onClick={() => setOrderMode(mode)} className={`join-item btn btn-sm border-none ${orderMode === mode ? 'bg-base-100 shadow-sm font-extrabold' : 'btn-ghost font-medium'}`}>
                            {mode === 'Para Llevar' ? 'Llevar' : mode}
                        </button>
                    ))}
                </div>
            </div>
          )}
        </div>

        <main className="p-4 max-w-5xl mx-auto w-full animate-fade-in flex-1">
            {activeSection === 'pos' && (view === 'menu' ? <MenuScreen /> : <TicketScreen />)}
            {activeSection === 'orders' && <OrdersScreen />}
            {activeSection === 'shifts' && <ShiftsScreen />}
            {activeSection === 'movements' && <MovementsScreen />}
            {activeSection === 'reports' && <ReportsScreen />}
            {activeSection === 'users' && <UsersScreen />}
            {activeSection === 'admin_menu' && <AdminMenuScreen />}
        </main>

        {activeSection === 'pos' && <BottomBar onAction={handleMainBtnClick} />}

        {/* Modales Globales */}
        {activeModal === 'custom_crepe' && groupToCustomize && (
            <CustomizeCrepeModal isOpen={true} onClose={closeModals} group={groupToCustomize} allModifiers={modifiers} allPriceRules={rules} onAddItem={handleAddItem} />
        )}
        {activeModal === 'variant_select' && itemToSelectVariant && (
            <CustomizeVariantModal isOpen={true} onClose={closeModals} item={itemToSelectVariant} allModifiers={modifiers} onAddItem={handleAddItem} />
        )}
        <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} total={useTicketStore.getState().getTotal()} onConfirm={handleFinalizeOrder} />
        <ReceiptTemplate order={orderToPrint} />
        <DailyReportModal isOpen={activeModal === 'daily_report'} onClose={closeModals} />
      </div>
      <Modal 
        isOpen={activeModal === 'shift_control'} 
        onRequestClose={closeModals}
        className="bg-base-200 w-full max-w-3xl max-h-[90vh] rounded-box shadow-2xl outline-none overflow-y-auto p-4 border border-base-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      >
          <div className="flex justify-end mb-2">
              <button onClick={closeModals} className="btn btn-sm btn-circle btn-ghost">✕</button>
          </div>
          {/* Reutilizamos la pantalla completa dentro del modal */}
          <ShiftsScreen />
      </Modal>
      {/* SIDEBAR CON ROLES */}
      <div className="drawer-side z-50">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base-content gap-2">
          
          <li className="mb-4 border-b border-base-200 pb-4">
             <div className="flex flex-col gap-1 items-start pointer-events-none">
                <span className="font-black text-2xl text-primary">Dulce Crepa</span>
                <span className="text-xs font-bold">{currentUser.name}</span>
                <span className="badge badge-sm badge-ghost">{currentUser.role}</span>
             </div>
          </li>
          
          {/* 1. POS (Todos) */}
          <li>
            <a className={activeSection === 'pos' ? 'active font-bold' : ''} onClick={() => { setSection('pos'); document.getElementById('main-drawer')?.click(); }}>
                <IconPOS /> Punto de Venta
            </a>
          </li>

          {/* 2. ÓRDENES: Cajero, Gerente, Admin (Mesero NO la ve para no confundirse/cobrar) */}
          {['CAJERO', 'GERENTE', 'ADMIN'].includes(currentUser.role) && (
            <li>
                <a className={activeSection === 'orders' ? 'active font-bold' : ''} onClick={() => { setSection('orders'); document.getElementById('main-drawer')?.click(); }}>
                    <span className="text-xl">🔔</span> Órdenes Pendientes
                </a>
            </li>
          )}

          <div className="divider my-1"></div>

          {/* 3. CAJA Y GASTOS: Gerente y Admin */}
          {['CAJERO'].includes(currentUser.role) && (
            <>
                <li>
                    <a className={activeSection === 'shifts' ? 'active font-bold' : ''} onClick={() => { setSection('shifts'); document.getElementById('main-drawer')?.click(); }}>
                        <IconBox /> Caja y Turnos
                    </a>
                </li>
                <li>
                    <a className={activeSection === 'movements' ? 'active font-bold' : ''} onClick={() => { setSection('movements'); document.getElementById('main-drawer')?.click(); }}>
                        <IconWallet /> Gastos
                    </a>
                </li>
            </>
          )}

          <div className="divider my-1"></div>

          {/* 4. ADMIN */}
          {currentUser.role === 'ADMIN' && (
            <>
                <li className="menu-title opacity-50">Administración</li>
                <li>
                    <a className={activeSection === 'reports' ? 'active font-bold' : ''} onClick={() => { setSection('reports'); document.getElementById('main-drawer')?.click(); }}>
                        <IconChart /> Reportes
                    </a>
                </li>
                <li>
                    <a className={activeSection === 'users' ? 'active font-bold' : ''} onClick={() => { setSection('users'); document.getElementById('main-drawer')?.click(); }}>
                        <IconUsers /> Usuarios
                    </a>
                </li>
                <li>
                    <a className={activeSection === 'users' ? 'active font-bold' : ''} onClick={() => { setSection('users'); document.getElementById('main-drawer')?.click(); }}>
                        <IconUsers /> Usuarios
                    </a>
                </li>
                    {/* --- NUEVO BOTÓN --- */}
                <li>
                    <a className={activeSection === 'admin_menu' ? 'active font-bold' : ''} onClick={() => { setSection('admin_menu'); document.getElementById('main-drawer')?.click(); }}>
                        <span className="text-xl">🛠️</span> Editar de Menú
                    </a>
                </li>
            </>
          )}

          <div className="mt-auto"></div>
          <li>
              <button 
                  onClick={() => { logout(); document.getElementById('main-drawer')?.click(); }} 
                  className="text-error font-bold hover:bg-error/10 flex gap-2"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Cerrar Sesión
              </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

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

// --- BARRA INFERIOR INTELIGENTE ---
const BottomBar: React.FC<{ onAction: () => void }> = ({ onAction }) => {
    const { items, getTotal, orderMode } = useTicketStore();
    const { view, setView } = useUIStore();
    const { currentUser } = useAuthStore(); // Verificamos rol aquí también visualmente
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

export default App;