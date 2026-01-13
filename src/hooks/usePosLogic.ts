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
  // 1. Hooks de Estado Global
  const { startListening } = useMenuStore();
  const { currentUser } = useAuthStore();
  const { currentShift } = useShiftStore(); 
  
  const { 
    addItem, 
    orderMode, 
    setOrderMode, 
    customerName, 
    setCustomerName, 
    items, 
    getTotal, 
    clearTicket 
  } = useTicketStore();
  
  const { 
    closeModals, 
    setView, 
    navigateToGroup,
    openShiftModal 
  } = useUIStore();

  // 2. Estado Local
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 3. Inicialización
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

  // 4. Botón Principal: Solo abre el modal
  const handleMainBtnClick = useCallback(() => {
      if (items.length === 0) {
          toast.warning("Agrega productos primero");
          return;
      }
      setIsModeModalOpen(true);
  }, [items]);

  // 5. NUEVA LÓGICA: Se ejecuta AL CONFIRMAR el modal
  const handleModeConfirmed = useCallback((selectedMode: OrderMode, finalName: string) => {
      // Guardamos en el store (para que la UI se actualice)
      setOrderMode(selectedMode);
      setCustomerName(finalName);
      setIsModeModalOpen(false);

      const isMesero = currentUser?.role === 'MESERO';
      const isTakeOut = selectedMode === 'Para Llevar';

      // Validación de Caja
      if (isTakeOut && !isMesero) {
          if (!currentShift) {
              toast.error("⛔ CAJA CERRADA: Abre turno para cobrar.");
              openShiftModal(); 
              return;
          }
      }
      
      // Decisión de Ruta
      if (isTakeOut && !isMesero) {
          // Cajero cobrando -> Pagar (Esperamos un poco para que el estado se asiente)
          setTimeout(() => setIsPaymentModalOpen(true), 100); 
      } else {
          // Mesero o Mesa -> Enviar a Cocina directo
          // IMPORTANTE: Pasamos finalName aquí directamente para evitar el error de "Anónimo"
          handleFinalizeOrder(undefined, selectedMode, finalName); 
      }
  }, [currentUser, currentShift, openShiftModal, setOrderMode, setCustomerName]);

  // 6. Finalizar Orden (CORREGIDO PARA RECIBIR ARGUMENTOS)
  const handleFinalizeOrder = async (
      paymentDetails?: PaymentDetails, 
      overrideMode?: OrderMode,    // <--- IMPORTANTE: Nuevo argumento
      overrideName?: string        // <--- IMPORTANTE: Nuevo argumento
  ) => {
      if (isProcessing) return;
      setIsProcessing(true);

      const cashierName = currentUser?.name || 'Cajero';
      const total = getTotal();
      
      // USAMOS EL VALOR MANUAL SI EXISTE, SI NO, EL DEL STORE
      // Esto arregla el bug: overrideName trae "Mesa 1" aunque el store siga vacío por milisegundos
      const currentMode = overrideMode || orderMode;
      const currentClientName = overrideName || customerName;
      
      // Debug rápido por si acaso (puedes borrarlo luego)
      console.log("Creando orden para:", currentClientName);

      const shouldPrint = currentUser?.role !== 'MESERO';
      const activeShiftId = (shouldPrint && currentShift) ? currentShift.id : undefined;

      try {
          setIsPaymentModalOpen(false); 
          
          await orderService.createOrder(
              items, 
              total, 
              currentMode, 
              cashierName,
              currentClientName, // <--- Aquí pasamos el nombre correcto
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
  };

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