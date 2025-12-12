// src/components/ReceiptTemplate.tsx
import React from 'react';
// Importamos createPortal para "teletransportar" el ticket fuera de la App
import { createPortal } from 'react-dom';
import type { Order } from '../types/order';
import { Timestamp } from '../firebase';

interface Props {
  order: Order | null;
}

export const ReceiptTemplate: React.FC<Props> = ({ order }) => {
  if (!order) return null;

  // Lógica segura para obtener el string de fecha
  let dateStr = '';
  
  if (order.createdAt instanceof Timestamp) {
      dateStr = order.createdAt.toDate().toLocaleString('es-MX');
  } else if (order.createdAt instanceof Date) {
      dateStr = order.createdAt.toLocaleString('es-MX');
  } else {
      // Caso fallback (FieldValue o indefinido)
      dateStr = new Date().toLocaleString('es-MX');
  }

  // Usamos un Portal para renderizar esto directamente en el body del navegador
  // Esto lo "saca" de tu diseño principal de React
  return createPortal(
    <div id="receipt-print-area" className="hidden print:block bg-white text-black">
      
      {/* Encabezado */}
      <div className="print-text print-center mb-2">
        <h2 className="text-lg font-black uppercase mb-1">Dulce Crepa</h2>
        <p className="text-[10px]">Ticket de Venta</p>
        <p className="text-[10px]">{dateStr}</p>
        <p className="text-sm font-bold my-1">Orden #{order.orderNumber}</p>
        <p className="text-xs uppercase font-bold mb-1">
          [{order.mode}]
        </p>
      </div>

      <div className="print-line" />

      {/* Lista de Productos */}
      <div className="flex flex-col gap-2 mb-2 print-text">
        {order.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex flex-col">
            <div className="flex justify-between items-start font-bold">
              <span className="w-[75%] leading-tight">
                1 {item.baseName}
                {item.details?.variantName && ` (${item.details.variantName})`}
              </span>
              <span>${item.finalPrice.toFixed(2)}</span>
            </div>
            
            {item.details?.selectedModifiers && item.details.selectedModifiers.length > 0 && (
              <div className="pl-2 text-[10px] leading-tight mt-1">
                {item.details.selectedModifiers.map((mod, idx) => (
                  <div key={idx}>
                    + {mod.name} {mod.price > 0 && `($${mod.price})`}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="print-line" />

      {/* Totales */}
      <div className="print-text print-right mb-4">
        <div className="text-lg font-black flex justify-between items-center">
          <span>TOTAL:</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
        <p className="text-[10px] mt-1 uppercase">
            Estatus: {order.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
        </p>
      </div>

      {/* Pie de Página */}
      <div className="print-text print-center text-[10px] mt-4">
        <p>¡Gracias por su compra!</p>
        <p className="mt-1">Wifi: DulceCrepa_Invitados</p>
      </div>
      
      <br/><br/>
    </div>,
    document.body // <--- Aquí está la magia: Lo mandamos directo al body
  );
};