// src/components/ReturnInventoryModal.tsx
// Al devolver o cancelar: ¿ya se preparó? Si no, los insumos regresan; si sí, es merma.
import React, { useEffect, useMemo, useState } from 'react';
import { ChefHat, Info, PackageOpen, X } from 'lucide-react';
import type { TicketItem } from '../types/menu';
import type { Supply } from '../types/inventory';
import type { ReturnMode } from '../services/orderService';
import { inventoryService } from '../services/inventoryService';
import { formatQty, sumSupplyUsage } from '../utils/inventory';

export interface PendingReturn {
    title: string;
    items: TicketItem[];          // lo que se devuelve (con la cantidad que se devuelve)
    run: (mode: ReturnMode) => Promise<void>;
}

interface Props {
    pending: PendingReturn | null;
    onClose: () => void;
}

export const ReturnInventoryModal: React.FC<Props> = ({ pending, onClose }) => {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [running, setRunning] = useState<ReturnMode | null>(null);

    useEffect(() => {
        if (pending) inventoryService.getSupplies().then(setSupplies).catch(() => setSupplies([]));
    }, [pending]);

    const usage = useMemo(() => {
        if (!pending) return [];
        return Object.entries(sumSupplyUsage(pending.items))
            .map(([supplyId, qty]) => ({ supplyId, qty, supply: supplies.find(s => s.id === supplyId) }))
            .sort((a, b) => (a.supply?.name || '').localeCompare(b.supply?.name || ''));
    }, [pending, supplies]);

    if (!pending) return null;

    const confirm = async (mode: ReturnMode) => {
        setRunning(mode);
        try {
            await pending.run(mode);
            onClose();
        } finally {
            setRunning(null);
        }
    };

    const hasUsage = usage.length > 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-base-100 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-base-200 bg-base-200/50 flex items-center justify-between gap-2">
                    <h2 className="text-lg font-black text-base-content">{pending.title}</h2>
                    <button onClick={onClose} disabled={!!running} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto">
                    {hasUsage ? (
                        <>
                            <p className="text-sm font-bold">¿Ya se había preparado?</p>
                            <div className="bg-base-200/50 rounded-xl p-3 text-sm space-y-1">
                                <p className="text-xs opacity-60 mb-1">Insumos de lo que se devuelve:</p>
                                {usage.map(u => (
                                    <div key={u.supplyId} className="flex justify-between gap-2">
                                        <span className="truncate">{u.supply?.name || u.supplyId}</span>
                                        <span className="font-mono shrink-0">{u.supply ? formatQty(u.qty, u.supply.unit) : u.qty}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="alert py-2 text-sm flex gap-2">
                            <Info size={16} className="shrink-0" />
                            <span>Este ticket no tiene consumo de insumos registrado (se vendió antes del inventario por insumo o sus productos no tienen receta). No se moverá el inventario.</span>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-base-200 bg-base-200/50 space-y-2">
                    {hasUsage ? (
                        <>
                            <button onClick={() => confirm('restore')} disabled={!!running} className="btn btn-primary w-full gap-2 h-auto py-2">
                                {running === 'restore' ? <span className="loading loading-spinner loading-xs"></span> : <PackageOpen size={18} className="shrink-0" />}
                                <span className="flex flex-col items-start leading-tight text-left">
                                    <span>No se preparó</span>
                                    <span className="text-[11px] font-normal opacity-80">Los insumos regresan al inventario</span>
                                </span>
                            </button>
                            <button onClick={() => confirm('waste')} disabled={!!running} className="btn btn-warning btn-outline w-full gap-2 h-auto py-2">
                                {running === 'waste' ? <span className="loading loading-spinner loading-xs"></span> : <ChefHat size={18} className="shrink-0" />}
                                <span className="flex flex-col items-start leading-tight text-left">
                                    <span>Ya se preparó</span>
                                    <span className="text-[11px] font-normal opacity-80">Se registra como merma, no regresa al inventario</span>
                                </span>
                            </button>
                        </>
                    ) : (
                        <button onClick={() => confirm('restore')} disabled={!!running} className="btn btn-error w-full">
                            {running ? <span className="loading loading-spinner loading-xs"></span> : 'Confirmar'}
                        </button>
                    )}
                    <button onClick={onClose} disabled={!!running} className="btn btn-ghost w-full btn-sm">Cancelar</button>
                </div>
            </div>
        </div>
    );
};
