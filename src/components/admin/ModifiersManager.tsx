// src/components/admin/ModifiersManager.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { Modifier, ModifierGroup } from '../../types/menu';

interface Branch { id: string; name: string; }

export const ModifiersManager: React.FC = () => {
    const [modifiers, setModifiers] = useState<Modifier[]>([]);
    const [groups, setGroups] = useState<ModifierGroup[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para el modal
    const [editingMod, setEditingMod] = useState<Modifier | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modsSnap, groupsSnap, branchesSnap] = await Promise.all([
                getDocs(collection(db, 'modifiers')),
                getDocs(collection(db, 'modifier_groups')),
                getDocs(collection(db, 'branches'))
            ]);

            setModifiers(modsSnap.docs.map(d => d.data() as Modifier));
            setGroups(groupsSnap.docs.map(d => d.data() as ModifierGroup));
            setBranches(branchesSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
        } catch (error) {
            toast.error("Error al cargar ingredientes");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingMod || !editingMod.name || !editingMod.group) {
            return toast.error("Nombre y Grupo son obligatorios");
        }
        setIsSaving(true);
        try {
            const idToSave = editingMod.id || `mod_${Date.now()}`;
            await setDoc(doc(db, 'modifiers', idToSave), { ...editingMod, id: idToSave });
            toast.success("Ingrediente guardado");
            setEditingMod(null);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Eliminar este ingrediente?")) return;
        try {
            await deleteDoc(doc(db, 'modifiers', id));
            toast.success("Eliminado");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const renderEditModal = () => {
        if (!editingMod) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-base-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-base-200 bg-base-200/50">
                        <h2 className="text-2xl font-black text-secondary">
                            {editingMod.id ? '✏️ Editar Ingrediente' : '🥦 Nuevo Ingrediente'}
                        </h2>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* DATOS BÁSICOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">Nombre</label>
                                <input type="text" className="input input-bordered" value={editingMod.name} onChange={e => setEditingMod({...editingMod, name: e.target.value})} placeholder="Ej. Mora Azul" />
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">Lista / Grupo</label>
                                <select className="select select-bordered" value={editingMod.group} onChange={e => setEditingMod({...editingMod, group: e.target.value})}>
                                    <option value="">Selecciona una lista...</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">Precio Extra ($)</label>
                                <input type="number" className="input input-bordered" value={editingMod.price} onChange={e => setEditingMod({...editingMod, price: Number(e.target.value)})} />
                            </div>
                            <div className="form-control flex flex-row items-center gap-4 mt-8">
                                <input type="checkbox" className="toggle toggle-primary" checked={editingMod.trackStock} onChange={e => setEditingMod({...editingMod, trackStock: e.target.checked})} />
                                <span className="label-text font-bold">¿Controlar Inventario?</span>
                            </div>
                        </div>

                        {/* DISPONIBILIDAD POR SUCURSAL */}
                        <div className="bg-base-200/50 p-4 rounded-xl space-y-3">
                            <h3 className="font-bold text-sm uppercase opacity-60">Disponibilidad por Sucursal</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {branches.map(b => {
                                    const isDisabled = editingMod.disabledIn?.includes(b.id);
                                    return (
                                        <div key={b.id} className="flex items-center justify-between bg-base-100 p-3 rounded-lg border border-base-300">
                                            <span className="font-medium">{b.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs ${isDisabled ? 'text-error' : 'text-success font-bold'}`}>
                                                    {isDisabled ? 'Agotado/Desactivado' : 'Disponible'}
                                                </span>
                                                <input 
                                                    type="checkbox" 
                                                    className="toggle toggle-sm" 
                                                    checked={!isDisabled} 
                                                    onChange={() => {
                                                        const curr = editingMod.disabledIn || [];
                                                        setEditingMod({
                                                            ...editingMod,
                                                            disabledIn: isDisabled ? curr.filter(id => id !== b.id) : [...curr, b.id]
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-base-200 bg-base-200/50 flex justify-end gap-3">
                        <button onClick={() => setEditingMod(null)} className="btn btn-ghost">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-secondary px-8">
                            {isSaving ? 'Guardando...' : 'Guardar Ingrediente'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-secondary"></span></div>;

    return (
      <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-200/50 p-4 rounded-xl border border-base-300">
              <h3 className="text-xl font-bold">Ingredientes</h3>
              <button 
                  onClick={() => setEditingMod({ id: '', name: '', price: 0, group: '', trackStock: false, disabledIn: [] })}
                  className="btn btn-secondary btn-sm w-full sm:w-auto"
              >
                  + Nuevo Ingrediente
              </button>
          </div>

          {groups.map(group => (
              <div key={group.id} className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-secondary/70 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {group.name}
                  </h4>
                  
                  {/* Grid responsivo: 1 col en movil, 2 en tablet, 4 en PC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {modifiers.filter(m => m.group === group.id).map(mod => (
                          <div key={mod.id} className="group bg-base-100 border border-base-300 rounded-2xl p-3 flex justify-between items-center hover:border-secondary/50 transition-all">
                              <div className="flex flex-col">
                                  <span className="font-bold text-sm">{mod.name}</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] opacity-60">{mod.price > 0 ? `+$${mod.price}` : 'Gratis'}</span>
                                      {mod.trackStock && <span className="badge badge-xs badge-info text-[9px]">📦 Stock</span>}
                                  </div>
                              </div>
                              <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingMod(mod)} className="btn btn-square btn-ghost btn-sm">✏️</button>
                                  <button onClick={() => handleDelete(mod.id)} className="btn btn-square btn-ghost btn-sm text-error">🗑️</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
          {renderEditModal()}
      </div>
  );
};