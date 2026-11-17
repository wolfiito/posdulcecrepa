// src/components/admin/PriceRulesManager.tsx
// Reglas de precio para las categorías que se arman por ingredientes (crepas, waffles...).
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { PriceRule, MenuGroup } from '../../types/menu';
import { getRuleBasePrice, getBranchAdjustedRule } from '../../utils/pricing';
import { ChevronDown, ChevronRight, Trash, X } from 'lucide-react';

interface Branch { id: string; name: string; }

type Tier = PriceRule['basePrices'][number];

const PREVIEW_COUNTS = [1, 2, 3, 4, 5, 6];

// Copia profunda para no modificar la regla original mientras se edita
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const isTieredRule = (rule: PriceRule) => (rule.basePrices || []).length > 0;

const describeRule = (rule: PriceRule) =>
    isTieredRule(rule)
        ? `${rule.basePrices.length} escalones`
        : `$${rule.initialPrice ?? 0} + $${rule.incrementPerIngredient ?? 0} por ingrediente`;

// Cambia un precio por sucursal; en blanco = usa el precio general
const withBranchValue = (map: Record<string, number> | undefined, branchId: string, value: string) => {
    const next = { ...(map || {}) };
    if (value === '') delete next[branchId];
    else next[branchId] = Number(value);
    return next;
};

export const PriceRulesManager: React.FC = () => {
    const [rules, setRules] = useState<PriceRule[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [groups, setGroups] = useState<MenuGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
    const [showBranches, setShowBranches] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesSnap, branchesSnap, groupsSnap] = await Promise.all([
                getDocs(collection(db, 'price_rules')),
                getDocs(collection(db, 'branches')),
                getDocs(collection(db, 'menu_groups'))
            ]);
            setRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)));
            setBranches(branchesSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
            setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)));
        } catch (error) {
            toast.error("Error al cargar las reglas");
        } finally {
            setLoading(false);
        }
    };

    // Qué categorías usa cada regla
    const usageByRule = useMemo(() => {
        const map = new Map<string, string[]>();
        groups.forEach(g => {
            if (g.rules_ref) map.set(g.rules_ref, [...(map.get(g.rules_ref) || []), g.name]);
        });
        return map;
    }, [groups]);

    // --- EDICIÓN ---
    const openNewRule = () => {
        setEditingRule({ id: '', name: '', initialPrice: 60, incrementPerIngredient: 10, basePrices: [] });
        setShowBranches(false);
    };

    const openEditRule = (rule: PriceRule) => {
        setEditingRule(clone({ ...rule, basePrices: rule.basePrices || [] }));
        setShowBranches(false);
    };

    const updateRule = (changes: Partial<PriceRule>) => {
        if (!editingRule) return;
        setEditingRule({ ...editingRule, ...changes });
    };

    const setMode = (mode: 'LINEAR' | 'TIERS') => {
        if (!editingRule) return;
        if (mode === 'TIERS' && !isTieredRule(editingRule)) {
            // Arrancamos los escalones con los precios que daría la fórmula actual
            const basePrices: Tier[] = [1, 2, 3].map(count => ({
                count,
                price: getRuleBasePrice({ ...editingRule, basePrices: [] }, count).price
            }));
            updateRule({ basePrices });
        }
        if (mode === 'LINEAR' && isTieredRule(editingRule)) {
            if (!window.confirm("Se borrarán los escalones de esta regla. ¿Continuar?")) return;
            const first = [...editingRule.basePrices].sort((a, b) => a.count - b.count)[0];
            updateRule({
                basePrices: [],
                initialPrice: editingRule.initialPrice ?? first?.price ?? 0,
                incrementPerIngredient: editingRule.incrementPerIngredient ?? 10
            });
        }
    };

    const updateTier = (index: number, changes: Partial<Tier>) => {
        if (!editingRule) return;
        updateRule({ basePrices: editingRule.basePrices.map((t, i) => (i === index ? { ...t, ...changes } : t)) });
    };

    const addTier = () => {
        if (!editingRule) return;
        const last = [...editingRule.basePrices].sort((a, b) => b.count - a.count)[0];
        updateRule({ basePrices: [...editingRule.basePrices, { count: (last?.count || 0) + 1, price: last?.price || 0 }] });
    };

    const removeTier = (index: number) => {
        if (!editingRule) return;
        updateRule({ basePrices: editingRule.basePrices.filter((_, i) => i !== index) });
    };

    // --- GUARDAR / ELIMINAR ---
    const handleSave = async () => {
        if (!editingRule) return;
        if (!editingRule.name.trim()) return toast.error("Nombre obligatorio");

        const tiers = [...editingRule.basePrices].sort((a, b) => a.count - b.count);
        if (isTieredRule(editingRule)) {
            if (tiers.some(t => !t.count || t.count < 1)) return toast.error("Cada escalón necesita un número de ingredientes");
            if (new Set(tiers.map(t => t.count)).size !== tiers.length) return toast.error("Hay dos escalones con el mismo número de ingredientes");
        } else if (editingRule.initialPrice === undefined || editingRule.incrementPerIngredient === undefined) {
            return toast.error("Captura el precio inicial y el incremento");
        }

        setIsSaving(true);
        try {
            const id = editingRule.id || `rule_${Date.now()}`;
            // clone() quita los campos undefined, que Firestore no acepta
            await setDoc(doc(db, 'price_rules', id), clone({ ...editingRule, id, name: editingRule.name.trim(), basePrices: tiers }));
            toast.success("Regla guardada correctamente");
            setEditingRule(null);
            fetchData();
        } catch (e) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (rule: PriceRule) => {
        const usedBy = usageByRule.get(rule.id) || [];
        if (usedBy.length > 0) {
            return toast.error(`No se puede eliminar: la usa ${usedBy.join(', ')}.`);
        }
        if (!window.confirm(`¿Eliminar la regla "${rule.name}"?`)) return;
        try {
            await deleteDoc(doc(db, 'price_rules', rule.id));
            toast.success("Regla eliminada");
            setEditingRule(null);
            fetchData();
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    // --- FORMULARIO ---
    const renderEditModal = () => {
        if (!editingRule) return null;
        const isTiers = isTieredRule(editingRule);
        const previewColumns = [{ id: '', name: 'General' }, ...branches];

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-base-200 bg-warning/10 flex justify-between items-center">
                        <h2 className="text-xl font-black text-warning">{editingRule.id ? 'Editar Regla' : 'Nueva Regla'}</h2>
                        <button onClick={() => setEditingRule(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 space-y-5">
                        <div className="form-control">
                            <label className="label-text font-bold mb-1">Nombre</label>
                            <input type="text" className="input input-bordered" placeholder="Ej. Regla Waffles"
                                value={editingRule.name} onChange={e => updateRule({ name: e.target.value })} />
                        </div>

                        {/* TIPO DE REGLA */}
                        <section className="space-y-2">
                            <h3 className="font-bold">¿Cómo sube el precio?</h3>
                            <div className="join w-full">
                                <button onClick={() => setMode('LINEAR')}
                                    className={`btn btn-sm join-item flex-1 ${!isTiers ? 'btn-warning' : 'btn-outline border-base-300'}`}>
                                    Igual por ingrediente
                                </button>
                                <button onClick={() => setMode('TIERS')}
                                    className={`btn btn-sm join-item flex-1 ${isTiers ? 'btn-warning' : 'btn-outline border-base-300'}`}>
                                    Tabla de precios
                                </button>
                            </div>

                            {!isTiers ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="form-control">
                                        <span className="label-text text-xs mb-1">Precio con 1 ingrediente</span>
                                        <label className="input input-sm input-bordered flex items-center gap-1">
                                            <span className="opacity-50">$</span>
                                            <input type="number" inputMode="decimal" className="w-full font-bold"
                                                value={editingRule.initialPrice ?? ''}
                                                onChange={e => updateRule({ initialPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
                                        </label>
                                    </label>
                                    <label className="form-control">
                                        <span className="label-text text-xs mb-1">+ por cada ingrediente extra</span>
                                        <label className="input input-sm input-bordered flex items-center gap-1">
                                            <span className="opacity-50">$</span>
                                            <input type="number" inputMode="decimal" className="w-full font-bold"
                                                value={editingRule.incrementPerIngredient ?? ''}
                                                onChange={e => updateRule({ incrementPerIngredient: e.target.value === '' ? undefined : Number(e.target.value) })} />
                                        </label>
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {editingRule.basePrices.map((tier, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <label className="input input-sm input-bordered flex items-center gap-1 w-28">
                                                <input type="number" inputMode="numeric" className="w-full font-bold"
                                                    value={tier.count || ''} onChange={e => updateTier(index, { count: Number(e.target.value) })} />
                                                <span className="text-xs opacity-50">ing.</span>
                                            </label>
                                            <span className="opacity-50">→</span>
                                            <label className="input input-sm input-bordered flex items-center gap-1 flex-1">
                                                <span className="opacity-50">$</span>
                                                <input type="number" inputMode="decimal" className="w-full font-bold"
                                                    value={tier.price || ''} onChange={e => updateTier(index, { price: Number(e.target.value) })} />
                                            </label>
                                            <button onClick={() => removeTier(index)} disabled={editingRule.basePrices.length === 1}
                                                className="btn btn-square btn-ghost btn-sm text-error"><Trash size={16} className="shrink-0" /></button>
                                        </div>
                                    ))}
                                    <button onClick={addTier} className="btn btn-sm btn-ghost w-full border border-dashed border-base-300">+ Agregar escalón</button>
                                    <label className="form-control">
                                        <span className="label-text text-xs mb-1">Después del último escalón, + por cada ingrediente (opcional)</span>
                                        <label className="input input-sm input-bordered flex items-center gap-1 w-40">
                                            <span className="opacity-50">$</span>
                                            <input type="number" inputMode="decimal" className="w-full" placeholder="automático"
                                                value={editingRule.incrementPerIngredient ?? ''}
                                                onChange={e => updateRule({ incrementPerIngredient: e.target.value === '' ? undefined : Number(e.target.value) })} />
                                        </label>
                                    </label>
                                </div>
                            )}
                        </section>

                        {/* PRECIOS POR SUCURSAL */}
                        {branches.length > 0 && (
                            <section className="space-y-2">
                                <button onClick={() => setShowBranches(!showBranches)} className="text-sm link link-hover font-bold inline-flex items-center gap-1">
                                    {showBranches ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />} Precios distintos por sucursal
                                </button>
                                {showBranches && branches.map(b => (
                                    <div key={b.id} className="bg-base-200/50 rounded-xl p-3 space-y-2 border border-base-300">
                                        <p className="font-bold text-sm">{b.name}</p>
                                        {!isTiers ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <label className="input input-xs input-bordered flex items-center gap-1">
                                                    <span className="opacity-50">1 ing. $</span>
                                                    <input type="number" inputMode="decimal" className="w-full"
                                                        placeholder={String(editingRule.initialPrice ?? '')}
                                                        value={editingRule.branchInitialPrices?.[b.id] ?? ''}
                                                        onChange={e => updateRule({ branchInitialPrices: withBranchValue(editingRule.branchInitialPrices, b.id, e.target.value) })} />
                                                </label>
                                                <label className="input input-xs input-bordered flex items-center gap-1">
                                                    <span className="opacity-50">+ $</span>
                                                    <input type="number" inputMode="decimal" className="w-full"
                                                        placeholder={String(editingRule.incrementPerIngredient ?? '')}
                                                        value={editingRule.branchIncrements?.[b.id] ?? ''}
                                                        onChange={e => updateRule({ branchIncrements: withBranchValue(editingRule.branchIncrements, b.id, e.target.value) })} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {editingRule.basePrices.map((tier, index) => (
                                                    <label key={index} className="input input-xs input-bordered flex items-center gap-1">
                                                        <span className="opacity-50 whitespace-nowrap">{tier.count} ing. $</span>
                                                        <input type="number" inputMode="decimal" className="w-full"
                                                            placeholder={String(tier.price || '')}
                                                            value={tier.branchPrices?.[b.id] ?? ''}
                                                            onChange={e => updateTier(index, { branchPrices: withBranchValue(tier.branchPrices, b.id, e.target.value) })} />
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {showBranches && <p className="text-[10px] opacity-60">En blanco = usa el precio general.</p>}
                            </section>
                        )}

                        {/* VISTA PREVIA (mismo cálculo que el POS) */}
                        <section className="space-y-2">
                            <h3 className="font-bold">Así se cobra</h3>
                            <div className="overflow-x-auto rounded-xl border border-base-300">
                                <table className="table table-xs">
                                    <thead className="bg-base-200">
                                        <tr>
                                            <th>Ingredientes</th>
                                            {previewColumns.map(c => <th key={c.id || 'general'} className="text-right">{c.name}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PREVIEW_COUNTS.map(count => (
                                            <tr key={count}>
                                                <td className="font-bold">{count}</td>
                                                {previewColumns.map(c => {
                                                    const result = getRuleBasePrice(getBranchAdjustedRule(editingRule, c.id || null), count);
                                                    return (
                                                        <td key={c.id || 'general'} className="text-right font-mono">
                                                            {result.error ? <span className="text-error text-[10px]">{result.error}</span> : `$${result.price}`}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] opacity-60">Los extras con costo se suman aparte.</p>
                        </section>
                    </div>

                    <div className="p-3 border-t border-base-200 bg-base-200/50 flex gap-2">
                        {editingRule.id && (
                            <button onClick={() => handleDelete(editingRule)} className="btn btn-ghost text-error"><Trash size={16} className="shrink-0" /></button>
                        )}
                        <button onClick={() => setEditingRule(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-warning flex-[2]">
                            {isSaving ? 'Guardando...' : 'Guardar Regla'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-warning"></span></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-base-200/50 p-4 rounded-xl border border-base-300">
                <div>
                    <h3 className="text-xl font-bold text-warning">Reglas de Precio</h3>
                    <p className="text-xs opacity-70">Cuánto cuesta algo que se arma según cuántos ingredientes lleva.</p>
                </div>
                <button onClick={openNewRule} className="btn btn-warning btn-sm w-full sm:w-auto">+ Nueva Regla</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rules.map(rule => {
                    const usedBy = usageByRule.get(rule.id) || [];
                    return (
                        <button key={rule.id} onClick={() => openEditRule(rule)}
                            className="card bg-base-100 border border-base-300 shadow-sm hover:border-warning/50 text-left">
                            <div className="card-body p-4 gap-1">
                                <h4 className="font-black">{rule.name}</h4>
                                <p className="text-sm">{describeRule(rule)}</p>
                                <p className="text-xs opacity-60">
                                    {usedBy.length > 0 ? `Usada en: ${usedBy.join(', ')}` : 'Sin usar'}
                                </p>
                            </div>
                        </button>
                    );
                })}
                {rules.length === 0 && <p className="col-span-full text-center opacity-60 py-10">Aún no hay reglas.</p>}
            </div>

            {renderEditModal()}
        </div>
    );
};
