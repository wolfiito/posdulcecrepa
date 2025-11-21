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
  const dragThreshold = -80; // Distancia para activar borrado

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < dragThreshold) {
      // Animar salida
      controls.start({
        x: "-100%", 
        opacity: 0,
        height: 0,
        marginBottom: 0,
        transition: { duration: 0.3 } 
      }).then(() => onRemove(item.id));
    } else {
      // Regresar a posición original
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 35 } });
    }
  };

  return (
    <li className="relative w-full mb-3 select-none group">
      {/* Fondo Rojo (Acción Eliminar) */}
      <div className="absolute inset-y-0 right-0 w-full bg-error/90 text-error-content rounded-box flex items-center justify-end pr-6 z-0">
        <span className="flex items-center gap-2 font-bold text-sm">
            Eliminar <IconTrash />
        </span>
      </div>
      
      {/* Contenido Frontal (Card) */}
      <motion.div
        className="relative bg-base-100 p-4 rounded-box shadow-sm border border-base-200 z-10 active:cursor-grabbing cursor-grab"
        drag="x"
        dragConstraints={{ right: 0, left: 0 }}
        onDragEnd={onDragEnd}
        animate={controls}
        // Elasticidad: poca a la derecha, normal a la izquierda
        dragElastic={{ left: 0.2, right: 0.02 }} 
        whileTap={{ scale: 0.98 }}
        style={{ touchAction: "none" }} // Importante para móviles
      >
        <div className="flex justify-between items-start mb-1">
          <div className="font-bold text-base-content pr-2">
            {item.baseName} 
            {item.details?.variantName && (
                <span className="text-primary font-normal ml-1 text-sm">
                    ({item.details.variantName})
                </span>
            )}
          </div>
          <span className="font-black text-lg text-success">
            ${item.finalPrice.toFixed(2)}
          </span>
        </div>
        
        {/* Lista de Modificadores */}
        {item.details && item.details.selectedModifiers.length > 0 && (
          <ul className="text-xs text-base-content/60 space-y-1 mt-2 border-l-2 border-base-200 pl-2">
            {item.details.selectedModifiers.map(mod => (
                <li key={mod.id} className="flex justify-between">
                    <span>• {mod.name}</span>
                    {mod.price > 0 && <span>+${mod.price.toFixed(2)}</span>}
                </li>
            ))}
          </ul>
        )}
        
        {/* Indicador visual de "deslizar" */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-10">
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg>
        </div>
      </motion.div>
    </li>
  );
};