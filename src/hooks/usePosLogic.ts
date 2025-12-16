// src/hooks/usePosLogic.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTicketStore } from '../store/useTicketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore'; // <--- Importante
import { useUIStore } from '../store/useUIStore';
import { useMenuStore } from '../store/useMenuStore';
import { orderService } from '../services/orderService';
import type { OrderMode, PaymentDetails } from '../types/order';
import type { TicketItem } from '../types/menu';

export const usePosLogic = () => {
  // 1. Hooks de Estado Global
  const { startListening } = useMenuStore();
  const { currentUser } = useAuthStore();
  const { currentShift } = useShiftStore(); // <--- Estado de la caja del usuario actual
  
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
  const [isProcessing, setIsProcessing] = useState(false);

  // 3. Inicialización
  useEffect(() => {
    const unsubscribe = startListening();
    return () => unsubscribe();
  }, [startListening]);

  // 4. Lógica de Negocio: Manejo de Modos (Mesas vs Llevar)
  const handleModeChange = useCallback((mode: OrderMode) => {
    setOrderMode(mode);
    if (mode !== 'Para Llevar') {
        setCustomerName(mode); // Auto-asignar nombre de mesa
    } else {
        setCustomerName(''); // Limpiar para cliente manual
    }
  }, [setOrderMode, setCustomerName]);

  // 5. Lógica de Negocio: Agregar Items
  const handleAddItem = useCallback((item: TicketItem) => {
    addItem(item);
    closeModals();
    setView('menu');
    navigateToGroup(null);
  }, [addItem, closeModals, setView, navigateToGroup]);

  // 6. Lógica de Negocio: Validación y Preparación de Pago
  const handleMainBtnClick = useCallback(() => {
      // A. ¿Hay items?
      if (items.length === 0) return;
      
      const isMesero = currentUser?.role === 'MESERO';
      const isTakeOut = orderMode === 'Para Llevar';
      
      // --- DEBUG TEMPORAL (Míralo en la consola F12) ---
      console.log("INTENTO DE COBRO:");
      console.log("- Modo:", orderMode);
      console.log("- Es Mesero:", isMesero);
      console.log("- Caja Abierta (Shift):", currentShift);
      // --------------------------------------------------
      
      // B. VALIDACIÓN DE CAJA (CRÍTICO)
      // Si es venta directa (Para Llevar) y NO es mesero (es Cajero/Admin)
      if (isTakeOut && !isMesero) {
          if (!currentShift) {
              toast.error("⛔ CAJA CERRADA: Debes abrir turno para cobrar.");
              openShiftModal(); // Abre la pantalla de turnos automáticamente
              return;
          }
      }
      
      // C. VALIDACIÓN DE NOMBRE
      if (isTakeOut && !customerName.trim()) {
          toast.warning("⚠️ Escribe el nombre del cliente para llevar");
          document.getElementById('customer-name-input')?.focus();
          return;
      }
      
      // D. DECISIÓN DE RUTA
      if (isTakeOut && !isMesero) {
          // Cajero cobrando -> Pagar
          setIsPaymentModalOpen(true); 
      } else {
          // Mesero o Mesa -> Enviar a Cocina (Sin cobrar aun)
          handleFinalizeOrder(undefined); 
      }
  }, [items, orderMode, customerName, currentUser, currentShift, openShiftModal]);

  // 7. Lógica de Negocio: Finalizar Orden (Transacción)
  const handleFinalizeOrder = async (paymentDetails?: PaymentDetails) => {
      if (isProcessing) return;
      setIsProcessing(true);

      const cashierName = currentUser?.name || 'Cajero';
      const total = getTotal();
      const currentMode = orderMode; // Copia local para restaurar estado
      
      try {
          setIsPaymentModalOpen(false); 
          
          await orderService.createOrder(
              items, 
              total, 
              currentMode, 
              cashierName,
              customerName, 
              paymentDetails
          );
          
          // Limpieza inteligente
          clearTicket();
          
          if (currentMode !== 'Para Llevar') {
              setCustomerName(currentMode);
              setOrderMode(currentMode);
          }
          
          setView('menu');
          toast.success(`¡Orden enviada correctamente!`);

      } catch (error) {
          console.error(error);
          toast.error('Error al procesar la orden');
      } finally {
          setIsProcessing(false);
      }
  };

  return {
    // Estado
    orderMode,
    customerName,
    isPaymentModalOpen,
    isProcessing,
    setIsPaymentModalOpen,
    setCustomerName,
    
    // Métodos / Handlers
    handleModeChange,
    handleAddItem,
    handleMainBtnClick,
    handleFinalizeOrder
  };
};