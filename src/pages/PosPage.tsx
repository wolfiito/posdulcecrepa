// src/pages/PosPage.tsx
import React from 'react'
import Modal from 'react-modal';

// Hooks y Stores
import { usePosLogic } from '../hooks/usePosLogic';
import { useUIStore } from '../store/useUIStore';
import { useMenuStore } from '../store/useMenuStore';
import { useTicketStore } from '../store/useTicketStore'; 
import { ShiftsScreen } from '../components/ShiftsScreen';

// Componentes Refactorizados
import { MenuScreen } from '../components/pos/MenuScreen';
import { TicketScreen } from '../components/pos/TicketScreen';
import { BottomBar } from '../components/pos/BottomBar';

// Modales y Templates
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { PaymentModal } from '../components/PaymentModal';
import { CustomizeCrepeModal } from '../components/CustomizeCrepeModal';
import { CustomizeVariantModal } from '../components/CustomizeVariantModal';

export const PosPage: React.FC = () => {
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

  const { 
    view, 
    activeModal, 
    groupToCustomize, 
    itemToSelectVariant, 
    closeModals, 
    orderToPrint 
  } = useUIStore();

  const { modifiers, rules } = useMenuStore();
  const { getTotal } = useTicketStore();

  // --- CONFIGURACIÓN DE MODOS VISUALES ---
  const modes = [
      { id: 'Mesa 1', label: 'Mesa 1', icon: '🍽️' },
      { id: 'Mesa 2', label: 'Mesa 2', icon: '🍽️' },
      { id: 'Para Llevar', label: 'Llevar', icon: '🛍️' },
  ] as const;
  
  return (
    <>
      {/* --- 1. HEADER MODERNO --- */}
      <div className="flex flex-col gap-3 mb-4 sticky top-0 z-20 bg-base-200/50 backdrop-blur-md py-2 -mx-4 px-4 border-b border-base-200">
         
         <div className="flex w-full items-center justify-between gap-2">
             
             {/* A. SEGMENTED CONTROL (Selector de Modo) */}
             <div className="bg-base-300/50 p-1 rounded-2xl inline-flex relative">
                {modes.map((mode) => {
                    const isActive = orderMode === mode.id;
                    return (
                        <button 
                            key={mode.id} 
                            onClick={() => handleModeChange(mode.id)} 
                            className={`
                                relative px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200
                                flex items-center gap-1
                                ${isActive 
                                    ? 'bg-base-100 text-base-content shadow-sm scale-100' 
                                    : 'text-base-content/60 hover:bg-base-100/50'
                                }
                            `}
                        >
                            <span>{mode.icon}</span>
                            <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                    )
                })}
             </div>

             {/* B. INPUT NOMBRE (Solo aparece en Llevar) */}
             <div className="flex-1 flex justify-end">
                {orderMode === 'Para Llevar' ? (
                    <input 
                        type="text" 
                        placeholder="Nombre del cliente..." 
                        className="input input-sm bg-base-100 border-transparent focus:border-primary focus:outline-none rounded-xl w-full max-w-[180px] shadow-sm text-center font-bold placeholder:font-normal placeholder:text-sm"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        autoComplete="off"
                    />
                ) : (
                    <div className="badge badge-lg badge-primary badge-outline font-bold opacity-80">
                        Cuenta Abierta
                    </div>
                )}
             </div>
         </div>
      </div>

      {/* --- 2. CONTENIDO PRINCIPAL --- */}
      <div className="pb-24"> {/* Padding bottom extra para la barra fija */}
        {view === 'menu' ? <MenuScreen /> : <TicketScreen />}
      </div>

      {/* --- 3. BARRA INFERIOR --- */}
      <BottomBar onAction={handleMainBtnClick} />

      {/* --- 4. MODALES --- */}
      
      {/* Modal Crepa */}
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

      {/* Modal Variantes */}
      {activeModal === 'variant_select' && itemToSelectVariant && (
          <CustomizeVariantModal 
            isOpen={true} 
            onClose={closeModals} 
            item={itemToSelectVariant} 
            allModifiers={modifiers} 
            onAddItem={handleAddItem} 
          />
      )}
      
      {/* Modal Cobro */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        total={getTotal()} 
        onConfirm={handleFinalizeOrder} 
      />

      {/* Print Template */}
      <ReceiptTemplate order={orderToPrint} />

      {/* Modal Turnos */}
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