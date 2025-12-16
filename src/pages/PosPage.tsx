import React, { useEffect } from 'react'
import Modal from 'react-modal';

// Hooks y Stores
import { usePosLogic } from '../hooks/usePosLogic';
import { useUIStore } from '../store/useUIStore';
import { useMenuStore } from '../store/useMenuStore';
import { useTicketStore } from '../store/useTicketStore'; // Necesario para el total del modal
import { useShiftStore } from '../store/useShiftStore';
import { useAuthStore } from '../store/useAuthStore';
// Componentes Refactorizados
import { MenuScreen } from '../components/pos/MenuScreen';
import { TicketScreen } from '../components/pos/TicketScreen';
import { BottomBar } from '../components/pos/BottomBar';

// Modales y Templates
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { PaymentModal } from '../components/PaymentModal';
import { CustomizeCrepeModal } from '../components/CustomizeCrepeModal';
import { CustomizeVariantModal } from '../components/CustomizeVariantModal';
import { ShiftsScreen } from '../components/ShiftsScreen';

export const PosPage: React.FC = () => {
  // 1. Conectamos con el cerebro (Lógica de Negocio)
  const { 
    orderMode, 
    customerName, 
    setCustomerName, 
    handleModeChange, 
    handleAddItem, 
    handleMainBtnClick, 
    handleFinalizeOrder,
    isPaymentModalOpen,
    setIsPaymentModalOpen
  } = usePosLogic();

  // 2. Conectamos con la UI Global (Modales y Navegación)
  const { 
    view, 
    activeModal, 
    groupToCustomize, 
    itemToSelectVariant, 
    closeModals, 
    orderToPrint 
  } = useUIStore();

  // 3. Datos necesarios para los modales
  const { modifiers, rules } = useMenuStore();
  const { getTotal } = useTicketStore();

  
  return (
    <>
      {/* --- SECCIÓN SUPERIOR: BARRA DE ESTADO Y MESA --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2 bg-base-100 p-2 rounded-box shadow-sm border border-base-200">
         
         {/* Selector de Modo (Mesa / Llevar) */}
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

         {/* Input Inteligente de Nombre */}
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

      {/* --- CONTENIDO PRINCIPAL --- */}
      {/* Ahora es limpio: o mostramos el menú, o mostramos el ticket */}
      {view === 'menu' ? <MenuScreen /> : <TicketScreen />}

      {/* --- BARRA INFERIOR --- */}
      <BottomBar onAction={handleMainBtnClick} />

      {/* --- GESTIÓN DE MODALES --- */}
      
      {/* 1. Modal de Crepa Personalizada */}
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

      {/* 2. Modal de Variantes (Frappés, etc) */}
      {activeModal === 'variant_select' && itemToSelectVariant && (
          <CustomizeVariantModal 
            isOpen={true} 
            onClose={closeModals} 
            item={itemToSelectVariant} 
            allModifiers={modifiers} 
            onAddItem={handleAddItem} 
          />
      )}
      
      {/* 3. Modal de Cobro */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        total={getTotal()} 
        onConfirm={handleFinalizeOrder} 
      />

      {/* 4. Template de Impresión (Invisible) */}
      <ReceiptTemplate order={orderToPrint} />

      {/* 5. Modal de Control de Turnos/Caja */}
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