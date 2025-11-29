// src/components/admin/ModifiersManager.tsx
import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../../firebase';
import type { Modifier } from '../../types/menu';

export const ModifiersManager: React.FC = () => {
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<{id: string, name: string}[]>([]);
  
  // Formulario
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    price: 0, 
    group: 'crepa_dulce_base',
    trackStock: false, // <--- NUEVO: ¿Controlamos inventario?
    currentStock: 0    // <--- NUEVO: ¿Cuántos hay?
  });

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'modifiers'));
    setModifiers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Modifier)));

    const groupsSnap = await getDocs(collection(db, 'modifier_groups'));
    setAvailableGroups(groupsSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Editar
        await updateDoc(doc(db, 'modifiers', editingId), formData);
        alert("Ingrediente actualizado (Stock ajustado)");
      } else {
        // Crear
        await addDoc(collection(db, 'modifiers'), formData);
        alert("Ingrediente creado");
      }
      // Resetear
      setFormData({ name: '', price: 0, group: 'crepa_dulce_base', trackStock: false, currentStock: 0 });
      setEditingId(null);
      loadData(); 
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  const handleEdit = (mod: Modifier) => {
    setEditingId(mod.id);
    setFormData({ 
        name: mod.name, 
        price: mod.price, 
        group: mod.group,
        trackStock: mod.trackStock || false, // Si no existe, asume false
        currentStock: mod.currentStock || 0 
    });
  };

  const handleDelete = async (id: string) => {
    if(!confirm("¿Seguro? Esto afectará a los productos que usen este ingrediente.")) return;
    await deleteDoc(doc(db, 'modifiers', id));
    loadData();
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* --- FORMULARIO --- */}
      <div className="card bg-base-200 h-fit shadow-sm">
        <div className="card-body p-4">
          <h3 className="font-bold mb-2 text-lg">{editingId ? '✏️ Editar / Ajustar Stock' : '✨ Nuevo Ingrediente'}</h3>
          <form onSubmit={handleSave} className="space-y-3">
            
            {/* Nombre y Precio */}
            <div>
              <label className="label-text text-xs font-bold">Nombre</label>
              <input className="input input-sm input-bordered w-full font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Kinder Delice" required />
            </div>
            <div>
              <label className="label-text text-xs font-bold">Precio Extra ($)</label>
              <input type="number" className="input input-sm input-bordered w-full" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <label className="label-text text-xs font-bold">Grupo</label>
              <select className="select select-sm select-bordered w-full" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})}>
              <option value="">-- Selecciona un Grupo --</option>
                {availableGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                ))}
              </select>
              {availableGroups.length === 0 && <span className="text-[10px] text-error">¡Crea grupos en la pestaña "Grupos de Opciones" primero!</span>} 
            </div>

            <div className="divider my-1 text-xs opacity-50">INVENTARIO</div>

            {/* CONTROL DE STOCK */}
            <div className="form-control bg-base-100 p-2 rounded-box border border-base-300">
                <label className="label cursor-pointer py-0 mb-2">
                    <span className="label-text text-xs font-bold">¿Controlar Stock?</span>
                    <input type="checkbox" className="toggle toggle-xs toggle-success" checked={formData.trackStock} onChange={e => setFormData({...formData, trackStock: e.target.checked})} />
                </label>
                
                {formData.trackStock && (
                    <div className="animate-fade-in">
                        <label className="label-text text-xs font-bold text-success">Existencia Actual (Piezas)</label>
                        <input 
                            type="number" 
                            className="input input-sm input-bordered input-success w-full font-black text-lg text-center" 
                            value={formData.currentStock} 
                            onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})} 
                            placeholder="0"
                        />
                        <p className="text-[10px] opacity-60 mt-1 text-center">
                            Ingresa el total real que tienes físicamente.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-4 pt-2">
               {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({name:'', price:0, group:'crepa_dulce_base', trackStock:false, currentStock:0})}} className="btn btn-sm btn-ghost">Cancelar</button>}
               <button type="submit" className="btn btn-sm btn-primary flex-1 shadow-md">
                   {editingId ? 'Guardar Cambios' : 'Crear'}
               </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- TABLA --- */}
      <div className="md:col-span-2 overflow-x-auto h-[600px] bg-base-100 rounded-box border border-base-200 shadow-sm">
        <table className="table table-xs table-pin-rows">
          <thead className="bg-base-200">
            <tr>
              <th>Nombre</th>
              <th>Grupo</th>
              <th className="text-center">Stock</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modifiers.map(mod => (
              <tr key={mod.id} className="hover">
                <td>
                    <div className="font-bold">{mod.name}</div>
                    <div className="text-[10px] opacity-50">{mod.price > 0 ? `+$${mod.price}` : 'Gratis'}</div>
                </td>
                <td><span className="badge badge-ghost badge-xs">{mod.group}</span></td>
                
                {/* Columna de Stock Visual */}
                <td className="text-center">
                    {mod.trackStock ? (
                        <div className={`badge badge-md font-bold ${mod.currentStock! > 10 ? 'badge-success text-white' : mod.currentStock! > 0 ? 'badge-warning' : 'badge-error text-white'}`}>
                            {mod.currentStock} pzas
                        </div>
                    ) : (
                        <span className="text-[10px] opacity-30">--</span>
                    )}
                </td>

                <td className="text-right">
                  <button onClick={() => handleEdit(mod)} className="btn btn-square btn-ghost btn-xs text-primary">✏️</button>
                  <button onClick={() => handleDelete(mod.id)} className="btn btn-square btn-ghost btn-xs text-error opacity-50 hover:opacity-100">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};