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
      
      // B. VALIDACIÓN DE CAJA (CRÍTICO)
      // Si es venta directa (Para Llevar) y NO es mesero (es Cajero/Admin)
      if (isTakeOut && !isMesero) {
          if (!currentShift) {
              toast.error("⛔ CAJA CERRADA: Debes abrir turno para cobrar.");
              openShiftModal(); 
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
      const currentMode = orderMode;
      
      // --- LÓGICA DE IMPRESIÓN ---
      // Si es MESERO, NO imprime (false). Si es otro rol, SÍ imprime (true).
      const shouldPrint = currentUser?.role !== 'MESERO';

      try {
          setIsPaymentModalOpen(false); 
          
          await orderService.createOrder(
              items, 
              total, 
              currentMode, 
              cashierName,
              customerName,
              shouldPrint, // <--- AQUI PASAMOS LA DECISIÓN DE IMPRIMIR
              paymentDetails
          );
          
          // Limpieza inteligente
          clearTicket();
          
          if (currentMode !== 'Para Llevar') {
              setCustomerName(currentMode);
              setOrderMode(currentMode);
          }
          
          setView('menu');

          // Mensaje personalizado según lo que pasó
          if (shouldPrint) {
              toast.success(`¡Orden cobrada e impresa! 🖨️`);
          } else {
              toast.success(`¡Orden enviada a cocina! 👨‍🍳`);
          }

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