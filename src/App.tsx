// src/App.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { themeChange } from 'theme-change';
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
import { ProductCard } from './components/ProductCard'; 
import { TicketItemCard } from './components/TicketItemCard';

// --- Iconos SVG (Inline para mantenerlo ligero) ---
const IconMoon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const IconSun = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconTicket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;
const IconBack = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;

// --- Tipos ---
type View = 'menu' | 'ticket';
type OrderMode = 'Mesa 1' | 'Mesa 2' | 'Para Llevar';

function isFixedPrice(item: MenuItem): item is FixedPriceItem { return 'price' in item; }
function isVariantPrice(item: MenuItem): item is VariantPriceItem { return 'variants' in item; }

// --- Componente Principal ---
function App() {
  // Estado Global
  const [allData, setAllData] = useState({ groups: [] as MenuGroup[], items: [] as MenuItem[], modifiers: [] as Modifier[], rules: [] as PriceRule[] });
  const [view, setView] = useState<View>('menu');
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [currentOrderMode, setCurrentOrderMode] = useState<OrderMode>('Para Llevar');
  const [currentOrderNumber, setCurrentOrderNumber] = useState(101);
  
  // Estados de Modales
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [groupToCustomize, setGroupToCustomize] = useState<MenuGroup | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [itemToSelectVariant, setItemToSelectVariant] = useState<MenuItem | null>(null);
  
  // Navegación del Menú
  const [currentGroup, setCurrentGroup] = useState<MenuGroup | null>(null);

  // Inicializar el gestor de temas
  useEffect(() => {
    themeChange(false);
  }, []);

  // Carga de Datos desde Firebase
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

  // Establecer grupo raíz al cargar
  useEffect(() => {
      if (allData.groups.length > 0 && !currentGroup) {
          setCurrentGroup(allData.groups.find(g => g.id === 'root') || null);
      }
  }, [allData.groups]);

  // --- Manejadores de Eventos ---
  const handleNavigate = (groupId: string) => {
    const nextGroup = allData.groups.find(g => g.id === groupId);
    if (nextGroup) setCurrentGroup(nextGroup);
  };
  
  const handleGoBack = () => {
      setCurrentGroup(allData.groups.find(g => g.id === 'root') || null);
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
      } catch (e) {
          console.error("Error enviando pedido: ", e);
          alert("Error al enviar el pedido");
      }
  };

  const totalTicket = useMemo(() => ticketItems.reduce((sum, item) => sum + item.finalPrice, 0), [ticketItems]);

  // --- Renderizado ---
  return (
    <div className="min-h-screen bg-base-200 pb-32 font-sans transition-colors duration-300">
      
      {/* Navbar Superior (Glassmorphism) */}
      <div className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 shadow-sm px-4">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl font-bold text-primary tracking-tight p-0 hover:bg-transparent">
            Dulce Crepa <span className="text-base-content/60 text-sm font-normal">POS</span>
          </a>
        </div>
        <div className="flex-none gap-2">
            {/* Theme Controller (DaisyUI + Tailwind) */}
            <label className="swap swap-rotate btn btn-circle btn-ghost btn-sm">
                {/* Este input controla el tema: checked = dulce-dark, unchecked = cupcake */}
                <input type="checkbox" className="theme-controller" value="dulce-dark" />
                {/* Icono Sol (Light) */}
                <div className="swap-off fill-current w-5 h-5 text-primary"><IconSun/></div>
                {/* Icono Luna (Dark) */}
                <div className="swap-on fill-current w-5 h-5 text-base-content"><IconMoon/></div>
            </label>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="p-4 max-w-5xl mx-auto animate-fade-in">
        
        {/* Selector de Modo de Pedido (Tabs estilo iOS) */}
        {view === 'menu' && (
            <div className="flex justify-center mb-6">
                <div role="tablist" className="tabs tabs-boxed bg-base-100 p-1 rounded-full shadow-sm">
                    {(['Mesa 1', 'Mesa 2', 'Para Llevar'] as OrderMode[]).map(mode => (
                        <a 
                            key={mode} 
                            role="tab" 
                            className={`tab rounded-full transition-all duration-200 font-medium px-6 ${currentOrderMode === mode ? 'tab-active bg-primary text-primary-content shadow-md' : 'text-base-content/70'}`}
                            onClick={() => setCurrentOrderMode(mode)}
                        >
                            {mode}
                        </a>
                    ))}
                </div>
            </div>
        )}

        {/* Vistas Condicionales */}
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
                onSubmitOrder={handleSubmitOrder}
                currentOrderNumber={currentOrderNumber}
                onRemoveItem={(id: string) => setTicketItems(prev => prev.filter(i => i.id !== id))}
            />
        </div>

      </main>

      {/* Footer Simple */}
      <footer className="footer footer-center p-4 bg-base-300 text-base-content/70 text-xs mt-10">
        <aside>
          <p>Copyright © {new Date().getFullYear()} - Dulce Crepa POS</p>
        </aside>
      </footer>

      {/* Navegación Inferior (Dock Flotante con Glassmorphism) */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-base-100/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 p-2 flex gap-2 transform transition-all hover:scale-105">
              <button 
                className={`btn btn-ghost gap-2 rounded-xl px-6 h-12 ${view === 'menu' ? 'bg-primary/10 text-primary' : 'text-base-content/70'}`}
                onClick={() => setView('menu')}
              >
                  <IconMenu />
                  <span className="font-medium">Menú</span>
              </button>
              
              <div className="divider divider-horizontal mx-0 w-[1px] bg-base-content/10 my-2"></div>

              <button 
                className={`btn btn-ghost gap-2 rounded-xl px-6 h-12 ${view === 'ticket' ? 'bg-primary/10 text-primary' : 'text-base-content/70'}`}
                onClick={() => setView('ticket')}
              >
                  <div className="indicator">
                    <IconTicket />
                    {ticketItems.length > 0 && <span className="badge badge-sm badge-secondary indicator-item border-none shadow-sm">{ticketItems.length}</span>}
                  </div>
                  <span className="font-medium">Ticket</span>
                  {ticketItems.length > 0 && <span className="font-bold ml-1 text-sm">${totalTicket.toFixed(0)}</span>}
              </button>
          </div>
      </div>

      {/* Modales */}
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

// --- Componente MenuScreen ---
const MenuScreen: React.FC<any> = ({ allData, currentGroup, onProductClick, onGoBack }) => {
    // Validación para evitar pantalla blanca mientras carga
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
                    {isRoot ? 'Categorías' : currentGroup.name}
                </h2>
            </div>

            {isRoot ? (
                // Grid de Categorías Principales
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {rootGroups.map((group: MenuGroup) => (
                        <div key={group.id} onClick={() => onProductClick(group)} className="card bg-base-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border border-base-200">
                            <div className="card-body items-center text-center p-6">
                                <span className="text-4xl mb-2 filter drop-shadow-sm">➡️</span>
                                <h3 className="card-title text-lg font-bold">{group.name}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Grid de Items
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...currentItems, ...currentSubGroups].map((item: any) => (
                        <ProductCard key={item.id} item={item} onClick={() => onProductClick(item)} />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Componente TicketScreen ---
const TicketScreen: React.FC<any> = ({ ticketItems, totalTicket, onSubmitOrder, currentOrderNumber, onRemoveItem }) => (
    <div className="bg-base-100 rounded-box shadow-xl p-6 max-w-md mx-auto border border-base-200 mb-20">
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
                    <p className="text-sm">Agrega productos del menú</p>
                </div>
            ) : (
                ticketItems.map((item: TicketItem) => (
                    <TicketItemCard key={item.id} item={item} onRemove={onRemoveItem} />
                ))
            )}
        </div>

        <div className="divider my-2"></div>
        
        <div className="flex justify-between items-end mb-6">
            <span className="text-lg font-medium text-base-content/70">Total a Pagar</span>
            <span className="text-4xl font-black text-primary">${totalTicket.toFixed(2)}</span>
        </div>

        <button 
            onClick={onSubmitOrder} 
            disabled={ticketItems.length === 0} 
            className="btn btn-primary w-full btn-lg rounded-2xl shadow-lg shadow-primary/20 text-lg font-bold"
        >
            Cobrar y Enviar
        </button>
    </div>
);

export default App;