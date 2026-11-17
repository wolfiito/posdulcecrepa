// src/components/admin/GroupsManager.tsx
// Categorías del menú: carpetas con productos o categorías que se arman por ingredientes.
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { MenuGroup, MenuItem, ModifierGroup, PriceRule } from '../../types/menu';
import { Check, Folder, Layers, Plus, Trash, X } from 'lucide-react';

const ROOT_ID = 'root';

type GroupKind = 'FOLDER' | 'BUILD';

const isBuildGroup = (g: MenuGroup) => !!g.rules_ref;

// En el formulario, rules_ref = '' significa "se arma, pero aún sin regla elegida"
const isBuildDraft = (g: MenuGroup) => g.rules_ref !== undefined;

// Copia profunda para no modificar la categoría original mientras se edita
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const GroupsManager: React.FC = () => {
    const [groups, setGroups] = useState<MenuGroup[]>([]);
    const [allItems, setAllItems] = useState<MenuItem[]>([]);
    const [lists, setLists] = useState<ModifierGroup[]>([]);
    const [rules, setRules] = useState<PriceRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
    const [itemSearch, setItemSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupsSnap, itemsSnap, listsSnap, rulesSnap] = await Promise.all([
                getDocs(collection(db, 'menu_groups')),
                getDocs(collection(db, 'menu_items')),
                getDocs(collection(db, 'modifier_groups')),
                getDocs(collection(db, 'price_rules'))
            ]);
            setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup)));
            setAllItems(itemsSnap.docs.map(d => d.data() as MenuItem));
            setLists(listsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ModifierGroup)));
            setRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)));
        } catch (e) {
            toast.error("Error al cargar categorías");
        } finally {
            setLoading(false);
        }
    };

    // --- DATOS DERIVADOS ---
    const childrenOf = (parentId: string) =>
        groups.filter(g => g.parent === parentId && g.id !== ROOT_ID).sort((a, b) => a.name.localeCompare(b.name));

    // Árbol aplanado para mostrar con sangría
    const tree = useMemo(() => {
        const result: { group: MenuGroup; depth: number }[] = [];
        const walk = (parentId: string, depth: number) => {
            childrenOf(parentId).forEach(group => {
                result.push({ group, depth });
                walk(group.id, depth + 1);
            });
        };
        walk(ROOT_ID, 0);
        // Categorías con un padre que ya no existe
        const shown = new Set(result.map(r => r.group.id));
        groups.filter(g => g.id !== ROOT_ID && !shown.has(g.id)).forEach(group => result.push({ group, depth: 0 }));
        return result;
    }, [groups]);

    const listName = (id?: string) => lists.find(l => l.id === id)?.name || id || '—';
    const ruleName = (id?: string) => rules.find(r => r.id === id)?.name || id || '—';

    // Ids de la categoría y todas sus subcategorías (no puede quedar dentro de sí misma)
    const descendantIds = (groupId: string): Set<string> => {
        const ids = new Set<string>([groupId]);
        let added = true;
        while (added) {
            added = false;
            groups.forEach(g => {
                if (g.parent && ids.has(g.parent) && !ids.has(g.id)) { ids.add(g.id); added = true; }
            });
        }
        return ids;
    };

    // --- EDICIÓN ---
    const openNewGroup = () => {
        setEditingGroup({ id: '', name: '', level: 1, parent: ROOT_ID, items_ref: [] });
        setItemSearch('');
    };

    const openEditGroup = (group: MenuGroup) => {
        setEditingGroup(clone(group));
        setItemSearch('');
    };

    const updateGroup = (changes: Partial<MenuGroup>) => {
        if (!editingGroup) return;
        setEditingGroup({ ...editingGroup, ...changes });
    };

    const setKind = (kind: GroupKind) => {
        if (!editingGroup) return;
        if (kind === 'BUILD' && !isBuildDraft(editingGroup)) {
            const productCount = editingGroup.items_ref?.length || 0;
            if (productCount > 0 && !window.confirm(`Los ${productCount} productos de esta carpeta dejarán de mostrarse aquí. ¿Continuar?`)) return;
            updateGroup({ rules_ref: rules[0]?.id || '', items_ref: [] });
        }
        if (kind === 'FOLDER' && isBuildDraft(editingGroup)) {
            updateGroup({ rules_ref: undefined, base_group: undefined, extra_groups: undefined, topping_groups: undefined, items_ref: [] });
        }
    };

    const toggleInArray = (field: 'items_ref' | 'extra_groups' | 'topping_groups', id: string) => {
        if (!editingGroup) return;
        const current = editingGroup[field] || [];
        updateGroup({ [field]: current.includes(id) ? current.filter(x => x !== id) : [...current, id] });
    };

    // --- GUARDAR / ELIMINAR ---
    const handleSave = async () => {
        if (!editingGroup) return;
        const name = editingGroup.name.trim();
        if (!name) return toast.error("Nombre obligatorio");

        const isBuild = isBuildDraft(editingGroup);
        if (isBuild) {
            if (!editingGroup.rules_ref) return toast.error("Elige la regla de precio");
            if (!editingGroup.base_group) return toast.error("Elige la lista de ingredientes que cuentan para el precio");
        }

        const parentId = editingGroup.parent || ROOT_ID;
        const parent = groups.find(g => g.id === parentId);
        const level = parentId === ROOT_ID ? 1 : (parent?.level ?? 1) + 1;

        setIsSaving(true);
        try {
            const id = editingGroup.id || `group_${Date.now()}`;
            // Conservamos los campos que el formulario no muestra (ej. cost) y quitamos
            // los que no aplican al tipo elegido. clone() elimina los undefined.
            const toSave: MenuGroup = clone({ ...editingGroup, id, name, level, parent: parentId });
            if (isBuild) {
                delete toSave.items_ref;
                toSave.extra_groups = toSave.extra_groups || [];
                toSave.topping_groups = toSave.topping_groups || [];
            } else {
                delete toSave.rules_ref;
                delete toSave.base_group;
                delete toSave.extra_groups;
                delete toSave.topping_groups;
                toSave.items_ref = toSave.items_ref || [];
            }

            await setDoc(doc(db, 'menu_groups', id), toSave);
            toast.success("Categoría guardada");
            setEditingGroup(null);
            fetchData();
        } catch (e) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (group: MenuGroup) => {
        const subgroups = childrenOf(group.id);
        if (subgroups.length > 0) {
            return toast.error(`Primero mueve o elimina sus subcategorías: ${subgroups.map(g => g.name).join(', ')}`);
        }
        const productCount = group.items_ref?.length || 0;
        const message = productCount > 0
            ? `¿Eliminar "${group.name}"? Sus ${productCount} productos no se borran, pero dejarán de aparecer aquí.`
            : `¿Eliminar "${group.name}"?`;
        if (!window.confirm(message)) return;
        try {
            await deleteDoc(doc(db, 'menu_groups', group.id));
            toast.success("Categoría eliminada");
            setEditingGroup(null);
            fetchData();
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    // --- FORMULARIO ---
    const renderEditModal = () => {
        if (!editingGroup) return null;
        const isBuild = isBuildDraft(editingGroup);
        const blockedParents = editingGroup.id ? descendantIds(editingGroup.id) : new Set<string>();
        const parentOptions = tree.filter(({ group }) => !isBuildGroup(group) && !blockedParents.has(group.id));
        const term = itemSearch.trim().toLowerCase();
        const visibleItems = [...allItems]
            .filter(item => !term || item.name.toLowerCase().includes(term))
            .sort((a, b) => {
                // Primero los que ya están en la carpeta
                const aIn = editingGroup.items_ref?.includes(a.id) ? 0 : 1;
                const bIn = editingGroup.items_ref?.includes(b.id) ? 0 : 1;
                return aIn - bIn || a.name.localeCompare(b.name);
            });
        const otherLists = lists.filter(l => l.id !== editingGroup.base_group);

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-base-200 bg-base-200/50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-primary">{editingGroup.id ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                        <button onClick={() => setEditingGroup(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">Nombre</label>
                                <input type="text" className="input input-bordered" placeholder="Ej. Armar Waffle"
                                    value={editingGroup.name} onChange={e => updateGroup({ name: e.target.value })} />
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1">¿Dónde aparece?</label>
                                <select className="select select-bordered" value={editingGroup.parent || ROOT_ID}
                                    onChange={e => updateGroup({ parent: e.target.value })}>
                                    <option value={ROOT_ID}>Menú principal</option>
                                    {parentOptions.map(({ group, depth }) => (
                                        <option key={group.id} value={group.id}>{'— '.repeat(depth + 1)}{group.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* TIPO */}
                        <section className="space-y-2">
                            <h3 className="font-bold">¿Qué hace al tocarla?</h3>
                            <div className="join w-full">
                                <button onClick={() => setKind('FOLDER')}
                                    className={`btn btn-sm join-item flex-1 ${!isBuild ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                    <Folder size={14} className="shrink-0" /> Muestra productos
                                </button>
                                <button onClick={() => setKind('BUILD')}
                                    className={`btn btn-sm join-item flex-1 ${isBuild ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                    <Layers size={14} className="shrink-0" /> Se arma
                                </button>
                            </div>
                            <p className="text-xs opacity-60">
                                {isBuild
                                    ? 'El cajero elige ingredientes y el precio sale de la regla (ej. Armar Crepa).'
                                    : 'Una carpeta con productos o con otras categorías adentro.'}
                            </p>
                        </section>

                        {!isBuild ? (
                            /* PRODUCTOS DE LA CARPETA */
                            <section className="space-y-2">
                                <h3 className="font-bold">Productos ({editingGroup.items_ref?.length || 0})</h3>
                                <input type="search" className="input input-bordered input-sm w-full" placeholder="Buscar producto..."
                                    value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                                <div className="max-h-64 overflow-y-auto p-1 bg-base-200/50 rounded-lg divide-y divide-base-200">
                                    {visibleItems.map(item => (
                                        <label key={item.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-base-300/50 p-2">
                                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary"
                                                checked={editingGroup.items_ref?.includes(item.id) ?? false}
                                                onChange={() => toggleInArray('items_ref', item.id)} />
                                            {item.name}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[11px] opacity-60">También puedes elegir la categoría desde cada producto.</p>
                            </section>
                        ) : (
                            /* CONFIGURACIÓN DE ARMADO */
                            <section className="space-y-4">
                                <div className="form-control">
                                    <label className="label-text font-bold mb-1">Regla de precio</label>
                                    <select className="select select-bordered select-sm" value={editingGroup.rules_ref || ''}
                                        onChange={e => updateGroup({ rules_ref: e.target.value })}>
                                        <option value="">Selecciona una regla...</option>
                                        {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    {rules.length === 0 && <p className="text-xs text-warning mt-1">Primero crea una regla en la pestaña "Reglas".</p>}
                                </div>

                                <div className="form-control">
                                    <label className="label-text font-bold mb-1">Ingredientes que cuentan para el precio</label>
                                    <select className="select select-bordered select-sm" value={editingGroup.base_group || ''}
                                        onChange={e => updateGroup({
                                            base_group: e.target.value || undefined,
                                            // Una lista no puede ser base y extra a la vez
                                            extra_groups: (editingGroup.extra_groups || []).filter(id => id !== e.target.value),
                                            topping_groups: (editingGroup.topping_groups || []).filter(id => id !== e.target.value)
                                        })}>
                                        <option value="">Selecciona una lista...</option>
                                        {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                    <p className="text-[11px] opacity-60 mt-1">Ej. "Ingredientes Base": 1 ingrediente = precio de 1, 2 = precio de 2...</p>
                                </div>

                                {(['extra_groups', 'topping_groups'] as const).map(field => (
                                    <div key={field} className="space-y-2">
                                        <h4 className="font-bold text-sm">
                                            {field === 'extra_groups' ? 'Extras (se cobran aparte)' : 'Toppings / cortesías (paso final)'}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {otherLists.map(l => {
                                                const isSelected = editingGroup[field]?.includes(l.id);
                                                return (
                                                    <button key={l.id} onClick={() => toggleInArray(field, l.id)}
                                                        className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                                        {isSelected ? <Check size={12} className="shrink-0" /> : <Plus size={12} className="shrink-0" />}{l.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[11px] opacity-60">¿Falta una lista? Créala en la pestaña "Opciones".</p>

                                {editingGroup.rules_ref && editingGroup.base_group && (
                                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
                                        <span className="font-bold">Así lo arma el cajero: </span>
                                        {[
                                            listName(editingGroup.base_group),
                                            ...(editingGroup.extra_groups?.length ? ['Extras'] : []),
                                            ...(editingGroup.topping_groups?.length ? ['Toppings'] : [])
                                        ].join(' → ')}
                                        <span className="block text-xs opacity-70 mt-1">Precio: {ruleName(editingGroup.rules_ref)}</span>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    <div className="p-3 border-t border-base-200 bg-base-200/50 flex gap-2">
                        {editingGroup.id && (
                            <button onClick={() => handleDelete(editingGroup)} className="btn btn-ghost text-error"><Trash size={16} className="shrink-0" /></button>
                        )}
                        <button onClick={() => setEditingGroup(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex-[2]">
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner text-primary"></span></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-base-200/50 p-4 rounded-xl border border-base-300">
                <div>
                    <h3 className="text-xl font-bold">Categorías</h3>
                    <p className="text-xs opacity-70">Cómo se organiza el menú del POS.</p>
                </div>
                <button onClick={openNewGroup} className="btn btn-primary btn-sm w-full sm:w-auto">+ Nueva Categoría</button>
            </div>

            <div className="bg-base-100 border border-base-300 rounded-2xl divide-y divide-base-200 overflow-hidden">
                {tree.map(({ group, depth }) => (
                    <button key={group.id} onClick={() => openEditGroup(group)}
                        className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-base-200/50"
                        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}>
                        <span className="min-w-0">
                            <span className="font-bold flex items-center gap-2 min-w-0">{isBuildGroup(group) ? <Layers size={16} className="shrink-0" /> : <Folder size={16} className="shrink-0" />}<span className="truncate">{group.name}</span></span>
                            <span className="text-[11px] opacity-60 block truncate">
                                {isBuildGroup(group)
                                    ? `Se arma · ${ruleName(group.rules_ref)} · ${listName(group.base_group)}`
                                    : `${group.items_ref?.length || 0} productos`}
                            </span>
                        </span>
                        <span className="opacity-40">›</span>
                    </button>
                ))}
                {tree.length === 0 && <p className="p-6 text-center opacity-60">Aún no hay categorías.</p>}
            </div>

            {renderEditModal()}
        </div>
    );
};
