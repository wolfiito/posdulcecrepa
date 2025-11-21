// src/App.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { 
    db, 
    collection, 
    getDocs, 
    addDoc, 
    serverTimestamp 
} from './firebase'; 

import type { 
    MenuItem, FixedPriceItem, VariantPriceItem, Modifier, TicketItem, MenuGroup, PriceRule 
} from './types/menu'; 
import { CustomizeCrepeModal } from './components/CustomizeCrepeModal'; 
import { CustomizeVariantModal } from './components/CustomizeVariantModal'; 
import { ProductCard, getIconForItem } from './components/ProductCard'; 
import { TicketItemCard } from './components/TicketItemCard';

// --- Iconos SVG ---
const IconMoon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const IconSun = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconTicket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;
const IconBack = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const IconHistory = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>;
const IconCash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconMinus = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;

// --- Tipos ---
type View = 'menu' | 'ticket';
type OrderMode = 'Mesa 1' | 'Mesa 2' | 'Para Llevar';

function isFixedPrice(item: MenuItem): item is FixedPriceItem { return 'price' in item; }
function isVariantPrice(item: MenuItem): item is VariantPriceItem { return 'variants' in item; }

// --- Componente Principal ---
function App() {
  const [allData, setAllData] = useState({ groups: [] as MenuGroup[], items: [] as MenuItem[], modifiers: [] as Modifier[], rules: [] as PriceRule[] });
  const [view, setView] = useState<View>('menu');
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [currentOrderMode, setCurrentOrderMode] = useState<OrderMode>('Para Llevar');
  const [currentOrderNumber, setCurrentOrderNumber] = useState(101);
  const [theme, setTheme] = useState<'dulce-light' | 'dulce-dark'>('dulce-light');

  // Modales
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [groupToCustomize, setGroupToCustomize] = useState<MenuGroup | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [itemToSelectVariant, setItemToSelectVariant] = useState<MenuItem | null>(null);
  
  const [currentGroup, setCurrentGroup] = useState<MenuGroup | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dulce-light' | 'dulce-dark';
    const initialTheme = savedTheme || 'dulce-light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dulce-light' ? 'dulce-dark' : 'dulce-light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [groupsQ, itemsQ, modsQ, rulesQ] = await Promise.all([
          getDocs(collection(db, "menu_groups")),
          getDocs(collection(db, "menu_items")),
          getDocs(collection(db, "modifiers")),
          getDocs(collection(db, "price_rules")),
        ]);
        setAllData({ 
            groups: groupsQ.docs.map(d => ({ id: d.id, ...d.data() })) as MenuGroup[],
            items: itemsQ.docs.map(d => ({ id: d.id, ...d.data() })) as MenuItem[],
            modifiers: modsQ.docs.map(d => ({ id: d.id, ...d.data() })) as Modifier[],
            rules: rulesQ.docs.map(d => ({ id: d.id, ...d.data() })) as PriceRule[]
        });
      } catch (error) { console.error("Error loading data:", error); }
    };
    fetchMenuData();
  }, []);

  useEffect(() => {
      if (allData.groups.length > 0 && !currentGroup) {
          setCurrentGroup(allData.groups.find(g => g.id === 'root') || null);
      }
  }, [allData.groups]);

  const handleNavigate = (groupId: string) => {
    const nextGroup = allData.groups.find(g => g.id === groupId);
    if (nextGroup) setCurrentGroup(nextGroup);
  };
  
  const handleGoBack = () => {
      setCurrentGroup(allData.groups.find(g => g.id === 'root') || null);
  };

  const handleGoToMenu = () => {
      setView('menu');
  };

  const handleProductClick = (item: MenuItem | MenuGroup) => {
      if ('level' in item) { 
          const group = item as MenuGroup;
          if (group.rules_ref) { 
              setGroupToCustomize(group);
              setIsCustomModalOpen(true); 
          } else {
              handleNavigate(group.id);
          }
      } else { 
          const menuItem = item as MenuItem;
          if (isVariantPrice(menuItem) || (isFixedPrice(menuItem) && menuItem.modifierGroups?.length > 0)) {
              setItemToSelectVariant(menuItem);
              setIsVariantModalOpen(true); 
          } else if (isFixedPrice(menuItem)) {
              setTicketItems(prev => [...prev, {
                  id: Date.now().toString(), 
                  baseName: menuItem.name,
                  finalPrice: menuItem.price,
                  type: 'FIXED',
                  details: { itemId: menuItem.id, selectedModifiers: [] }
              }]);
          }
      }
  };

  const handleAddItemToTicket = (item: TicketItem) => {
    setTicketItems(prev => [...prev, item]);
    setIsCustomModalOpen(false);
    setIsVariantModalOpen(false);
    setGroupToCustomize(null);
    setItemToSelectVariant(null);
    setView('menu');
    handleNavigate('root'); 
  };

  const handleSubmitOrder = async () => {
      try {
          await addDoc(collection(db, "orders"), {
              items: ticketItems,
              total: ticketItems.reduce((sum, item) => sum + item.finalPrice, 0),
              mode: currentOrderMode,
              orderNumber: currentOrderNumber,
              createdAt: serverTimestamp(),
              status: 'pending'
          });
          setTicketItems([]);
          setCurrentOrderNumber(prev => prev + 1);
          alert("Pedido enviado a cocina!");
          setView('menu'); 
      } catch (e) {
          console.error("Error enviando pedido: ", e);
          alert("Error al enviar el pedido");
      }
  };

  const totalTicket = useMemo(() => ticketItems.reduce((sum, item) => sum + item.finalPrice, 0), [ticketItems]);

  // --- Renderizado ---
  return (
    <div className="min-h-screen bg-base-200 pb-[140px] font-sans transition-colors duration-300">
      
      {/* Navbar Superior */}
      <div className="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-50 shadow-sm px-2 border-b border-base-200 h-16">
        <div className="navbar-start flex gap-1 items-center w-auto">
            
            {/* LÓGICA DE NAVEGACIÓN: Hamburguesa en Menu, Atrás en Ticket */}
            {view === 'ticket' ? (
                <button 
                    onClick={() => setView('menu')} 
                    className="btn btn-ghost btn-circle m-1 animate-pop-in text-primary hover:bg-primary/10"
                >
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
                                <input 
                                    type="checkbox" 
                                    className="toggle toggle-sm toggle-primary" 
                                    checked={theme === 'dulce-dark'}
                                    onChange={toggleTheme} 
                                />
                            </label>
                        </li>
                        <div className="divider my-1"></div>
                        <li><a><IconHistory/> Historial de Ventas</a></li>
                        <li><a><IconCash/> Corte de Caja</a></li>
                    </ul>
                </div>
            )}
            
            <a onClick={handleGoToMenu} className="text-lg font-black tracking-tight text-base-content select-none cursor-pointer active:scale-95 transition-transform hidden sm:block">
              DulceCrepa
            </a>
        </div>

        <div className="navbar-center hidden md:flex"></div>

        <div className="navbar-end flex-1 w-full justify-end min-w-0">
            {/* SELECTOR DE MESA (Recuperado) */}
            <div className="join shadow-sm border border-base-300 bg-base-200/80 p-1 rounded-btn">
                {(['Mesa 1', 'Mesa 2', 'Llevar'] as const).map((mode) => {
                    const displayMode = mode === 'Llevar' ? 'Para Llevar' : mode;
                    const shortMode = mode === 'Llevar' ? 'Llevar' : mode; 
                    const isActive = currentOrderMode === displayMode;
                    return (
                        <button
                            key={mode}
                            onClick={() => setCurrentOrderMode(displayMode)}
                            className={`
                                join-item btn btn-sm border-none rounded-btn transition-all duration-200
                                font-normal text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap
                                ${isActive 
                                    ? 'bg-base-100 text-base-content shadow-sm font-extrabold ring-1 ring-base-content/5' 
                                    : 'btn-ghost text-base-content/60 hover:bg-base-300/50 font-medium'
                                }
                            `}
                        >
                            {shortMode}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      <main className="p-4 max-w-5xl mx-auto animate-fade-in">
        <div className={view === 'menu' ? 'block' : 'hidden'}>
            <MenuScreen
                allData={allData}
                currentGroup={currentGroup}
                onProductClick={handleProductClick}
                onGoBack={handleGoBack}
            />
        </div>

        <div className={view === 'ticket' ? 'block' : 'hidden'}>
            <TicketScreen
                ticketItems={ticketItems}
                totalTicket={totalTicket}
                onBackToMenu={handleGoToMenu} 
                currentOrderNumber={currentOrderNumber}
                onRemoveItem={(id: string) => setTicketItems(prev => prev.filter(i => i.id !== id))}
            />
        </div>
      </main>

      {/* Bottom Bar Inteligente */}
      {(ticketItems.length > 0 || view === 'ticket') && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-xl border-t border-base-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-5xl mx-auto p-4 flex gap-4 items-center">
                
                <div className="flex-1 pl-2">
                    <div className="text-xs text-base-content/60 font-medium uppercase tracking-wide">Total a Pagar</div>
                    <div className="text-2xl font-black text-primary flex items-center gap-1">
                        ${totalTicket.toFixed(2)}
                        <span className="text-xs font-normal text-base-content/50 mt-1 ml-1">({ticketItems.length} items)</span>
                    </div>
                </div>

                {view === 'menu' ? (
                    <button 
                        onClick={() => setView('ticket')}
                        className="btn btn-primary btn-lg rounded-box shadow-lg shadow-primary/30 px-8 animate-pop-in"
                    >
                        Ver Ticket <IconTicket />
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmitOrder}
                        className="btn btn-success text-white btn-lg rounded-box shadow-lg shadow-success/30 px-8 animate-pop-in"
                    >
                        Cobrar <IconCheck />
                    </button>
                )}
            </div>
        </div>
      )}

      {groupToCustomize && (
        <CustomizeCrepeModal 
            isOpen={isCustomModalOpen} 
            onClose={() => setIsCustomModalOpen(false)} 
            group={groupToCustomize} 
            allModifiers={allData.modifiers} 
            allPriceRules={allData.rules} 
            onAddItem={handleAddItemToTicket} 
        />
      )}
      {itemToSelectVariant && (
        <CustomizeVariantModal 
            isOpen={isVariantModalOpen} 
            onClose={() => setIsVariantModalOpen(false)} 
            item={itemToSelectVariant} 
            allModifiers={allData.modifiers} 
            onAddItem={handleAddItemToTicket} 
        />
      )}
    </div>
  );
}

// --- Componente MenuScreen (GRID + ICONOS SVG) ---
const MenuScreen: React.FC<any> = ({ allData, currentGroup, onProductClick, onGoBack }) => {
    if (!currentGroup) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    const isRoot = currentGroup.id === 'root';
    
    const currentItems = React.useMemo(() => 
        currentGroup.items_ref 
            ? currentGroup.items_ref.map((refId: string) => allData.items.find((item: MenuItem) => item.id === refId)).filter(Boolean) 
            : [], 
        [currentGroup, allData.items]
    );

    const currentSubGroups = React.useMemo(() => 
        isRoot 
            ? [] 
            : allData.groups.filter((g: MenuGroup) => g.parent === currentGroup.id), 
        [currentGroup, isRoot, allData.groups]
    );
    
    const rootGroups = React.useMemo(() => 
        allData.groups.filter((g: MenuGroup) => g.parent === 'root'), 
        [allData.groups]
    );

    return (
        <div className="animate-fade-in pb-20"> 
            <div className="flex items-center mb-4 px-1">
                {!isRoot && (
                    <button onClick={onGoBack} className="btn btn-circle btn-ghost btn-sm mr-2 bg-base-200 hover:bg-base-300 border-none">
                        <IconBack />
                    </button>
                )}
                <h2 className="text-2xl font-bold text-base-content">
                    {isRoot ? 'Menú' : currentGroup.name}
                </h2>
            </div>

            {isRoot ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {rootGroups.map((group: MenuGroup) => (
                        <ProductCard 
                            key={group.id} 
                            item={group} 
                            onClick={() => onProductClick(group)} 
                            isLarge={true} 
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...currentItems, ...currentSubGroups].map((item: any) => (
                        <ProductCard 
                            key={item.id} 
                            item={item} 
                            onClick={() => onProductClick(item)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Componente TicketScreen ---
const TicketScreen: React.FC<any> = ({ ticketItems, onBackToMenu, currentOrderNumber, onRemoveItem }) => (
    <div className="bg-base-100 rounded-box shadow-xl p-6 max-w-md mx-auto border border-base-200">
        <div className="text-center mb-6">
            <div className="badge badge-primary badge-outline mb-2">Pedido en curso</div>
            <h2 className="text-3xl font-black text-base-content">#{String(currentOrderNumber).padStart(3, '0')}</h2>
        </div>
        
        <div className="flex flex-col gap-3 mb-6 min-h-[300px]">
            {ticketItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-base-content/40 py-10">
                    <div className="bg-base-200 p-4 rounded-full mb-3">
                        <IconTicket />
                    </div>
                    <p className="font-medium">Ticket vacío</p>
                    <button onClick={onBackToMenu} className="btn btn-link btn-sm mt-2 text-primary no-underline hover:opacity-80">
                        Volver al Menú
                    </button>
                </div>
            ) : (
                ticketItems.map((item: TicketItem) => (
                    <TicketItemCard key={item.id} item={item} onRemove={onRemoveItem} />
                ))
            )}
        </div>
    </div>
);

export default App;