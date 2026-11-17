// src/components/admin/RecipeEditor.tsx
// Receta: qué insumos gasta una porción (en g, ml o piezas).
import React from 'react';
import { Plus, X } from 'lucide-react';
import type { RecipeLine, Supply } from '../../types/inventory';
import { BASE_UNIT } from '../../utils/inventory';

interface Props {
    recipe: RecipeLine[] | undefined;
    supplies: Supply[];
    onChange: (recipe: RecipeLine[]) => void;
}

export const RecipeEditor: React.FC<Props> = ({ recipe, supplies, onChange }) => {
    const lines = recipe || [];

    const updateLine = (index: number, changes: Partial<RecipeLine>) =>
        onChange(lines.map((l, i) => (i === index ? { ...l, ...changes } : l)));

    const usedIds = new Set(lines.map(l => l.supplyId));
    const nextSupply = supplies.find(s => !usedIds.has(s.id));

    if (supplies.length === 0) {
        return <p className="text-xs opacity-60">Aún no hay insumos. Créalos en Inventario → Insumos.</p>;
    }

    return (
        <div className="space-y-2">
            {lines.map((line, index) => {
                const supply = supplies.find(s => s.id === line.supplyId);
                return (
                    <div key={index} className="flex items-center gap-2">
                        <select className="select select-sm select-bordered flex-1 min-w-0" value={line.supplyId}
                            onChange={e => updateLine(index, { supplyId: e.target.value })}>
                            {!supply && <option value={line.supplyId}>Insumo eliminado</option>}
                            {supplies.map(s => (
                                <option key={s.id} value={s.id} disabled={s.id !== line.supplyId && usedIds.has(s.id)}>{s.name}</option>
                            ))}
                        </select>
                        <label className="input input-sm input-bordered flex items-center gap-1 w-28">
                            <input type="number" inputMode="decimal" min={0} className="w-full" placeholder="0"
                                value={line.qty || ''}
                                onChange={e => updateLine(index, { qty: Math.max(0, Number(e.target.value)) })} />
                            <span className="opacity-50 text-xs">{supply ? BASE_UNIT[supply.unit] : ''}</span>
                        </label>
                        <button onClick={() => onChange(lines.filter((_, i) => i !== index))}
                            className="btn btn-square btn-ghost btn-xs text-error" title="Quitar insumo">
                            <X size={14} className="shrink-0" />
                        </button>
                    </div>
                );
            })}
            {nextSupply && (
                <button onClick={() => onChange([...lines, { supplyId: nextSupply.id, qty: 0 }])}
                    className="btn btn-xs btn-ghost border border-dashed border-base-300 w-full gap-1">
                    <Plus size={12} className="shrink-0" /> Insumo
                </button>
            )}
        </div>
    );
};

/** Quita renglones sin cantidad antes de guardar. */
export const cleanRecipe = (recipe: RecipeLine[] | undefined): RecipeLine[] =>
    (recipe || []).filter(l => l.supplyId && l.qty > 0);
