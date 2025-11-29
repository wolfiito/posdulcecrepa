// src/components/admin/GroupsManager.tsx
import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../../firebase';
import type { MenuGroup, MenuItem, Modifier, PriceRule } from '../../types/menu';

export const GroupsManager: React.FC = () => {
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [rules, setRules] = useState<PriceRule[]>([]);
  
  // Lista de grupos de opciones disponibles (ej. "Sabores de Soda")
  const [availableOptionGroups, setAvailableOptionGroups] = useState<{id: string, name: string}[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('root');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Avanzado
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rulesRef, setRulesRef] = useState('');
  const [baseGroup, setBaseGroup] = useState('');
  // Ahora sí manejamos estos arrays
  const [extraGroups, setExtraGroups] = useState<string[]>([]); 
  const [toppingGroups, setToppingGroups] = useState<string[]>([]);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [gSnap, iSnap, rSnap, modGroupsSnap] = await Promise.all([
        getDocs(collection(db, 'menu_groups')),
        getDocs(collection(db, 'menu_items')),
        getDocs(collection(db, 'price_rules')),
        getDocs(collection(db, 'modifier_groups')) // Leemos los grupos creados
      ]);

      setGroups(gSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)));
      setItems(iSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)).sort((a,b) => a.name.localeCompare(b.name)));
      setRules(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)));
      setAvailableOptionGroups(modGroupsSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // ... (Reset y Edit handlers) ...
  const handleReset = () => {
    setEditingId(null); setName(''); setParent('root'); setSelectedItems([]);
    setRulesRef(''); setBaseGroup(''); setExtraGroups([]); setToppingGroups([]); setShowAdvanced(false);
  };

  const handleEdit = (g: MenuGroup) => {
    setEditingId(g.id); setName(g.name); setParent(g.parent || 'root'); setSelectedItems(g.items_ref || []);
    setRulesRef(g.rules_ref || ''); setBaseGroup(g.base_group || '');
    setExtraGroups(g.extra_groups || []); setToppingGroups(g.topping_groups || []);
    if(g.rules_ref) setShowAdvanced(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const parentGroup = groups.find(g => g.id === parent);
    const level = parent === 'root' ? 1 : (parentGroup?.level || 0) + 1;

    const groupData: any = { name, parent, level, items_ref: selectedItems };
    
    // Solo guardamos config avanzada si hay regla seleccionada
    if (rulesRef) {
        groupData.rules_ref = rulesRef;
        groupData.base_group = baseGroup;
        if(extraGroups.length) groupData.extra_groups = extraGroups;
        if(toppingGroups.length) groupData.topping_groups = toppingGroups;
    }

    try {
      if (editingId) await updateDoc(doc(db, 'menu_groups', editingId), groupData);
      else await addDoc(collection(db, 'menu_groups'), groupData);
      alert("Guardado"); handleReset(); loadAllData();
    } catch (e) { alert("Error"); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("¿Borrar?")) return;
      try { await deleteDoc(doc(db, 'menu_groups', id)); loadAllData(); } catch(e) { alert("Error"); }
  }

  // Helper para checkboxes de grupos opcionales
  const toggleArrayItem = (item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
      <div className="lg:col-span-1 card bg-base-200 h-full overflow-y-auto p-4">
          <h3 className="font-bold text-lg mb-2">{editingId ? 'Editar' : 'Nueva'} Categoría</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
                <label className="text-xs font-bold">Nombre</label>
                <input className="input input-sm input-bordered w-full" value={name} onChange={e=>setName(e.target.value)} required placeholder="ej. Crepas Dulces" />
            </div>
            <div>
                <label className="text-xs font-bold">Padre</label>
                <select className="select select-sm select-bordered w-full" value={parent} onChange={e=>setParent(e.target.value)}>
                    <option value="root">🌟 PRINCIPAL</option>
                    {groups.filter(g=>g.id!==editingId).map(g=><option key={g.id} value={g.id}>{'-'.repeat(g.level)} 📂 {g.name}</option>)}
                </select>
            </div>
            
            <div className="divider my-1 text-[10px]">CONTENIDO FIJO</div>
            <div className="form-control">
                <label className="text-xs font-bold mb-1">Productos (Items)</label>
                <div className="h-32 overflow-y-auto bg-base-100 border rounded p-2 grid gap-1">
                    {items.map(i => (
                        <label key={i.id} className="cursor-pointer label justify-start gap-2 p-0">
                            <input type="checkbox" className="checkbox checkbox-xs" checked={selectedItems.includes(i.id)} onChange={()=>toggleArrayItem(i.id, setSelectedItems)} />
                            <span className="text-xs">{i.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="divider my-1 text-[10px]">CONFIGURACIÓN ARMABLE</div>
            <div className="bg-base-100 p-3 rounded-box border border-base-300">
                <div className="form-control mb-2">
                    <label className="label cursor-pointer justify-start gap-2 p-0">
                        <input type="checkbox" className="toggle toggle-xs toggle-warning" checked={showAdvanced} onChange={e => setShowAdvanced(e.target.checked)} />
                        <span className="text-xs font-bold">¿Es un producto "Armable"?</span>
                    </label>
                </div>

                {showAdvanced && (
                    <div className="space-y-3 animate-fade-in">
                        <div>
                            <label className="text-[10px] font-bold">Regla de Precio (Escala)</label>
                            <select className="select select-xs select-bordered w-full" value={rulesRef} onChange={e=>setRulesRef(e.target.value)} required={showAdvanced}>
                                <option value="">-- Selecciona Regla --</option>
                                {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold">Grupo Base (Ingredientes)</label>
                            <select className="select select-xs select-bordered w-full" value={baseGroup} onChange={e=>setBaseGroup(e.target.value)} required={showAdvanced}>
                                <option value="">-- Selecciona Grupo Base --</option>
                                {availableOptionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold">Grupos Extras (Costo Adicional)</label>
                            <div className="h-20 overflow-y-auto border rounded p-1 bg-base-200">
                                {availableOptionGroups.map(g => (
                                    <label key={g.id} className="cursor-pointer label justify-start gap-2 p-0">
                                        <input type="checkbox" className="checkbox checkbox-xs" checked={extraGroups.includes(g.id)} onChange={()=>toggleArrayItem(g.id, setExtraGroups)} />
                                        <span className="text-[10px]">{g.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold">Grupos Toppings (Salsas/Decoración)</label>
                            <div className="h-20 overflow-y-auto border rounded p-1 bg-base-200">
                                {availableOptionGroups.map(g => (
                                    <label key={g.id} className="cursor-pointer label justify-start gap-2 p-0">
                                        <input type="checkbox" className="checkbox checkbox-xs" checked={toppingGroups.includes(g.id)} onChange={()=>toggleArrayItem(g.id, setToppingGroups)} />
                                        <span className="text-[10px]">{g.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button disabled={submitting} className="btn btn-primary btn-block mt-2">{submitting ? '...' : 'Guardar'}</button>
          </form>
      </div>

      <div className="lg:col-span-2 bg-base-100 rounded-box border p-4 overflow-y-auto">
          {/* Aquí va la tabla de lista de grupos (igual que antes) */}
          <table className="table table-sm">
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Contenido</th><th></th></tr></thead>
            <tbody>
                {groups.sort((a,b)=>(a.parent||'').localeCompare(b.parent||'') || a.name.localeCompare(b.name)).map(g=>(
                    <tr key={g.id} className="hover">
                        <td>
                            <div className="flex items-center gap-2">
                                <div style={{width: g.level * 15}} />
                                <span className="text-lg">{g.level===0?'📂':'Lr'}</span>
                                <span className="font-bold text-xs">{g.name}</span>
                            </div>
                        </td>
                        <td>{g.rules_ref ? <span className="badge badge-warning badge-xs">Armable</span> : <span className="badge badge-ghost badge-xs">Carpeta</span>}</td>
                        <td className="text-xs opacity-60">{g.items_ref?.length || 0} items</td>
                        <td className="text-right">
                            <button onClick={()=>handleEdit(g)} className="btn btn-xs btn-square btn-ghost">✏️</button>
                            <button onClick={()=>handleDelete(g.id)} className="btn btn-xs btn-square btn-ghost text-error">🗑️</button>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
      </div>
    </div>
  );
};