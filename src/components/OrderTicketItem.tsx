// src/components/OrderTicketItem.tsx
import React from 'react';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import type { TicketItem } from '../types/menu';

interface Props {
  item: TicketItem;
  orderId: string;
  isEditable: boolean;
  onRemove: (item: TicketItem, orderId: string) => void;
}

const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

export const OrderTicketItem: React.FC<Props> = ({ item, orderId, isEditable, onRemove }) => {
  const controls = useAnimation();
  const dragThreshold = -60; 

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isEditable) return;
    
    if (info.offset.x < dragThreshold) {
      controls.start({
        x: "-100%", 
        opacity: 0,
        height: 0,
        marginBottom: 0,
        transition: { duration: 0.3 } 
      }).then(() => onRemove(item, orderId));
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 35 } });
    }
  };

  return (
    <li className="relative w-full overflow-hidden rounded-lg">
      {/* FONDO DE ACCIÓN (ROJO) */}
      {isEditable && (
          <div className="absolute inset-y-0 right-0 w-full bg-error text-white flex items-center justify-end pr-4 z-0">
            <IconTrash />
          </div>
      )}
      
      {/* TARJETA DESLIZABLE */}
      <motion.div
        className="relative bg-[#fffdf5] py-1 border-b border-dashed border-gray-200 z-10"
        drag={isEditable ? "x" : false}
        dragConstraints={{ right: 0, left: 0 }}
        onDragEnd={onDragEnd}
        animate={controls}
        dragElastic={{ left: 0.5, right: 0.02 }} 
        style={{ touchAction: "pan-y" }}
      >
        <div className="flex justify-between items-start text-sm leading-tight pr-1">
            <span className="font-medium text-gray-700 flex-1 truncate">
                <span className="font-bold text-gray-900 mr-1">{item.quantity || 1}x</span> 
                {item.baseName}
                {item.details?.selectedModifiers && item.details.selectedModifiers.length > 0 && (
                    <span className="text-[10px] block opacity-50 ml-5 truncate">
                        {item.details.selectedModifiers.map(m => m.name).join(', ')}
                    </span>
                )}
            </span>
            <span className="font-mono font-bold text-gray-400 text-xs ml-2">
                ${item.finalPrice.toFixed(2)}
            </span>
        </div>
      </motion.div>
    </li>
  );
};
