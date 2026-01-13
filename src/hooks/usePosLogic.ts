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
  // 1. Hooks (Solo para renderizar la UI)
  const { startListening } = useMenuStore();
  const { currentUser } = useAuthStore();
  const { currentShift } = useShiftStore(); 
  
  const { 
    addItem, 
    orderMode, 
    setOrderMode, 
    customerName, 
    setCustomerName,  
    clearTicket 
  } = useTicketStore();
  
  const { 
    closeModals, 
    setView, 
    navigateToGroup,
    openShiftModal 
  } = useUIStore();

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

  // --- FINALIZAR ORDEN (VERSIÓN BLINDADA) ---
  const handleFinalizeOrder = useCallback(async (
      paymentDetails?: PaymentDetails, 
      overrideMode?: OrderMode, 
      overrideName?: string
  ) => {
      if (isProcessing) return;

      // TRUCO PRO: Leemos directo del Store, ignorando closures de React
      // Esto garantiza que SIEMPRE tenemos los items reales en este milisegundo.
      const currentItems = useTicketStore.getState().items;

      if (currentItems.length === 0) {
          toast.error("Error: La orden está vacía (Intento de envío fallido)");
          return;
      }

      setIsProcessing(true);

      // Usamos los overrides si existen, si no, leemos directo del store también para asegurar
      const currentMode = overrideMode || useTicketStore.getState().orderMode;
      const currentClientName = overrideName || useTicketStore.getState().customerName;
      
      const cashierName = currentUser?.name || 'Cajero';
      // Recalculamos el total con los items frescos
      const total = currentItems.reduce((sum, item) => sum + item.finalPrice, 0);
      
      const shouldPrint = currentUser?.role !== 'MESERO';
      const activeShiftId = (shouldPrint && currentShift) ? currentShift.id : undefined;

      try {
          setIsPaymentModalOpen(false); 
          
          await orderService.createOrder(
              currentItems, // Enviamos los items frescos
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

          if (shouldPrint) {
              toast.success(`¡Orden cobrada e impresa! 🖨️`);
          } else {
              toast.success(`¡Enviado a cocina: ${currentClientName}! 👨‍🍳`);
          }

      } catch (error) {
          console.error(error);
          toast.error('Error al procesar la orden');
      } finally {
          setIsProcessing(false);
      }
  }, [isProcessing, currentUser, currentShift, clearTicket, setView]);

  const handleModeConfirmed = useCallback((selectedMode: OrderMode, finalName: string) => {
      setOrderMode(selectedMode);
      setCustomerName(finalName);
      setIsModeModalOpen(false);

      const isMesero = currentUser?.role === 'MESERO';
      const isTakeOut = selectedMode === 'Para Llevar';

      if (isTakeOut && !isMesero) {
          if (!currentShift) {
              toast.error("⛔ CAJA CERRADA: Abre turno para cobrar.");
              openShiftModal(); 
              return;
          }
          // Cajero: Pagar
          setTimeout(() => setIsPaymentModalOpen(true), 100); 
      } else {
          // Mesero: Cocina
          handleFinalizeOrder(undefined, selectedMode, finalName); 
      }
  }, [currentUser, currentShift, openShiftModal, setOrderMode, setCustomerName, handleFinalizeOrder]);

  const handleMainBtnClick = useCallback(() => {
      // Verificamos items actuales para no abrir el modal si está vacío
      if (useTicketStore.getState().items.length === 0) {
          toast.warning("Agrega productos primero");
          return;
      }
      setIsModeModalOpen(true);
  }, []); // Sin dependencias, siempre lee fresco

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