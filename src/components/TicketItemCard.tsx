import { motion, useAnimation, type PanInfo } from 'framer-motion';
import type { TicketItem } from '../types/menu';
import './TicketItemCard.css';

interface Props {
  item: TicketItem;
  onRemove: (id: string) => void;
}

const IconTrash = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

export const TicketItemCard: React.FC<Props> = ({ item, onRemove }) => {
  const controls = useAnimation();
  const dragThreshold = -80; // Drag distance threshold to trigger delete

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < dragThreshold) {
      // Animate out to the left
      controls.start({
        x: "-110%", // A little more to be sure it's off-screen
        opacity: 0,
        transition: { type: "spring", stiffness: 500, damping: 50 } // Stiffer spring for a quick exit
      }).then(() => onRemove(item.id));
    } else {
      // Animate back to origin
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 35 } });
    }
  };

  return (
    <li className="ticket-item">
      <div className="delete-action-background">
        <IconTrash />
      </div>
      
      <motion.div
        className="ticket-item-content"
        drag="x"
        dragConstraints={{ right: 0, left: 0 }}
        onDragEnd={onDragEnd}
        animate={controls}
        dragElastic={{ left: 0.2, right: 0.05 }} // More elastic to the left, less to the right
        whileTap={{ scale: 0.98, cursor: 'grabbing' }}
      >
        <div className="ticket-item-header">
          <div className="ticket-item-info">
            <span>{item.baseName} {item.details?.variantName && `(${item.details.variantName})`}</span>
          </div>
          <span className="ticket-item-price">${item.finalPrice.toFixed(2)}</span>
        </div>
        
        {item.details && item.details.selectedModifiers.length > 0 && (
          <ul className="ticket-item-details">
            {item.details.selectedModifiers.map(mod => (
                <li key={mod.id}>
                    {mod.name} {mod.price > 0 ? `(+$${mod.price.toFixed(2)})` : ''}
                </li>
            ))}
          </ul>
        )}
      </motion.div>
    </li>
  );
};