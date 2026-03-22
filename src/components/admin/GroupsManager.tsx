// src/components/admin/GroupsManager.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { MenuGroup, MenuItem } from '../../types/menu';

export const GroupsManager: React.FC = () => {
    const [groups, setGroups] = useState<MenuGroup[]>([]);
    const [allItems, setAllItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const [groupsSnap, itemsSnap] = await Promise.all([
            getDocs(collection(db, 'menu_groups')),
            getDocs(collection(db, 'menu_items'))
        ]);
        setGroups(groupsSnap.docs.map(d => d.data() as MenuGroup));
        setAllItems(itemsSnap.docs.map(d => d.data() as MenuItem));
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editingGroup?.name) return toast.error("Nombre obligatorio");
        try {
            const id = editingGroup.id || `group_${Date.now()}`;
            await setDoc(doc(db, 'menu_groups', id), { ...editingGroup, id });
            toast.success("Categoría guardada");
            setEditingGroup(null);
            fetchData();
        } catch (e) { toast.error("Error al guardar"); }
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-base-200/50 p-4 rounded-xl border border-base-300">
                <h3 className="text-xl font-bold">Gestor de Categorías (Carpetas)</h3>
                <button onClick={() => setEditingGroup({ id: '', name: '', level: 1, parent: 'root', items_ref: [] })} className="btn btn-primary btn-sm">+ Nueva Categoría</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(g => (
                    <div key={g.id} className="card bg-base-100 border border-base-300 shadow-sm">
                        <div className="card-body p-4">
                            <h4 className="font-bold">{g.name}</h4>
                            <p className="text-xs opacity-50">Padre: {g.parent} | Productos: {g.items_ref?.length || 0}</p>
                            <div className="card-actions justify-end mt-2">
                                <button onClick={() => setEditingGroup(g)} className="btn btn-xs btn-ghost text-primary">Editar</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editingGroup && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-base-100 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4">
                        <h2 className="text-xl font-black">Configurar Carpeta</h2>
                        <div className="form-control">
                            <label className="label-text font-bold">Nombre de la carpeta</label>
                            <input type="text" className="input input-bordered" value={editingGroup.name} onChange={e => setEditingGroup({...editingGroup, name: e.target.value})} />
                        </div>
                        
                        {/* Selector de Productos (Checklist) */}
                        <div className="form-control">
                            <label className="label-text font-bold mb-2">Productos dentro de esta carpeta:</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-base-200 rounded-lg">
                                {allItems.map(item => (
                                    <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-base-300 p-1 rounded">
                                        <input type="checkbox" className="checkbox checkbox-xs" 
                                            checked={editingGroup.items_ref?.includes(item.id)}
                                            onChange={() => {
                                                const current = editingGroup.items_ref || [];
                                                const updated = current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id];
                                                setEditingGroup({...editingGroup, items_ref: updated});
                                            }}
                                        />
                                        {item.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditingGroup(null)} className="btn btn-ghost">Cancelar</button>
                            <button onClick={handleSave} className="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};