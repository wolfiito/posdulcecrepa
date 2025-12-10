// src/components/Skeletons.tsx
import React from 'react';

// 1. Skeleton para Tarjetas (Ideal para el Menú y Órdenes)
export const CardSkeleton = () => {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200 h-full animate-pulse">
      <div className="card-body p-4">
        {/* Encabezado: Número y Estado */}
        <div className="flex justify-between items-start mb-4">
          <div className="h-6 w-16 bg-base-300 rounded"></div>
          <div className="h-4 w-12 bg-base-300 rounded"></div>
        </div>
        
        {/* Lista de items */}
        <div className="space-y-2 mb-6">
          <div className="h-3 w-full bg-base-300 rounded"></div>
          <div className="h-3 w-3/4 bg-base-300 rounded"></div>
          <div className="h-3 w-1/2 bg-base-300 rounded"></div>
        </div>

        {/* Footer: Total y Botón */}
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-base-200">
          <div className="h-8 w-20 bg-base-300 rounded"></div>
          <div className="h-8 w-24 bg-base-300 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// 2. Skeleton para Tablas (Ideal para Admin de Productos/Usuarios)
export const TableRowSkeleton = () => {
  return (
    <tr className="animate-pulse">
      <td className="p-3">
        <div className="h-4 w-32 bg-base-300 rounded mb-2"></div>
        <div className="h-3 w-20 bg-base-300 rounded opacity-60"></div>
      </td>
      <td className="p-3">
        <div className="h-5 w-16 bg-base-300 rounded-full"></div>
      </td>
      <td className="p-3 text-right">
        <div className="h-5 w-12 bg-base-300 rounded ml-auto"></div>
      </td>
      <td className="p-3 flex justify-center gap-2">
        <div className="h-6 w-6 bg-base-300 rounded"></div>
        <div className="h-6 w-6 bg-base-300 rounded"></div>
      </td>
    </tr>
  );
};