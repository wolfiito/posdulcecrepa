// src/components/admin/PriceRulesManager.tsx
import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, deleteDoc, setDoc } from '../../firebase';
import type { PriceRule } from '../../types/menu';

export const PriceRulesManager: React.FC = () => {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado del Formulario
  const [isEditing, setIsEditing] = useState(false);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  // Estado para la tabla de precios escalonados
  const [basePrices, setBasePrices] = useState<{count: number, price: number}[]>([{ count: 1, price: 0 }]);

  const loadData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'price_rules'));
      setRules(snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // --- MANEJO DE LA TABLA DE PRECIOS ---
  const addPriceRow = () => {
    setBasePrices([...basePrices, { count: basePrices.length + 1, price: 0 }]);
  };

  const updatePriceRow = (index: number, field: 'count' | 'price', value: number) => {
    const newPrices = [...basePrices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setBasePrices(newPrices);
  };

  const removePriceRow = (index: number) => {
    setBasePrices(basePrices.filter((_, i) => i !== index));
  };

  // --- GUARDAR ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || basePrices.length === 0) return alert("Completa todos los campos");

    // Limpiar ID
    const cleanId = isEditing ? id : id.toLowerCase().replace(/\s+/g, '_');

    try {
      // Ordenamos los precios por cantidad de ingredientes para evitar errores lógicos
      const sortedPrices = [...basePrices].sort((a, b) => a.count - b.count);

      await setDoc(doc(db, 'price_rules', cleanId), {
        name,
        basePrices: sortedPrices
      });

      alert("Regla guardada correctamente");
      resetForm();
      loadData();
    } catch (e) {
      console.error(e);
      alert("Error al guardar");
    }
  };

  const handleEdit = (rule: PriceRule) => {
    setId(rule.id);
    setName(rule.name);
    setBasePrices(rule.basePrices || []);
    setIsEditing(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("¿Eliminar esta regla? Las categorías que la usen dejarán de calcular precios correctamente.")) return;
    try {
      await deleteDoc(doc(db, 'price_rules', ruleId));
      loadData();
    } catch (e) { alert("Error al eliminar"); }
  };

  const resetForm = () => {
    setId('');
    setName('');
    setBasePrices([{ count: 1, price: 0 }]);
    setIsEditing(false);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
      
      {/* FORMULARIO */}
      <div className="card bg-base-200 h-full overflow-y-auto border border-base-300 shadow-inner">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-lg">{isEditing ? '✏️ Editar Regla' : '✨ Nueva Regla'}</h3>
            {isEditing && <button onClick={resetForm} className="btn btn-xs btn-ghost">Cancelar</button>}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* ID y Nombre */}
            <div className="form-control">
              <label className="label-text text-xs font-bold">ID Interno</label>
              <input 
                className="input input-sm input-bordered font-mono text-xs" 
                value={id} onChange={e => setId(e.target.value)} 
                disabled={isEditing} 
                placeholder="ej. regla_licuados" required 
              />
              {!isEditing && <span className="text-[10px] opacity-50 mt-1">Sin espacios (ej. regla_crepas_dulces)</span>}
            </div>

            <div className="form-control">
              <label className="label-text text-xs font-bold">Nombre Visible</label>
              <input 
                className="input input-sm input-bordered" 
                value={name} onChange={e => setName(e.target.value)} 
                placeholder="ej. Precios de Licuados" required 
              />
            </div>

            <div className="divider my-1 text-xs font-bold opacity-50">ESCALA DE PRECIOS</div>

            {/* Tabla de Precios Dinámica */}
            <div className="bg-base-100 rounded-box p-2 border border-base-300 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center opacity-60 uppercase mb-1">
                <span>Ingredientes</span>
                <span>Precio ($)</span>
                <span></span>
              </div>
              
              {basePrices.map((bp, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    className="input input-xs input-bordered w-full text-center"
                    value={bp.count}
                    onChange={e => updatePriceRow(index, 'count', parseInt(e.target.value) || 0)}
                  />
                  <input 
                    type="number" 
                    className="input input-xs input-bordered w-full text-center font-bold text-success"
                    value={bp.price}
                    onChange={e => updatePriceRow(index, 'price', parseFloat(e.target.value) || 0)}
                  />
                  <button type="button" onClick={() => removePriceRow(index)} className="btn btn-xs btn-square btn-ghost text-error">✕</button>
                </div>
              ))}
              
              <button type="button" onClick={addPriceRow} className="btn btn-xs btn-outline btn-block border-dashed mt-2">
                + Agregar Nivel
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-4 shadow-md">
              {isEditing ? 'Actualizar Regla' : 'Guardar Regla'}
            </button>
          </form>
        </div>
      </div>

      {/* LISTA */}
      <div className="lg:col-span-2 bg-base-100 rounded-box border border-base-200 overflow-hidden shadow-sm h-full overflow-y-auto">
        <table className="table table-sm table-pin-rows">
          <thead className="bg-base-200">
            <tr>
              <th>ID / Nombre</th>
              <th>Escala de Precios</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={3} className="text-center p-10"><span className="loading loading-spinner"></span></td></tr> :
             rules.length === 0 ? <tr><td colSpan={3} className="text-center p-10 opacity-50">No hay reglas definidas.</td></tr> :
             rules.map(r => (
              <tr key={r.id} className="hover">
                <td>
                  <div className="font-bold text-sm">{r.name}</div>
                  <div className="font-mono text-[10px] opacity-40">{r.id}</div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {r.basePrices?.sort((a,b) => a.count - b.count).map((bp, idx) => (
                      <span key={idx} className="badge badge-sm badge-ghost font-mono text-[10px]">
                        {bp.count} x ${bp.price}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-right">
                  <div className="join">
                    <button onClick={() => handleEdit(r)} className="btn btn-xs join-item btn-ghost">✏️</button>
                    <button onClick={() => handleDelete(r.id)} className="btn btn-xs join-item btn-ghost text-error">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};