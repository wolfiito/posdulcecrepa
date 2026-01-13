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
import { OrderModeModal } from '../components/OrderModeModal'; // <--- IMPORTAR

export const PosPage: React.FC = () => {
  const { 
    // Ya no necesitamos handleModeChange ni los setters directos aquí
    handleAddItem, 
    handleMainBtnClick, 
    handleFinalizeOrder,
    handleModeConfirmed, // <--- NUEVO
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isModeModalOpen,     // <--- NUEVO
    setIsModeModalOpen   // <--- NUEVO
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

  return (
    <>
      {/* 1. HEADER LIMPIO: 
          Hemos quitado los botones de Mesa/Llevar.
          Ahora solo dejamos un padding para que no se pegue al techo.
      */}
      <div className="h-2"></div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="pb-24"> 
        {view === 'menu' ? <MenuScreen /> : <TicketScreen />}
      </div>

      {/* 3. BARRA INFERIOR */}
      <BottomBar onAction={handleMainBtnClick} />

      {/* --- 4. MODALES --- */}
      
      {/* A. NUEVO MODAL DE MODO */}
      <OrderModeModal 
          isOpen={isModeModalOpen}
          onClose={() => setIsModeModalOpen(false)}
          onConfirm={handleModeConfirmed}
      />

      {/* B. Modal Crepa */}
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

      {/* C. Modal Variantes */}
      {activeModal === 'variant_select' && itemToSelectVariant && (
          <CustomizeVariantModal 
            isOpen={true} 
            onClose={closeModals} 
            item={itemToSelectVariant} 
            allModifiers={modifiers} 
            onAddItem={handleAddItem} 
          />
      )}
      
      {/* D. Modal Cobro */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        total={getTotal()} 
        onConfirm={(details) => handleFinalizeOrder(details)} 
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