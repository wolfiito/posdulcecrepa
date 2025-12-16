// src/components/ZReportTemplate.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import type { ShiftMetrics, Shift } from '../services/shiftService';
import { Timestamp } from '../firebase';

interface Props {
  shift: Shift | null;
  metrics: ShiftMetrics | null;
  finalCount: number; // Lo que contaste físicamente
}

export const ZReportTemplate: React.FC<Props> = ({ shift, metrics, finalCount }) => {
  if (!shift || !metrics) return null;

  // Helpers de fecha
  const formatDate = (val: any) => {
      if (!val) return 'Presente';
      const d = val instanceof Timestamp ? val.toDate() : new Date(val);
      return d.toLocaleString('es-MX');
  };

  const difference = finalCount - metrics.expectedCash;

  return createPortal(
    <div className="hidden print:block bg-white text-black font-mono text-[10px] leading-tight p-1">
      
      {/* 1. ENCABEZADO */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-black uppercase">CORTE Z</h2>
        <p className="font-bold">Dulce Crepa</p>
        <div className="my-1 border-t border-b border-black py-1">
            <p>Cajero: {shift.openedBy}</p>
            <p>Inicio: {formatDate(shift.openedAt)}</p>
            <p>Cierre: {formatDate(new Date())}</p>
        </div>
      </div>

      {/* 2. RESUMEN DE VENTAS */}
      <div className="mb-2">
        <p className="font-bold uppercase border-b border-black mb-1">Resumen de Ventas</p>
        <div className="flex justify-between"><span>(+) Ventas Totales:</span> <span>${metrics.totalSales.toFixed(2)}</span></div>
        <div className="flex justify-between pl-2"><span>Efectivo:</span> <span>${metrics.cashTotal.toFixed(2)}</span></div>
        <div className="flex justify-between pl-2"><span>Tarjeta:</span> <span>${metrics.cardTotal.toFixed(2)}</span></div>
        <div className="flex justify-between pl-2"><span>Transferencia:</span> <span>${metrics.transferTotal.toFixed(2)}</span></div>
      </div>

      {/* 3. FLUJO DE EFECTIVO (La comprobación real) */}
      <div className="mb-2">
        <p className="font-bold uppercase border-b border-black mb-1">Balance de Caja</p>
        <div className="flex justify-between"><span>Fondo Inicial:</span> <span>${shift.initialFund.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>(+) Ventas Efec.:</span> <span>${metrics.cashTotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>(-) Gastos/Retiros:</span> <span>${metrics.totalExpenses.toFixed(2)}</span></div>
        <div className="border-t border-dashed border-black my-1"></div>
        <div className="flex justify-between font-bold text-xs"><span>= DEBE HABER:</span> <span>${metrics.expectedCash.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-xs"><span>= REAL (Contado):</span> <span>${finalCount.toFixed(2)}</span></div>
        
        <div className="mt-1 flex justify-between font-black bg-black text-white p-1">
            <span>DIFERENCIA:</span> 
            <span>{difference > 0 ? '+' : ''}${difference.toFixed(2)}</span>
        </div>
      </div>

      {/* 4. GASTOS DETALLADOS */}
      {metrics.expenses.length > 0 && (
          <div className="mb-2">
            <p className="font-bold uppercase border-b border-black mb-1">Detalle Gastos</p>
            {metrics.expenses.map((exp, i) => (
                <div key={i} className="flex justify-between">
                    <span className="truncate w-3/4">{exp.description}</span>
                    <span>-${exp.amount.toFixed(2)}</span>
                </div>
            ))}
          </div>
      )}

      {/* 5. PIE */}
      <div className="text-center mt-4 border-t border-black pt-2">
        <p>__________________________</p>
        <p className="mt-1">Firma del Cajero</p>
        <br />
        <p className="text-[8px]">Sistema DulceCrepa POS</p>
      </div>

    </div>,
    document.body
  );
};