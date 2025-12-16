// src/components/ZReportTemplate.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import type { ShiftMetrics, Shift } from '../services/shiftService';
import { Timestamp } from '../firebase';

interface Props {
  shift: Shift | null;
  metrics: ShiftMetrics | null;
  finalCount: number; 
}

export const ZReportTemplate: React.FC<Props> = ({ shift, metrics, finalCount }) => {
  if (!shift || !metrics) return null;

  const formatDate = (val: any) => {
      if (!val) return 'Presente';
      const d = val instanceof Timestamp ? val.toDate() : new Date(val);
      return d.toLocaleString('es-MX', { 
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
      });
  };

  const difference = finalCount - metrics.expectedCash;

  return createPortal(
    <div className="hidden print:block bg-white text-black font-mono text-[10px] leading-tight p-1">
      
      {/* 1. ENCABEZADO */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-black uppercase">CORTE Z</h2>
        <p className="font-bold">Dulce Crepa</p>
        <div className="my-1 border-t border-b border-black py-1 dashed">
            <p>Cajero: {shift.openedBy}</p>
            <p>Apertura: {formatDate(shift.openedAt)}</p>
            <p>Cierre: {formatDate(new Date())}</p>
        </div>
      </div>

      {/* 2. COMPARATIVA (GANANCIA DEL TURNO) */}
      <div className="mb-3">
        <p className="font-bold uppercase border-b border-black mb-1">Balance Financiero</p>
        <div className="flex justify-between">
            <span>(+) Ventas Totales:</span> 
            <span>${metrics.totalSales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
            <span>(-) Gastos Totales:</span> 
            <span>-${metrics.totalExpenses.toFixed(2)}</span>
        </div>
        <div className="border-t border-dotted border-black my-1"></div>
        <div className="flex justify-between font-bold text-xs">
            <span>= UTILIDAD NETA:</span> 
            <span>${metrics.netBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* 3. FLUJO DE EFECTIVO (CUADRE DE CAJA) */}
      <div className="mb-3">
        <p className="font-bold uppercase border-b border-black mb-1">Cuadre de Efectivo</p>
        <div className="flex justify-between"><span>Fondo Inicial:</span> <span>${shift.initialFund.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>(+) Venta Efectivo:</span> <span>${metrics.cashTotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>(-) Gastos Efectivo:</span> <span>${metrics.totalExpenses.toFixed(2)}</span></div>
        
        <div className="border-t border-dashed border-black my-1"></div>
        
        <div className="flex justify-between font-bold"><span>DEBE HABER:</span> <span>${metrics.expectedCash.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold"><span>REAL (CONTADO):</span> <span>${finalCount.toFixed(2)}</span></div>
        
        <div className={`mt-1 flex justify-between font-black p-1 ${difference < 0 ? 'border border-black' : ''}`}>
            <span>DIFERENCIA:</span> 
            <span>{difference > 0 ? '+' : ''}${difference.toFixed(2)}</span>
        </div>
        {difference !== 0 && (
            <p className="text-center italic mt-1 text-[9px]">
                {difference > 0 ? '(Sobra dinero)' : '(Falta dinero)'}
            </p>
        )}
      </div>

      {/* 4. DESGLOSE DE GASTOS */}
      {metrics.expenses.length > 0 ? (
          <div className="mb-3">
            <p className="font-bold uppercase border-b border-black mb-1">Detalle Gastos</p>
            {metrics.expenses.map((exp, i) => (
                <div key={i} className="flex justify-between mb-1">
                    <span className="truncate w-3/4 pr-1">{exp.description}</span>
                    <span>-${exp.amount.toFixed(2)}</span>
                </div>
            ))}
            <div className="text-right font-bold border-t border-dotted border-black">
                Total: -${metrics.totalExpenses.toFixed(2)}
            </div>
          </div>
      ) : (
          <div className="mb-3 text-center opacity-50 text-[9px]">- Sin gastos registrados -</div>
      )}

      {/* 5. PRODUCTOS VENDIDOS */}
      <div className="mb-2">
        <p className="font-bold uppercase border-b border-black mb-1">Productos Vendidos</p>
        <div className="flex text-[9px] font-bold border-b border-dotted border-black mb-1">
            <span className="w-6">Cant</span>
            <span className="flex-1">Producto</span>
            <span className="w-12 text-right">Total</span>
        </div>
        {metrics.productBreakdown.length > 0 ? (
            metrics.productBreakdown.map((p, i) => (
                <div key={i} className="flex mb-1">
                    <span className="w-6 font-bold">{p.quantity}</span>
                    <span className="flex-1 leading-tight pr-1">{p.name}</span>
                    <span className="w-12 text-right">${p.total.toFixed(2)}</span>
                </div>
            ))
        ) : (
            <p className="text-center italic text-[9px]">No hubo ventas</p>
        )}
      </div>

      {/* PIE DE PÁGINA */}
      <div className="text-center mt-6 border-t border-black pt-4">
        <p>__________________________</p>
        <p className="mt-1 font-bold">Firma de Conformidad</p>
        <br />
        <p className="text-[8px]">Generado por Dulce Crepa POS</p>
        <p className="text-[8px]">{new Date().toLocaleString()}</p>
      </div>

    </div>,
    document.body
  );
};