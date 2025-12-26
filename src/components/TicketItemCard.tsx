// src/components/TicketItemCard.tsx
import React from 'react';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import type { TicketItem } from '../types/menu';

interface Props {
  item: TicketItem;
  onRemove: (id: string) => void;
}

const IconTrash = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

export const TicketItemCard: React.FC<Props> = ({ item, onRemove }) => {
  const controls = useAnimation();
  const dragThreshold = -80; 

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < dragThreshold) {
      controls.start({
        x: "-100%", 
        opacity: 0,
        height: 0,
        marginBottom: 0,
        transition: { duration: 0.3 } 
      }).then(() => onRemove(item.id));
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 35 } });
    }
  };

  return (
    <li className="relative w-full mb-3 select-none group">
      {/* FONDO DE ACCIÓN (ROJO) */}
      <div className="absolute inset-y-0 right-0 w-full bg-error/10 text-error rounded-2xl flex items-center justify-end pr-6 z-0">
        <span className="flex items-center gap-2 font-bold text-sm">
            Eliminar <IconTrash />
        </span>
      </div>
      
      {/* TARJETA DESLIZABLE */}
      <motion.div
        className="relative bg-base-100 p-3 rounded-2xl shadow-sm z-10 active:cursor-grabbing cursor-grab border border-transparent hover:border-base-200 transition-colors"
        drag="x"
        dragConstraints={{ right: 0, left: 0 }}
        onDragEnd={onDragEnd}
        animate={controls}
        dragElastic={{ left: 0.2, right: 0.02 }} 
        whileTap={{ scale: 0.98 }}
        style={{ touchAction: "none" }}
      >
        <div className="flex justify-between items-start gap-3">
            {/* Cantidad (Por ahora 1x, preparado para futuro) */}
            <div className="flex items-center justify-center bg-base-200 w-8 h-8 rounded-lg text-xs font-bold shrink-0 text-base-content/70">
                1x
            </div>

            {/* Detalles */}
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="font-bold text-base-content text-sm leading-tight truncate">
                    {item.baseName}
                </div>
                {item.details?.variantName && (
                    <div className="text-primary text-xs font-medium">
                        {item.details.variantName}
                    </div>
                )}
                
                {/* Modificadores (Lista limpia) */}
                {item.details && item.details.selectedModifiers.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                    {item.details.selectedModifiers.map((mod, idx) => (
                        <span key={`${mod.id}-${idx}`} className="badge badge-xs badge-ghost text-[10px] h-auto py-0.5 px-1.5 border-base-200 text-base-content/60">
                            {mod.name}
                        </span>
                    ))}
                </div>
                )}
            </div>

            {/* Precio */}
            <div className="font-black text-base text-base-content shrink-0">
                ${item.finalPrice.toFixed(2)}
            </div>
        </div>
      </motion.div>
    </li>
  );
};