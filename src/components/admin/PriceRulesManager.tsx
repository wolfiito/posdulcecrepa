// src/components/admin/PriceRulesManager.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { PriceRule } from '../../types/menu';

interface Branch { id: string; name: string; }

export const PriceRulesManager: React.FC = () => {
    const [rules, setRules] = useState<PriceRule[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState<PriceRule | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const [rulesSnap, branchesSnap] = await Promise.all([
            getDocs(collection(db, 'price_rules')),
            getDocs(collection(db, 'branches'))
        ]);
        setRules(rulesSnap.docs.map(d => d.data() as PriceRule));
        setBranches(branchesSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editingRule?.name) return toast.error("Nombre obligatorio");
        try {
            await setDoc(doc(db, 'price_rules', editingRule.id), editingRule);
            toast.success("Regla guardada correctamente");
            setEditingRule(null);
            fetchData();
        } catch (e) { toast.error("Error al guardar"); }
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-warning"></span></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-base-200/50 p-4 rounded-xl border border-base-300">
                <div>
                    <h3 className="text-xl font-bold text-warning">Configuración de Precios (Reglas)</h3>
                    <p className="text-sm opacity-70">Define cuánto cuesta el armado de productos (1 ing, 2 ing, etc.)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map(rule => (
                    <div key={rule.id} className="card bg-base-100 border border-base-300 shadow-sm hover:border-warning/50 transition-colors">
                        <div className="card-body p-5">
                            <div className="flex justify-between items-center">
                                <h4 className="font-black text-lg">{rule.name}</h4>
                                <button onClick={() => setEditingRule(JSON.parse(JSON.stringify(rule)))} className="btn btn-sm btn-warning">✏️ Editar Precios</button>
                            </div>
                            <div className="mt-2 space-y-1">
                                {rule.basePrices.slice(0, 3).map(bp => (
                                    <div key={bp.count} className="text-sm flex justify-between border-b border-base-200 pb-1">
                                        <span>{bp.count} ingrediente(s):</span>
                                        <span className="font-bold">${bp.price}</span>
                                    </div>
                                ))}
                                {rule.basePrices.length > 3 && <p className="text-xs opacity-50 text-center">... y {rule.basePrices.length - 3} niveles más</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editingRule && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-base-100 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-base-200 bg-warning/10">
                            <h2 className="text-2xl font-black text-warning">Editar Regla: {editingRule.name}</h2>
                            <p className="text-xs opacity-70">Modifica los precios base y las excepciones por sucursal.</p>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr className="bg-base-200">
                                        <th>Cantidad</th>
                                        <th>Precio Base (General)</th>
                                        {branches.map(b => (
                                            <th key={b.id} className="text-center text-primary">{b.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {editingRule.basePrices.map((bp, idx) => (
                                        <tr key={bp.count} className="hover:bg-base-200/30">
                                            <td className="font-black text-lg">{bp.count} Ing.</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="opacity-50">$</span>
                                                    <input type="number" className="input input-bordered input-sm w-24 font-bold" 
                                                        value={bp.price} 
                                                        onChange={e => {
                                                            const newBase = [...editingRule.basePrices];
                                                            newBase[idx].price = Number(e.target.value);
                                                            setEditingRule({...editingRule, basePrices: newBase});
                                                        }} 
                                                    />
                                                </div>
                                            </td>
                                            {branches.map(b => (
                                                <td key={b.id} className="bg-base-200/20 border-l border-base-300">
                                                    <div className="flex flex-col items-center">
                                                        <input type="number" placeholder={bp.price.toString()} 
                                                            className="input input-bordered input-xs w-20 text-center"
                                                            value={bp.branchPrices?.[b.id] ?? ''} 
                                                            onChange={e => {
                                                                const newBase = [...editingRule.basePrices];
                                                                const newBranchPrices = { ...(newBase[idx].branchPrices || {}) };
                                                                if (e.target.value === '') delete newBranchPrices[b.id];
                                                                else newBranchPrices[b.id] = Number(e.target.value);
                                                                newBase[idx].branchPrices = newBranchPrices;
                                                                setEditingRule({...editingRule, basePrices: newBase});
                                                            }} 
                                                        />
                                                        <span className="text-[10px] mt-1 opacity-40">Precio Especial</span>
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-base-200 flex justify-end gap-3 bg-base-200/50">
                            <button onClick={() => setEditingRule(null)} className="btn btn-ghost">Cancelar</button>
                            <button onClick={handleSave} className="btn btn-warning px-10">💾 Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};