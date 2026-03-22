// src/components/admin/ModifierGroupsManager.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { ModifierGroup } from '../../types/menu';

export const ModifierGroupsManager: React.FC = () => {
    const [groups, setGroups] = useState<ModifierGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'modifier_groups'));
            setGroups(snap.docs.map(d => d.data() as ModifierGroup));
        } catch (error) {
            toast.error("Error al cargar las listas");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingGroup?.name) return toast.error("El nombre es obligatorio");
        try {
            const id = editingGroup.id || `mg_${Date.now()}`;
            await setDoc(doc(db, 'modifier_groups', id), { ...editingGroup, id });
            toast.success("Lista guardada correctamente");
            setEditingGroup(null);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta lista?")) return;
        try {
            await deleteDoc(doc(db, 'modifier_groups', id));
            toast.success("Lista eliminada");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-info"></span></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-200/50 p-4 rounded-xl border border-base-300">
                <div>
                    <h3 className="text-xl font-bold text-info">Listas de Opciones</h3>
                    <p className="text-xs opacity-70">Agrupa tus ingredientes (Ej. "Tipos de Leche", "Sabores").</p>
                </div>
                <button 
                    onClick={() => setEditingGroup({ id: '', name: '' })} 
                    className="btn btn-info btn-sm w-full sm:w-auto text-white"
                >
                    + Nueva Lista
                </button>
            </div>

            {/* VISTA RESPONSIVE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groups.map(g => (
                    <div key={g.id} className="card bg-base-100 border border-base-300 shadow-sm hover:border-info/40 transition-all">
                        <div className="card-body p-4 flex-row justify-between items-center">
                            <h4 className="font-bold text-sm">{g.name}</h4>
                            <div className="flex gap-1">
                                <button onClick={() => setEditingGroup(g)} className="btn btn-square btn-ghost btn-sm text-info">✏️</button>
                                <button onClick={() => handleDelete(g.id)} className="btn btn-square btn-ghost btn-sm text-error">🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editingGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-base-100 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in-up">
                        <div className="p-5 border-b border-base-200 bg-info/10 flex justify-between items-center">
                            <h2 className="text-lg font-black text-info">
                                {editingGroup.id ? 'Editar Lista' : 'Nueva Lista'}
                            </h2>
                            <button onClick={() => setEditingGroup(null)} className="btn btn-circle btn-ghost btn-sm">✕</button>
                        </div>
                        
                        <div className="p-6">
                            <div className="form-control">
                                <label className="label-text font-bold mb-2">Nombre de la lista</label>
                                <input type="text" className="input input-bordered w-full" 
                                    placeholder="Ej. Sabores de Esquimo"
                                    value={editingGroup.name} 
                                    onChange={e => setEditingGroup({...editingGroup, name: e.target.value})} 
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-base-200 flex gap-2 bg-base-50">
                            <button onClick={() => setEditingGroup(null)} className="btn btn-ghost flex-1">Cancelar</button>
                            <button onClick={handleSave} className="btn btn-info text-white flex-[2]">Guardar Lista</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};