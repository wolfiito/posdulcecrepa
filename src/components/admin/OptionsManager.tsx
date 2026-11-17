// src/components/admin/OptionsManager.tsx
// Listas de opciones (ej. "Tipo de leche") y sus opciones (ej. "Deslactosada") en una sola pantalla.
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { Modifier, ModifierGroup, MenuItem, MenuGroup } from '../../types/menu';
import { isExclusiveGroup } from '../../constants/menuConstants';
import { Package, Pencil, Trash, X } from 'lucide-react';
import type { Supply } from '../../types/inventory';
import { RecipeEditor, cleanRecipe } from './RecipeEditor';

interface Branch { id: string; name: string; }

const NO_LIST = '__sin_lista__';

export const OptionsManager: React.FC = () => {
    const [modifiers, setModifiers] = useState<Modifier[]>([]);
    const [lists, setLists] = useState<ModifierGroup[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Formularios
    const [editingMod, setEditingMod] = useState<Modifier | null>(null);
    const [editingList, setEditingList] = useState<ModifierGroup | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modsSnap, listsSnap, branchesSnap, itemsSnap, groupsSnap, suppliesSnap] = await Promise.all([
                getDocs(collection(db, 'modifiers')),
                getDocs(collection(db, 'modifier_groups')),
                getDocs(collection(db, 'branches')),
                getDocs(collection(db, 'menu_items')),
                getDocs(collection(db, 'menu_groups')),
                getDocs(collection(db, 'supplies'))
            ]);

            setModifiers(modsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Modifier)));
            setLists(listsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ModifierGroup)));
            setBranches(branchesSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
            setProducts(itemsSnap.docs.map(d => d.data() as MenuItem));
            setMenuGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)));
            setSupplies(suppliesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Supply)).sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            toast.error("Error al cargar opciones");
        } finally {
            setLoading(false);
        }
    };

    // --- DATOS DERIVADOS ---

    // Dónde se usa cada lista: productos y categorías armables (crepas, waffles...)
    const usageByList = useMemo(() => {
        const map = new Map<string, string[]>();
        const addUse = (listId: string, name: string) => map.set(listId, [...(map.get(listId) || []), name]);
        products.forEach(p => p.modifierGroups?.forEach(listId => addUse(listId, p.name)));
        menuGroups.forEach(g => {
            [g.base_group, ...(g.extra_groups || []), ...(g.topping_groups || [])]
                .filter((listId): listId is string => !!listId)
                .forEach(listId => addUse(listId, g.name));
        });
        return map;
    }, [products, menuGroups]);

    const sections = useMemo(() => {
        const term = search.trim().toLowerCase();
        const matches = (m: Modifier) => !term || m.name.toLowerCase().includes(term);
        const listIds = new Set(lists.map(l => l.id));

        const result = [...lists]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(list => ({
                list,
                options: modifiers.filter(m => m.group === list.id && matches(m)).sort((a, b) => a.name.localeCompare(b.name))
            }));

        // Opciones cuya lista ya no existe: antes no se mostraban en ningún lado
        const orphans = modifiers.filter(m => !listIds.has(m.group) && matches(m));
        if (orphans.length > 0) {
            result.push({ list: { id: NO_LIST, name: 'Sin lista (no se pueden vender)' }, options: orphans });
        }

        // Al buscar, ocultamos las listas sin coincidencias
        return term ? result.filter(s => s.options.length > 0 || s.list.name.toLowerCase().includes(term)) : result;
    }, [lists, modifiers, search]);

    const branchName = (id: string) => branches.find(b => b.id === id)?.name || id;

    // --- LISTAS ---
    const handleSaveList = async () => {
        if (!editingList?.name.trim()) return toast.error("El nombre es obligatorio");
        setIsSaving(true);
        try {
            const id = editingList.id || `mg_${Date.now()}`;
            // Guardamos isExclusive explícito para que ya no dependa de la lista fija
            const isExclusive = isExclusiveGroup(id, [editingList]);
            await setDoc(doc(db, 'modifier_groups', id), { ...editingList, name: editingList.name.trim(), id, isExclusive });
            toast.success("Lista guardada");
            setEditingList(null);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar la lista");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteList = async (list: ModifierGroup) => {
        const usedBy = usageByList.get(list.id) || [];
        if (usedBy.length > 0) {
            const preview = usedBy.slice(0, 3).join(', ') + (usedBy.length > 3 ? ` y ${usedBy.length - 3} más` : '');
            return toast.error(`No se puede eliminar: la usan ${preview}. Quítala de esos productos primero.`);
        }
        const options = modifiers.filter(m => m.group === list.id);
        const message = options.length > 0
            ? `¿Eliminar "${list.name}" y sus ${options.length} opciones?`
            : `¿Eliminar "${list.name}"?`;
        if (!window.confirm(message)) return;

        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'modifier_groups', list.id));
            options.forEach(m => batch.delete(doc(db, 'modifiers', m.id)));
            await batch.commit();
            toast.success("Lista eliminada");
            setEditingList(null);
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    // --- OPCIONES ---
    const openNewOption = (listId: string) => {
        setEditingMod({ id: '', name: '', price: 0, group: listId === NO_LIST ? '' : listId, disabledIn: [], branchPrices: {} });
    };

    const handleSaveOption = async () => {
        if (!editingMod || !editingMod.name.trim() || !editingMod.group) {
            return toast.error("Nombre y lista son obligatorios");
        }
        setIsSaving(true);
        try {
            const idToSave = editingMod.id || `mod_${Date.now()}`;
            // Se guarda sin trackStock/currentStock: el inventario ahora va por insumo (receta)
            const { trackStock: _t, currentStock: _c, ...rest } = editingMod as Modifier & { trackStock?: boolean; currentStock?: number };
            await setDoc(doc(db, 'modifiers', idToSave), {
                ...rest, name: editingMod.name.trim(), id: idToSave, recipe: cleanRecipe(editingMod.recipe)
            });

            toast.success("Opción guardada");
            setEditingMod(null);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOption = async (mod: Modifier) => {
        if (!window.confirm(`¿Eliminar "${mod.name}"?`)) return;
        try {
            await deleteDoc(doc(db, 'modifiers', mod.id));
            toast.success("Eliminada");
            setEditingMod(null);
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    // --- FORMULARIO DE LISTA ---
    const renderListModal = () => {
        if (!editingList) return null;
        const usedBy = editingList.id ? usageByList.get(editingList.id) || [] : [];

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-base-200 bg-info/10 flex justify-between items-center">
                        <h2 className="text-lg font-black text-info">{editingList.id ? 'Editar Lista' : 'Nueva Lista'}</h2>
                        <button onClick={() => setEditingList(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div className="form-control">
                            <label className="label-text font-bold mb-2">Nombre de la lista</label>
                            <input type="text" className="input input-bordered w-full" placeholder="Ej. Tipo de leche"
                                value={editingList.name} onChange={e => setEditingList({ ...editingList, name: e.target.value })} autoFocus />
                        </div>

                        <label className="label cursor-pointer justify-start gap-3">
                            <input type="checkbox" className="checkbox checkbox-info"
                                checked={isExclusiveGroup(editingList.id, [editingList])}
                                onChange={e => setEditingList({ ...editingList, isExclusive: e.target.checked })} />
                            <span className="label-text">
                                <span className="font-bold block">Elegir solo una (obligatorio)</span>
                                <span className="text-xs opacity-70">Ej. tipo de leche o sabor. Si no se marca, el cliente puede elegir varias o ninguna.</span>
                            </span>
                        </label>

                        {usedBy.length > 0 && (
                            <p className="text-xs opacity-70">Se usa en: {usedBy.join(', ')}</p>
                        )}
                    </div>

                    <div className="p-3 border-t border-base-200 flex gap-2 bg-base-200/50">
                        {editingList.id && (
                            <button onClick={() => handleDeleteList(editingList)} className="btn btn-ghost text-error"><Trash size={16} className="shrink-0" /></button>
                        )}
                        <button onClick={() => setEditingList(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSaveList} disabled={isSaving} className="btn btn-info text-white flex-[2]">
                            {isSaving ? 'Guardando...' : 'Guardar Lista'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- FORMULARIO DE OPCIÓN ---
    const renderOptionModal = () => {
        if (!editingMod) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-lg h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-base-200 bg-base-200/50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-secondary">
                            {editingMod.id ? 'Editar Opción' : 'Nueva Opción'}
                        </h2>
                        <button onClick={() => setEditingMod(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>

                    <div className="p-4 space-y-5 overflow-y-auto flex-1">
                        {/* DATOS BÁSICOS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">Nombre</label>
                                <input type="text" className="input input-bordered" value={editingMod.name}
                                    onChange={e => setEditingMod({ ...editingMod, name: e.target.value })} placeholder="Ej. Mora Azul" />
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">Lista</label>
                                <select className="select select-bordered" value={editingMod.group}
                                    onChange={e => setEditingMod({ ...editingMod, group: e.target.value })}>
                                    <option value="">Selecciona una lista...</option>
                                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">Precio extra</label>
                                <label className="input input-bordered flex items-center gap-1">
                                    <span className="opacity-50">$</span>
                                    <input type="number" inputMode="decimal" className="w-full" placeholder="0 = gratis"
                                        value={editingMod.price || ''}
                                        onChange={e => setEditingMod({ ...editingMod, price: Number(e.target.value) })} />
                                </label>
                            </div>
                        </div>

                        {/* RECETA (INVENTARIO) */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-sm">Insumos que gasta una porción</h3>
                            <RecipeEditor recipe={editingMod.recipe} supplies={supplies}
                                onChange={recipe => setEditingMod({ ...editingMod, recipe })} />
                            <p className="text-[11px] opacity-60">Se descuentan del inventario de la sucursal en cada venta. Sin insumos = no afecta inventario.</p>
                        </div>

                        {/* DISPONIBILIDAD Y PRECIO POR SUCURSAL */}
                        {branches.length > 0 && (
                            <div className="bg-base-200/50 p-3 rounded-xl space-y-2">
                                <h3 className="font-bold text-sm uppercase opacity-60">Por sucursal</h3>
                                {branches.map(b => {
                                    const isDisabled = editingMod.disabledIn?.includes(b.id);
                                    return (
                                        <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 bg-base-100 p-3 rounded-lg border border-base-300">
                                            <span className="font-medium">{b.name}</span>
                                            <div className="flex items-center gap-2">
                                                {!isDisabled && (
                                                    <label className="input input-xs input-bordered flex items-center gap-1 w-20" title="En blanco = usa el precio extra general">
                                                        <span className="opacity-50">$</span>
                                                        <input type="number" inputMode="decimal" className="w-full"
                                                            placeholder={String(editingMod.price || 0)}
                                                            value={editingMod.branchPrices?.[b.id] ?? ''}
                                                            onChange={e => {
                                                                const branchPrices = { ...(editingMod.branchPrices || {}) };
                                                                if (e.target.value === '') delete branchPrices[b.id];
                                                                else branchPrices[b.id] = Number(e.target.value);
                                                                setEditingMod({ ...editingMod, branchPrices });
                                                            }} />
                                                    </label>
                                                )}
                                                <input type="checkbox" className="toggle toggle-sm toggle-success" checked={!isDisabled}
                                                    onChange={() => {
                                                        const curr = editingMod.disabledIn || [];
                                                        setEditingMod({ ...editingMod, disabledIn: isDisabled ? curr.filter(id => id !== b.id) : [...curr, b.id] });
                                                    }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-[10px] opacity-60">Precio en blanco = usa el precio extra general.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-base-200 bg-base-200/50 flex gap-2">
                        {editingMod.id && (
                            <button onClick={() => handleDeleteOption(editingMod)} className="btn btn-ghost text-error"><Trash size={16} className="shrink-0" /></button>
                        )}
                        <button onClick={() => setEditingMod(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSaveOption} disabled={isSaving} className="btn btn-secondary flex-[2]">
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-secondary"></span></div>;

    return (
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-base-200/50 p-4 rounded-xl border border-base-300">
              <div>
                  <h3 className="text-xl font-bold">Opciones</h3>
                  <p className="text-xs opacity-70">Lo que se le pregunta al cliente (ej. "Tipo de leche") y sus opciones.</p>
              </div>
              <button onClick={() => setEditingList({ id: '', name: '' })} className="btn btn-info btn-sm text-white w-full sm:w-auto">
                  + Nueva Lista
              </button>
          </div>

          <input type="search" className="input input-bordered input-sm w-full" placeholder="Buscar opción..."
              value={search} onChange={e => setSearch(e.target.value)} />

          {sections.map(({ list, options }) => {
              const isOrphanSection = list.id === NO_LIST;
              const usedBy = usageByList.get(list.id) || [];
              return (
                  <div key={list.id} className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
                      {/* Encabezado de la lista */}
                      <div className="flex items-center justify-between gap-2 p-3 bg-base-200/50 border-b border-base-300">
                          <div className="min-w-0">
                              <h4 className="font-bold truncate">{list.name}</h4>
                              {!isOrphanSection && (
                                  <p className="text-[11px] opacity-60">
                                      {isExclusiveGroup(list.id, lists) ? 'Elige una (obligatorio)' : 'Varias (opcional)'}
                                      {' · '}
                                      {usedBy.length > 0 ? `en ${usedBy.length} producto${usedBy.length === 1 ? '' : 's'}` : 'sin usar'}
                                  </p>
                              )}
                          </div>
                          {!isOrphanSection && (
                              <button onClick={() => setEditingList({ ...list })} className="btn btn-square btn-ghost btn-sm"><Pencil size={16} className="shrink-0" /></button>
                          )}
                      </div>

                      {/* Opciones */}
                      <div className="divide-y divide-base-200">
                          {options.map(mod => {
                              const customBranches = Object.keys(mod.branchPrices || {});
                              const offIn = mod.disabledIn || [];
                              return (
                                  <button key={mod.id} onClick={() => setEditingMod({ ...mod })}
                                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-base-200/50">
                                      <span className="min-w-0">
                                          <span className="font-medium text-sm block truncate">{mod.name}</span>
                                          {offIn.length > 0 && (
                                              <span className="text-[10px] text-warning block truncate">Oculta en {offIn.map(branchName).join(', ')}</span>
                                          )}
                                      </span>
                                      <span className="flex items-center gap-1 shrink-0">
                                          {(mod.recipe?.length ?? 0) > 0 && <span className="badge badge-xs badge-info" title="Tiene receta de inventario"><Package size={10} className="shrink-0" /></span>}
                                          <span className="text-xs opacity-70">
                                              {mod.price > 0 ? `+$${mod.price}` : 'Gratis'}
                                              {customBranches.length > 0 ? ' *' : ''}
                                          </span>
                                      </span>
                                  </button>
                              );
                          })}
                          {options.length === 0 && !search && (
                              <p className="px-3 py-2 text-xs opacity-50">Sin opciones todavía.</p>
                          )}
                      </div>

                      {!isOrphanSection && (
                          <button onClick={() => openNewOption(list.id)} className="btn btn-ghost btn-sm w-full rounded-none border-t border-base-200 text-secondary">
                              + Agregar opción
                          </button>
                      )}
                  </div>
              );
          })}

          {sections.length === 0 && (
              <p className="text-center opacity-60 py-10">{search ? 'Sin resultados.' : 'Aún no hay listas. Crea la primera.'}</p>
          )}
          <p className="text-[10px] opacity-50">* Tiene precio distinto en alguna sucursal.</p>

          {renderListModal()}
          {renderOptionModal()}
      </div>
  );
};
