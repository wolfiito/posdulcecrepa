// src/hooks/usePosLogic.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTicketStore } from '../store/useTicketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import { useUIStore } from '../store/useUIStore';
import { useMenuStore } from '../store/useMenuStore';
import { orderService } from '../services/orderService';
import type { OrderMode, PaymentDetails } from '../types/order';
import type { TicketItem } from '../types/menu';

export const usePosLogic = () => {
  const { startListening } = useMenuStore();
  const { currentUser, activeBranchId } = useAuthStore();
  const { currentShift } = useShiftStore(); 
  
  const { 
    clearTicket, 
    orderMode, 
    customerName, 
    setOrderMode, 
    setCustomerName,  
    addItem, 
  } = useTicketStore();
  
  const { 
    closeModals, 
    setView, 
    navigateToGroup,
    openShiftModal 
  } = useUIStore();

  // CORRECCIÓN: Declarar cada estado individualmente
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = startListening();
    return () => unsubscribe();
  }, [startListening]);

  const handleAddItem = useCallback((item: TicketItem) => {
    addItem(item);
    closeModals();
    setView('menu');
    navigateToGroup(null);
  }, [addItem, closeModals, setView, navigateToGroup]);

  const handleFinalizeOrder = useCallback(async (
      paymentDetails?: PaymentDetails, 
      overrideMode?: OrderMode, 
      overrideName?: string
  ) => {
      if (isProcessing) return;
      if (!activeBranchId) {
        toast.error("ERROR: No hay sucursal seleccionada. Reinicia sesión.");
        return;
      }
      const currentItems = useTicketStore.getState().items;

      if (currentItems.length === 0) {
          toast.error("Error: La orden está vacía (Intento de envío fallido)");
          return;
      }

      setIsProcessing(true);

      const currentMode = overrideMode || useTicketStore.getState().orderMode;
      const currentClientName = overrideName || useTicketStore.getState().customerName;
      
      const cashierName = currentUser?.name || 'Cajero';
      const total = useTicketStore.getState().getTotal();

      const shouldPrint = false; // DESACTIVADO: Solo se imprime al cobrar en la pantalla de órdenes
      const activeShiftId = undefined;

      try {
          setIsPaymentModalOpen(false); 
          
          await orderService.createOrder(
            activeBranchId,
            currentItems, 
            total, 
            currentMode, 
            cashierName,
            currentClientName, 
            shouldPrint, 
            paymentDetails,
            activeShiftId
          );
          
          clearTicket();
          setView('menu');

          toast.success(`¡Enviado a cocina: ${currentClientName}! 👨‍🍳`);

      } catch (error: any) {
          console.error(error);
          toast.error(error.message || 'Error al procesar la orden');
      } finally {
          setIsProcessing(false);
      }
  }, [isProcessing, currentUser, currentShift, clearTicket, setView, activeBranchId]);

  const handleModeConfirmed = useCallback((selectedMode: string, finalName: string) => {
    if (!activeBranchId) {
        toast.error("No hay sucursal activa");
        return;
    }

      setOrderMode(selectedMode as OrderMode);
      setCustomerName(finalName);
      setIsModeModalOpen(false);

      handleFinalizeOrder(undefined, selectedMode as OrderMode, finalName); 
  }, [currentUser, currentShift, openShiftModal, setOrderMode, setCustomerName, handleFinalizeOrder, activeBranchId]);

  const handleMainBtnClick = useCallback(() => {
    if (useTicketStore.getState().items.length === 0) {
        toast.warning("Agrega productos primero");
        return;
    }
    setIsModeModalOpen(true);
}, []);

  return {
    orderMode,
    customerName,
    isPaymentModalOpen,
    isModeModalOpen,
    isProcessing,
    setIsPaymentModalOpen,
    setIsModeModalOpen,
    setCustomerName,
    
    handleAddItem,
    handleMainBtnClick,
    handleModeConfirmed,
    handleFinalizeOrder
  };
};