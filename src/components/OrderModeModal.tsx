// src/components/OrderModeModal.tsx
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useAuthStore } from '../store/useAuthStore';
import { branchService } from '../services/branchService'; // Importamos servicio
import { toast } from 'sonner';

// Tipos
import type { OrderMode } from '../types/order';

Modal.setAppElement('#root');

interface OrderModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: OrderMode, customerName: string) => void;
}

export const OrderModeModal: React.FC<OrderModeModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { activeBranchId } = useAuthStore();
  
  const [mode, setMode] = useState<OrderMode | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  
  // Estado para la cantidad de mesas dinámica
  const [branchTableCount, setBranchTableCount] = useState<number>(10); // Default seguro
  const [loadingTables, setLoadingTables] = useState(false);

  // Cargamos la configuración de la sucursal al abrir
  useEffect(() => {
      if (isOpen && activeBranchId) {
          setLoadingTables(true);
          branchService.getBranchById(activeBranchId)
              .then(branch => {
                  if (branch && branch.tableCount) {
                      setBranchTableCount(branch.tableCount);
                  }
              })
              .catch(err => console.error("Error cargando mesas", err))
              .finally(() => setLoadingTables(false));
      }
      
      // Resetear formulario al abrir
      if (isOpen) {
          setMode(null);
          setTableNumber('');
          setCustomerName('');
      }
  }, [isOpen, activeBranchId]);

  const handleTableSelect = (num: number) => {
    const tableName = `Mesa ${num}`;
    setTableNumber(tableName);
    onConfirm(tableName as OrderMode, '');
  };

  const handleTakeout = () => {
    if (!customerName.trim()) {
        toast.warning("Escribe el nombre del cliente");
        return;
    }
    onConfirm('Para Llevar' as OrderMode, customerName);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="w-full max-w-4xl bg-base-100 rounded-3xl shadow-2xl outline-none p-0 overflow-hidden m-4 max-h-[90vh] flex flex-col"
      overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
    >
        {/* HEADER */}
        <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/50">
            <h2 className="text-xl font-black">Selecciona Modalidad</h2>
            <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost">✕</button>
        </div>

        {/* CONTENIDO (Dos Columnas) */}
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                
                {/* COLUMNA IZQUIERDA: COMER AQUÍ (MESAS DINÁMICAS) */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                         <span className="text-2xl">🍽️</span>
                         <h3 className="text-lg font-bold uppercase tracking-wider">Comer Aquí</h3>
                    </div>
                    
                    <div className="bg-base-200/50 rounded-2xl p-4 flex-1 border border-base-200">
                        {loadingTables ? (
                            <div className="flex justify-center items-center h-40">
                                <span className="loading loading-spinner loading-lg"></span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {/* GENERACIÓN DINÁMICA DE MESAS */}
                                {Array.from({ length: branchTableCount }, (_, i) => i + 1).map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleTableSelect(num)}
                                        className="btn btn-outline btn-primary h-auto py-3 flex flex-col gap-1 hover:scale-105 transition-transform"
                                    >
                                        <span className="text-xs opacity-60 font-normal">MESA</span>
                                        <span className="text-xl font-black">{num}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-center text-xs opacity-40 mt-3">
                            {branchTableCount} mesas disponibles en esta sucursal
                        </p>
                    </div>
                </div>

                {/* COLUMNA DERECHA: PARA LLEVAR (Igual que antes) */}
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 text-secondary">
                         <span className="text-2xl">🥡</span>
                         <h3 className="text-lg font-bold uppercase tracking-wider">Para Llevar</h3>
                    </div>

                    <div className="bg-base-200/50 rounded-2xl p-6 flex-1 border border-base-200 flex flex-col justify-center">
                        <label className="label">
                            <span className="label-text font-bold">Nombre del Cliente</span>
                        </label>
                        <input 
                            type="text" 
                            className="input input-lg input-bordered w-full mb-4 text-lg font-bold"
                            placeholder="Ej. Raúl"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTakeout()}
                            autoFocus
                        />
                        
                        <button 
                            onClick={handleTakeout}
                            disabled={!customerName.trim()}
                            className="btn btn-secondary btn-lg w-full shadow-lg"
                        >
                            Confirmar Pedido ➝
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </Modal>
  );
};