
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
    db, 
    collection, 
    getDocs, 
    doc, 
    runTransaction, 
    serverTimestamp,
    type Transaction, 
    type QueryDocumentSnapshot,
    type DocumentData
} from './firebase'; 

import type { 
    MenuItem, FixedPriceItem, VariantPriceItem, Modifier, TicketItem, MenuGroup, PriceRule 
} from './types/menu'; 
import { CustomizeCrepeModal } from './components/CustomizeCrepeModal'; 
import { CustomizeVariantModal } from './components/CustomizeVariantModal'; 
import { ProductCard, getIconForItem } from './components/ProductCard'; 
import { TicketItemCard } from './components/TicketItemCard';

// --- Tipos de Vista ---
type View = 'menu' | 'ticket';
type OrderMode = 'Mesa 1' | 'Mesa 2' | 'Para Llevar';

// --- Type Guards ---
function isFixedPrice(item: MenuItem): item is FixedPriceItem {
  return 'price' in item;
}
function isVariantPrice(item: MenuItem): item is VariantPriceItem {
  return 'variants' in item;
}

// --- Componente Principal ---
function App() {
  const [allData, setAllData] = useState({ groups: [] as MenuGroup[], items: [] as MenuItem[], modifiers: [] as Modifier[], rules: [] as PriceRule[] });
  const [view, setView] = useState<View>('menu');
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [currentOrderMode, setCurrentOrderMode] = useState<OrderMode>('Para Llevar');
  const [currentOrderNumber, setCurrentOrderNumber] = useState(101);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [groupToCustomize, setGroupToCustomize] = useState<MenuGroup | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [itemToSelectVariant, setItemToSelectVariant] = useState<MenuItem | null>(null);
  const [currentGroup, setCurrentGroup] = useState<MenuGroup | null>(null);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [groupsQuery, itemsQuery, modifiersQuery, rulesQuery] = await Promise.all([
          getDocs(collection(db, "menu_groups")),
          getDocs(collection(db, "menu_items")),
          getDocs(collection(db, "modifiers")),
          getDocs(collection(db, "price_rules")),
        ]);

        const groups = groupsQuery.docs.map(d => ({ id: d.id, ...d.data() })) as MenuGroup[];
        const items = itemsQuery.docs.map(d => ({ id: d.id, ...d.data() })) as MenuItem[];
        const modifiers = modifiersQuery.docs.map(d => ({ id: d.id, ...d.data() })) as Modifier[];
        const rules = rulesQuery.docs.map(d => ({ id: d.id, ...d.data() })) as PriceRule[];
        
        setAllData({ groups, items, modifiers, rules });
        setCurrentGroup(groups.find(g => g.id === 'root') || null);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchMenuData();
  }, []);

  const handleNavigate = (groupId: string) => {
    const nextGroup = allData.groups.find(g => g.id === groupId);
    if (nextGroup) setCurrentGroup(nextGroup);
  };
  
  const handleGoBack = () => {
      setCurrentGroup(allData.groups.find(g => g.id === 'root') || null);
  };

  const handleProductClick = (item: MenuItem | MenuGroup) => {
      if ('level' in item) { // Es un Grupo
          const group = item as MenuGroup;
          if (group.rules_ref) { 
              setGroupToCustomize(group);
              setIsCustomModalOpen(true); 
          } else {
              handleNavigate(group.id);
          }
      } else { // Es un Item
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

  const handleSubmitOrder = async () => { /* ... (sin cambios) ... */ };

  const totalTicket = useMemo(() => ticketItems.reduce((sum, item) => sum + item.finalPrice, 0), [ticketItems]);

  return (
    <div className="app-container">
      <div className="view" style={{ display: view === 'menu' ? 'flex' : 'none' }}>
        <MenuScreen
          allData={allData}
          currentGroup={currentGroup} 
          currentOrderMode={currentOrderMode}
          onSetOrderMode={setCurrentOrderMode}
          onProductClick={handleProductClick}
          onGoBack={handleGoBack}
        />
        <BottomNav currentView={view} ticketCount={ticketItems.length} onNavigate={setView} />
      </div>

      <div className="view" style={{ display: view === 'ticket' ? 'flex' : 'none' }}>
        <TicketScreen
          ticketItems={ticketItems}
          totalTicket={totalTicket}
          onSubmitOrder={handleSubmitOrder}
          currentOrderNumber={currentOrderNumber}
          onNavigate={setView}
          onRemoveItem={id => setTicketItems(prev => prev.filter(i => i.id !== id))}
        />
      </div>
      
      {groupToCustomize && <CustomizeCrepeModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} group={groupToCustomize} allModifiers={allData.modifiers} allPriceRules={allData.rules} onAddItem={handleAddItemToTicket} />}
      {itemToSelectVariant && <CustomizeVariantModal isOpen={isVariantModalOpen} onClose={() => setIsVariantModalOpen(false)} item={itemToSelectVariant} allModifiers={allData.modifiers} onAddItem={handleAddItemToTicket} />}
    </div>
  );
}

// --- Pantalla de Menú ---
const MenuScreen: React.FC<any> = ({ allData, currentGroup, currentOrderMode, onSetOrderMode, onProductClick, onGoBack }) => {
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [headerVisible, setHeaderVisible] = useState(true);
    const lastScrollTop = useRef(0);
    const menuContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentGroup?.id === 'root') setActiveAccordion(null);
    }, [currentGroup]);

    useEffect(() => {
        const handleScroll = () => {
            if (!menuContentRef.current) return;
            const currentScrollTop = menuContentRef.current.scrollTop;
            // Tolerance to prevent hiding on small scrolls
            if (Math.abs(currentScrollTop - lastScrollTop.current) <= 10) return;

            if (currentScrollTop > lastScrollTop.current && currentScrollTop > 80) { // Scrolling down
                setHeaderVisible(false);
            } else { // Scrolling up
                setHeaderVisible(true);
            }
            lastScrollTop.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
        };

        const menuElement = menuContentRef.current;
        menuElement?.addEventListener('scroll', handleScroll);
        return () => menuElement?.removeEventListener('scroll', handleScroll);
    }, []);

    const rootGroups = useMemo(() => allData.groups.filter((g: MenuGroup) => g.parent === 'root'), [allData.groups]);
    const currentSubGroups = useMemo(() => !currentGroup || currentGroup.id === 'root' ? [] : allData.groups.filter((g: MenuGroup) => g.parent === currentGroup.id), [currentGroup, allData.groups]);
    const currentItems = useMemo(() => currentGroup?.items_ref ? currentGroup.items_ref.map((refId: string) => allData.items.find((item: MenuItem) => item.id === refId)).filter(Boolean) : [], [currentGroup, allData.items]);
  
    const getTitle = () => !currentGroup || currentGroup.id === 'root' ? "Menú" : currentGroup.name;
    const isRoot = currentGroup?.id === 'root';

    const itemsInsideAccordion = (groupId: string): (MenuItem | MenuGroup)[] => {
        const subGroups = allData.groups.filter((g: MenuGroup) => g.parent === groupId);
        const group = allData.groups.find((g: MenuGroup) => g.id === groupId);
        const items = group?.items_ref?.map((refId: string) => allData.items.find((item: MenuItem) => item.id === refId)).filter(Boolean) || [];
        return [...subGroups, ...items];
    }

    return (
        <>
            <header className={`header-bar ${headerVisible ? 'visible' : 'hidden'}`}>
                <div className="order-type-group">
                    {(['Mesa 1', 'Mesa 2', 'Para Llevar'] as OrderMode[]).map(mode => (
                        <button key={mode} className={`btn-order-type ${currentOrderMode === mode ? 'active' : ''}`} onClick={() => onSetOrderMode(mode)}>{mode}</button>
                    ))}
                </div>
            </header>
            <div className="menu-content" ref={menuContentRef}>
                <header className="menu-header">
                    {!isRoot && (
                        <button onClick={onGoBack} className="btn-back">
                            <IconBack />
                        </button>
                    )}
                    <h2>{getTitle()}</h2>
                </header>
                
                {isRoot ? (
                    <div className="accordion-container">
                        {rootGroups.map((group: MenuGroup) => {
                            const content = itemsInsideAccordion(group.id);
                            return (
                                <AccordionCategory key={group.id} group={group} isActive={activeAccordion === group.id} onToggle={content.length > 0 ? () => setActiveAccordion(p => p === group.id ? null : group.id) : undefined} onClick={content.length === 0 ? () => onProductClick(group) : undefined}>
                                    {content.length > 0 && <div className="menu-grid">{content.map(item => <ProductCard key={item.id} item={item} onClick={() => onProductClick(item)} />)}</div>}
                                </AccordionCategory>
                            )
                        })}
                    </div>
                ) : (
                    <div className="menu-grid">{[...currentItems, ...currentSubGroups].map(item => <ProductCard key={item.id} item={item} onClick={() => onProductClick(item)} />)}</div>
                )}
            </div>
        </>
    );
};


// --- Pantalla de Ticket ---
const TicketScreen: React.FC<any> = ({ ticketItems, totalTicket, onSubmitOrder, currentOrderNumber, onNavigate, onRemoveItem }) => (
    <>
        <header className="ticket-header"><button onClick={() => onNavigate('menu')} className="btn-back"><IconBack /></button><h2>Pedido Actual</h2><span className="order-number">#{String(currentOrderNumber).padStart(3, '0')}</span></header>
        <div className="ticket-scroll-area">
            {ticketItems.length === 0 ? <div className="ticket-placeholder"><p>Agrega productos para iniciar un pedido.</p></div> : <ul className="ticket-list">{ticketItems.map((item: TicketItem) => <TicketItemCard key={item.id} item={item} onRemove={onRemoveItem} />)}</ul>}
        </div>
        <div className="ticket-footer"><div className="ticket-total"><span>TOTAL:</span><span>${totalTicket.toFixed(2)}</span></div><div><button onClick={onSubmitOrder} disabled={ticketItems.length === 0} className="btn-submit-order">Cobrar y Enviar a Cocina</button></div></div>
    </>
);


// --- Barra de Navegación Inferior ---
const BottomNav: React.FC<{currentView: View, ticketCount: number, onNavigate: (v: View) => void}> = ({ currentView, ticketCount, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      <button className={`nav-button ${currentView === 'menu' ? 'active' : ''}`} onClick={() => onNavigate('menu')}>
          <IconMenu /> Menú
      </button>
      <button className={`nav-button ${currentView === 'ticket' ? 'active' : ''}`} onClick={() => onNavigate('ticket')}>
          <IconTicket /> Ticket {ticketCount > 0 && <span className="badge">{ticketCount}</span>}
      </button>
    </nav>
  );
};


// --- Componente de Acordeón ---
const AccordionCategory: React.FC<any> = ({ group, isActive, onToggle, onClick, children }) => {
    const hasContent = React.Children.count(children) > 0;
    const handleHeaderClick = () => onToggle ? onToggle() : (onClick ? onClick() : undefined);
    return (
        <div className="accordion-category">
            <button className={`accordion-header ${isActive ? 'open' : ''}`} onClick={handleHeaderClick} disabled={!onToggle && !onClick}>
                <span className="accordion-icon-main">{getIconForItem(group)}</span>
                <span className="accordion-title">{group.name}</span>
                {onToggle && <span className="accordion-icon-toggle">{isActive ? '−' : '+'}</span>}
            </button>
            {isActive && hasContent && <div className="accordion-content">{children}</div>}
        </div>
    )
}

// --- Iconos ---
const IconBack = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconTicket = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l-4 4l4 4m-4-4h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1"></path></svg>;

export default App;
