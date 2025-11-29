// src/components/admin/GroupsManager.tsx
import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../../firebase';
import type { MenuGroup, MenuItem, Modifier, PriceRule } from '../../types/menu';

export const GroupsManager: React.FC = () => {
  // --- ESTADO DE DATOS ---
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [rules, setRules] = useState<PriceRule[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- ESTADO DEL FORMULARIO ---
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Datos Básicos
  const [name, setName] = useState('');
  const [parent, setParent] = useState('root');
  
  // Relaciones
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // items_ref
  
  // Configuración Avanzada (Arma tu crepa)
  const [rulesRef, setRulesRef] = useState('');
  const [baseGroup, setBaseGroup] = useState('');
  const [extraGroups, setExtraGroups] = useState<string[]>([]);
  const [toppingGroups, setToppingGroups] = useState<string[]>([]);

  // Helpers de UI
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- CARGA INICIAL ---
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [gSnap, iSnap, mSnap, rSnap] = await Promise.all([
        getDocs(collection(db, 'menu_groups')),
        getDocs(collection(db, 'menu_items')),
        getDocs(collection(db, 'modifiers')),
        getDocs(collection(db, 'price_rules'))
      ]);

      setGroups(gSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)));
      setItems(iSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)).sort((a,b) => a.name.localeCompare(b.name)));
      setModifiers(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Modifier)));
      setRules(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)));
    } catch (error) {
      console.error(error);
      alert("Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJADORES ---
  const handleEdit = (group: MenuGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setParent(group.parent || 'root');
    setSelectedItems(group.items_ref || []);
    
    // Avanzado
    setRulesRef(group.rules_ref || '');
    setBaseGroup(group.base_group || '');
    setExtraGroups(group.extra_groups || []);
    setToppingGroups(group.topping_groups || []);
    
    // Abrir avanzado si tiene reglas
    if (group.rules_ref) setShowAdvanced(true);
    else setShowAdvanced(false);
  };

  const handleReset = () => {
    setEditingId(null);
    setName('');
    setParent('root');
    setSelectedItems([]);
    setRulesRef('');
    setBaseGroup('');
    setExtraGroups([]);
    setToppingGroups([]);
    setShowAdvanced(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Calcular nivel (Si padre es root -> nivel 1, si padre es nivel 1 -> nivel 2)
    const parentGroup = groups.find(g => g.id === parent);
    const level = parent === 'root' ? 1 : (parentGroup?.level || 0) + 1;

    const groupData: any = {
      name,
      parent,
      level,
      items_ref: selectedItems,
    };

    // Solo guardar campos avanzados si están llenos (para no ensuciar la BD)
    if (rulesRef) groupData.rules_ref = rulesRef;
    if (baseGroup) groupData.base_group = baseGroup;
    if (extraGroups.length > 0) groupData.extra_groups = extraGroups;
    if (toppingGroups.length > 0) groupData.topping_groups = toppingGroups;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'menu_groups', editingId), groupData);
        alert("Categoría actualizada");
      } else {
        await addDoc(collection(db, 'menu_groups'), groupData);
        alert("Categoría creada");
      }
      handleReset();
      loadAllData(); // Recarga completa para actualizar árboles
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Validar que no tenga hijos antes de borrar
    const hasChildren = groups.some(g => g.parent === id);
    if (hasChildren) return alert("No puedes eliminar una categoría que tiene sub-categorías. Borra o mueve las hijas primero.");
    
    if(!confirm("¿Eliminar esta categoría?")) return;
    try {
        await deleteDoc(doc(db, 'menu_groups', id));
        loadAllData();
    } catch (e) { alert("Error al eliminar"); }
  };

  // --- HELPERS PARA CHECKBOXES ---
  const toggleItem = (id: string) => setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  
  // Extraemos grupos únicos de modificadores para los dropdowns
  const uniqueModGroups = Array.from(new Set(modifiers.map(m => m.group)));

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      
      {/* FORMULARIO IZQUIERDO */}
      <div className="lg:col-span-1 card bg-base-200 h-full overflow-y-auto">
        <div className="card-body p-4">
          <div className="flex justify-between">
            <h3 className="font-bold text-lg">{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            {editingId && <button onClick={handleReset} className="btn btn-xs btn-ghost">Cancelar</button>}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            <div className="form-control">
              <label className="label-text text-xs font-bold">Nombre</label>
              <input className="input input-sm input-bordered" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Crepas Dulces" />
            </div>

            <div className="form-control">
              <label className="label-text text-xs font-bold">Carpeta Padre</label>
              <select className="select select-sm select-bordered" value={parent} onChange={e => setParent(e.target.value)}>
                <option value="root">🌟 PRINCIPAL (Root)</option>
                {groups
                  .filter(g => g.id !== editingId) // No ser padre de sí mismo
                  .map(g => (
                    <option key={g.id} value={g.id}>
                      {'-'.repeat(g.level)} 📂 {g.name}
                    </option>
                ))}
              </select>
            </div>

            <div className="divider text-xs opacity-50 my-1">CONTENIDO</div>

            {/* SELECCIONAR PRODUCTOS */}
            <div className="form-control">
              <label className="label-text text-xs font-bold mb-1">Productos en esta categoría</label>
              <div className="h-40 overflow-y-auto border border-base-300 bg-base-100 rounded p-2 grid grid-cols-1 gap-1">
                {items.length === 0 && <p className="text-xs opacity-50 p-2">No hay productos creados.</p>}
                {items.map(item => (
                  <label key={item.id} className="cursor-pointer label justify-start gap-2 hover:bg-base-200 p-1 py-0 rounded">
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-xs checkbox-primary"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="label-text text-xs truncate">{item.name}</span>
                  </label>
                ))}
              </div>
              <div className="text-[10px] text-right opacity-60 mt-1">{selectedItems.length} seleccionados</div>
            </div>

            {/* OPCIONES AVANZADAS (Armado) */}
            <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
              <input type="checkbox" checked={showAdvanced} onChange={e => setShowAdvanced(e.target.checked)} /> 
              <div className="collapse-title text-xs font-bold flex items-center gap-2">
                ⚡ Configuración "Arma tu..."
              </div>
              <div className="collapse-content space-y-3 pt-2">
                
                <div className="form-control">
                  <label className="label-text text-[10px] font-bold">Regla de Cobro</label>
                  <select className="select select-xs select-bordered" value={rulesRef} onChange={e => setRulesRef(e.target.value)}>
                    <option value="">-- Ninguna (Solo carpeta) --</option>
                    {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                {rulesRef && (
                    <>
                        <div className="form-control">
                            <label className="label-text text-[10px] font-bold">Grupo Base (Obligatorio)</label>
                            <select className="select select-xs select-bordered" value={baseGroup} onChange={e => setBaseGroup(e.target.value)}>
                                <option value="">-- Seleccionar --</option>
                                {uniqueModGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="alert alert-warning text-[10px] p-2">
                            <span>Para los grupos Extras y Toppings, usa los mismos IDs que definiste en los Ingredientes (Modifiers).</span>
                        </div>
                        {/* Aquí podrías agregar multiselect para extraGroups y toppingGroups si fuera necesario, 
                            por simplicidad lo omito pero la lógica es igual a "Productos" */}
                    </>
                )}
              </div>
            </div>

            <button disabled={submitting} className="btn btn-primary btn-block mt-4">
              {submitting ? 'Guardando...' : 'Guardar Categoría'}
            </button>
          </form>
        </div>
      </div>

      {/* LISTA DERECHA */}
      <div className="lg:col-span-2 bg-base-100 rounded-box border border-base-200 overflow-y-auto p-4">
        {loading ? <div className="text-center p-10"><span className="loading loading-spinner"></span></div> : (
            <table className="table table-sm">
                <thead>
                    <tr>
                        <th>Jerarquía / Nombre</th>
                        <th>Tipo</th>
                        <th>Contenido</th>
                        <th className="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {groups
                        // Ordenar para mostrar como árbol visual
                        .sort((a,b) => (a.parent || '').localeCompare(b.parent || '') || a.name.localeCompare(b.name))
                        .map(g => (
                        <tr key={g.id} className="hover">
                            <td>
                                <div className="flex items-center gap-2">
                                    {/* Indentación visual */}
                                    <div style={{width: g.level * 20}} />
                                    <span className="text-lg">{g.level === 0 ? '📂' : 'Lr'}</span>
                                    <span className={`font-bold ${g.level === 0 ? 'text-primary' : ''}`}>{g.name}</span>
                                </div>
                                <div className="text-[10px] opacity-40 ml-8">ID: {g.id}</div>
                            </td>
                            <td>
                                {g.rules_ref ? <span className="badge badge-warning badge-xs">Armable</span> : <span className="badge badge-ghost badge-xs">Carpeta</span>}
                            </td>
                            <td className="text-xs opacity-70">
                                {g.items_ref?.length || 0} productos
                            </td>
                            <td className="text-right">
                                <button onClick={() => handleEdit(g)} className="btn btn-square btn-ghost btn-xs">✏️</button>
                                <button onClick={() => handleDelete(g.id)} className="btn btn-square btn-ghost btn-xs text-error">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};