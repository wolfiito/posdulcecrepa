// src/components/admin/ProductsManager.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { MenuItem, MenuGroup, ModifierGroup, VariantPriceItem, FixedPriceItem, PriceRule } from '../../types/menu';
import { isExclusiveGroup } from '../../constants/menuConstants';
import { getRuleBasePrice, getBranchAdjustedRule } from '../../utils/pricing';
import { Check, ChevronDown, ChevronRight, Layers, Plus, Save, Trash, TriangleAlert, X } from 'lucide-react';
import type { RecipeLine, Supply } from '../../types/inventory';
import { RecipeEditor, cleanRecipe } from './RecipeEditor';

// Tipos auxiliares para el panel
interface Branch { id: string; name: string; }

const ROOT_ID = 'root';

// Los que se arman por ingredientes (crepas, waffles, hot cakes) son categorías con regla
// de precio en menu_groups; aquí se muestran y editan junto a los productos.
type ListEntry = { kind: 'item'; item: MenuItem } | { kind: 'build'; group: MenuGroup };

const PREVIEW_COUNTS = [1, 2, 3, 4];

const ruleHasBranchPrices = (rule: PriceRule, branchId: string) =>
    rule.branchInitialPrices?.[branchId] !== undefined ||
    rule.branchIncrements?.[branchId] !== undefined ||
    (rule.basePrices || []).some(bp => bp.branchPrices?.[branchId] !== undefined);

// Lo que se edita en el formulario: el producto y las carpetas donde aparece
interface Draft {
    item: MenuItem;
    folderIds: string[];
}

type PriceRow = { name: string; price: number; cost?: number; branchPrices?: Record<string, number>; recipe?: RecipeLine[] };

// Lista nueva creada desde el formulario del producto
interface NewListForm {
    name: string;
    isExclusive: boolean;
    options: { name: string; price: string }[];
}

const emptyNewList = (): NewListForm => ({ name: '', isExclusive: true, options: [{ name: '', price: '' }] });

const isVariantItem = (item: MenuItem): item is VariantPriceItem => 'variants' in item;

// Copia profunda para no modificar el producto original mientras se edita
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const getPriceRows = (item: MenuItem): PriceRow[] =>
    isVariantItem(item)
        ? item.variants
        : [{ name: 'Precio', price: item.price, cost: item.cost, branchPrices: item.branchPrices, recipe: item.recipe }];

const toVariantItem = (item: FixedPriceItem): VariantPriceItem => {
    const { price, cost, branchPrices, recipe, ...rest } = item;
    return { ...rest, variants: [{ name: 'Chico', price, cost, branchPrices: branchPrices || {}, recipe }] };
};

const toFixedItem = (item: VariantPriceItem): FixedPriceItem => {
    const { variants, ...rest } = item;
    const first = variants[0];
    return { ...rest, price: first?.price || 0, cost: first?.cost, branchPrices: first?.branchPrices || {}, recipe: first?.recipe };
};

export const ProductsManager: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [modGroups, setModGroups] = useState<ModifierGroup[]>([]);
    const [folders, setFolders] = useState<MenuGroup[]>([]);
    const [buildGroups, setBuildGroups] = useState<MenuGroup[]>([]);
    const [rules, setRules] = useState<PriceRule[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros del listado
    const [search, setSearch] = useState('');
    const [folderFilter, setFolderFilter] = useState<string>('all');

    // Estado del formulario de edición
    const [draft, setDraft] = useState<Draft | null>(null);
    const [openBranchPrices, setOpenBranchPrices] = useState<number | null>(null);
    const [newList, setNewList] = useState<NewListForm | null>(null);
    const [buildDraft, setBuildDraft] = useState<MenuGroup | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsSnap, branchesSnap, modGroupsSnap, groupsSnap, rulesSnap, suppliesSnap] = await Promise.all([
                getDocs(collection(db, 'menu_items')),
                getDocs(collection(db, 'branches')),
                getDocs(collection(db, 'modifier_groups')),
                getDocs(collection(db, 'menu_groups')),
                getDocs(collection(db, 'price_rules')),
                getDocs(collection(db, 'supplies'))
            ]);

            setItems(itemsSnap.docs.map(d => d.data() as MenuItem));
            setBranches(branchesSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
            setModGroups(modGroupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ModifierGroup)));
            setRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as PriceRule)));
            setSupplies(suppliesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Supply)).sort((a, b) => a.name.localeCompare(b.name)));

            // Carpetas que muestran productos; las de "armar" usan reglas de precio y se listan aparte
            const allGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuGroup));
            setFolders(allGroups.filter(g => g.id !== ROOT_ID && !g.rules_ref));
            setBuildGroups(allGroups.filter(g => g.id !== ROOT_ID && g.rules_ref));
        } catch (error) {
            toast.error("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    };

    // --- DATOS DERIVADOS ---
    const folderName = (folder: MenuGroup) => {
        const parent = folders.find(f => f.id === folder.parent);
        return parent ? `${parent.name} › ${folder.name}` : folder.name;
    };

    const foldersByItem = useMemo(() => {
        const map = new Map<string, MenuGroup[]>();
        folders.forEach(folder => {
            folder.items_ref?.forEach(itemId => {
                map.set(itemId, [...(map.get(itemId) || []), folder]);
            });
        });
        return map;
    }, [folders]);

    const filteredEntries = useMemo((): ListEntry[] => {
        const term = search.trim().toLowerCase();
        const matches = (name: string) => !term || name.toLowerCase().includes(term);
        const itemEntries: ListEntry[] = items
            .filter(item => matches(item.name))
            .filter(item => {
                const itemFolders = foldersByItem.get(item.id) || [];
                if (folderFilter === 'all') return true;
                if (folderFilter === 'none') return itemFolders.length === 0;
                return itemFolders.some(f => f.id === folderFilter);
            })
            .map(item => ({ kind: 'item', item }));
        const buildEntries: ListEntry[] = buildGroups
            .filter(group => matches(group.name))
            .filter(group => folderFilter === 'all' || group.parent === folderFilter)
            .map(group => ({ kind: 'build', group }));
        const entryName = (e: ListEntry) => (e.kind === 'item' ? e.item.name : e.group.name);
        return [...itemEntries, ...buildEntries].sort((a, b) => entryName(a).localeCompare(entryName(b)));
    }, [items, buildGroups, search, folderFilter, foldersByItem]);

    const ruleById = (id?: string) => rules.find(r => r.id === id);
    const listName = (id?: string) => modGroups.find(g => g.id === id)?.name || id || '—';
    const parentName = (parentId?: string) => {
        if (!parentId || parentId === ROOT_ID) return 'Menú principal';
        const folder = folders.find(f => f.id === parentId);
        return folder ? folderName(folder) : 'Categoría inexistente';
    };

    const orphanCount = useMemo(
        () => items.filter(item => !(foldersByItem.get(item.id)?.length)).length,
        [items, foldersByItem]
    );

    // --- ABRIR FORMULARIO ---
    const openNewItem = () => {
        const newItem: FixedPriceItem = { id: '', name: '', category: 'otros', price: 0, disabledIn: [], branchPrices: {}, modifierGroups: [] };
        const initialFolder = folderFilter !== 'all' && folderFilter !== 'none' ? [folderFilter] : [];
        setDraft({ item: newItem, folderIds: initialFolder });
        setOpenBranchPrices(null);
        setNewList(null);
    };

    const openEditItem = (item: MenuItem) => {
        setDraft({
            item: clone(item),
            folderIds: (foldersByItem.get(item.id) || []).map(f => f.id)
        });
        setOpenBranchPrices(null);
        setNewList(null);
    };

    // --- EDICIÓN DEL BORRADOR (siempre sobre copias) ---
    const updateItem = (changes: Partial<MenuItem>) => {
        if (!draft) return;
        setDraft({ ...draft, item: { ...draft.item, ...changes } as MenuItem });
    };

    const updatePriceRow = (index: number, changes: Partial<PriceRow>) => {
        if (!draft) return;
        const item = draft.item;
        if (isVariantItem(item)) {
            const variants = item.variants.map((v, i) => (i === index ? { ...v, ...changes } : v));
            updateItem({ variants } as Partial<VariantPriceItem>);
        } else {
            const { name: _name, ...fixedChanges } = changes;
            updateItem(fixedChanges as Partial<FixedPriceItem>);
        }
    };

    const setBranchPrice = (index: number, branchId: string, value: string) => {
        if (!draft) return;
        const row = getPriceRows(draft.item)[index];
        const branchPrices = { ...(row.branchPrices || {}) };
        if (value === '') delete branchPrices[branchId];
        else branchPrices[branchId] = Number(value);
        updatePriceRow(index, { branchPrices });
    };

    const addSize = () => {
        if (!draft) return;
        const item = draft.item;
        const base = isVariantItem(item) ? item : toVariantItem(item as FixedPriceItem);
        updateItem({ ...base, variants: [...base.variants, { name: '', price: 0, branchPrices: {} }] } as MenuItem);
    };

    const removeSize = (index: number) => {
        if (!draft || !isVariantItem(draft.item)) return;
        const variants = draft.item.variants.filter((_, i) => i !== index);
        // Con un solo tamaño ya no tiene caso preguntar "Tamaño" al cajero
        if (variants.length === 1) {
            setDraft({ ...draft, item: toFixedItem({ ...draft.item, variants }) });
        } else {
            updateItem({ variants } as Partial<VariantPriceItem>);
        }
        setOpenBranchPrices(null);
    };

    const setPriceMode = (mode: 'FIXED' | 'VARIANT') => {
        if (!draft) return;
        const item = draft.item;
        if (mode === 'VARIANT' && !isVariantItem(item)) {
            setDraft({ ...draft, item: toVariantItem(item as FixedPriceItem) });
        }
        if (mode === 'FIXED' && isVariantItem(item)) {
            if (item.variants.length > 1 &&
                !window.confirm(`Se conservará solo el precio de "${item.variants[0].name || 'el primer tamaño'}" y se borrarán los demás tamaños. ¿Continuar?`)) {
                return;
            }
            setDraft({ ...draft, item: toFixedItem(item) });
        }
        setOpenBranchPrices(null);
    };

    const toggleFolder = (folderId: string) => {
        if (!draft) return;
        const folderIds = draft.folderIds.includes(folderId)
            ? draft.folderIds.filter(id => id !== folderId)
            : [...draft.folderIds, folderId];
        setDraft({ ...draft, folderIds });
    };

    const toggleModGroup = (groupId: string) => {
        if (!draft) return;
        const current = draft.item.modifierGroups || [];
        const modifierGroups = current.includes(groupId) ? current.filter(id => id !== groupId) : [...current, groupId];
        updateItem({ modifierGroups });
    };

    const toggleBranch = (branchId: string) => {
        if (!draft) return;
        const current = draft.item.disabledIn || [];
        const disabledIn = current.includes(branchId) ? current.filter(id => id !== branchId) : [...current, branchId];
        updateItem({ disabledIn });
    };

    // --- CREAR LISTA SIN SALIR DEL PRODUCTO ---
    const updateNewListOption = (index: number, changes: Partial<NewListForm['options'][number]>) => {
        if (!newList) return;
        setNewList({ ...newList, options: newList.options.map((o, i) => (i === index ? { ...o, ...changes } : o)) });
    };

    const handleCreateList = async () => {
        if (!newList) return;
        const name = newList.name.trim();
        const options = newList.options.filter(o => o.name.trim());
        if (!name) return toast.error("Ponle nombre a la lista");
        if (options.length === 0) return toast.error("Agrega al menos una opción");

        setIsSaving(true);
        try {
            const stamp = Date.now();
            const listId = `mg_${stamp}`;
            const list: ModifierGroup = { id: listId, name, isExclusive: newList.isExclusive };
            const batch = writeBatch(db);
            batch.set(doc(db, 'modifier_groups', listId), list);
            options.forEach((o, i) => {
                const modId = `mod_${stamp}_${i}`;
                batch.set(doc(db, 'modifiers', modId), {
                    id: modId, name: o.name.trim(), price: Number(o.price) || 0,
                    group: listId, disabledIn: []
                });
            });
            await batch.commit();

            // La lista nueva queda seleccionada en el producto que se está editando
            setModGroups(prev => [...prev, list]);
            setDraft(prev => prev && {
                ...prev,
                item: { ...prev.item, modifierGroups: [...(prev.item.modifierGroups || []), listId] } as MenuItem
            });
            setNewList(null);
            toast.success(`Lista "${name}" creada`);
        } catch (error) {
            toast.error("Error al crear la lista");
        } finally {
            setIsSaving(false);
        }
    };

    // --- GUARDAR / ELIMINAR ---
    const handleSave = async () => {
        if (!draft) return;
        const item = draft.item;
        const rows = getPriceRows(item);

        if (!item.name.trim()) return toast.error("El nombre es obligatorio");
        if (isVariantItem(item) && item.variants.some(v => !v.name.trim())) return toast.error("Ponle nombre a cada tamaño");
        if (rows.some(r => !r.price || r.price <= 0) &&
            !window.confirm("Hay un precio en $0. ¿Guardar de todos modos?")) return;
        if (draft.folderIds.length === 0 &&
            !window.confirm("No elegiste categoría: el producto NO aparecerá en el POS. ¿Guardar de todos modos?")) return;

        setIsSaving(true);
        try {
            const idToSave = item.id || `item_${Date.now()}`;
            const batch = writeBatch(db);

            // clone() quita los campos undefined (ej. cost), que Firestore no acepta
            const withRecipes: MenuItem = isVariantItem(item)
                ? { ...item, variants: item.variants.map(v => ({ ...v, recipe: cleanRecipe(v.recipe) })) }
                : { ...item, recipe: cleanRecipe(item.recipe) };
            batch.set(doc(db, 'menu_items', idToSave), clone({ ...withRecipes, name: item.name.trim(), id: idToSave }));

            // Agregar o quitar el producto de cada carpeta según lo elegido
            folders.forEach(folder => {
                const wasIn = folder.items_ref?.includes(idToSave) ?? false;
                const shouldBeIn = draft.folderIds.includes(folder.id);
                if (wasIn === shouldBeIn) return;
                batch.update(doc(db, 'menu_groups', folder.id), {
                    items_ref: shouldBeIn ? arrayUnion(idToSave) : arrayRemove(idToSave)
                });
            });

            await batch.commit();
            toast.success("Producto guardado correctamente");
            setDraft(null);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (item: MenuItem) => {
        if (!window.confirm(`¿Seguro que deseas eliminar "${item.name}"?`)) return;
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'menu_items', item.id));
            // También lo quitamos de las carpetas para no dejar referencias sueltas
            (foldersByItem.get(item.id) || []).forEach(folder => {
                batch.update(doc(db, 'menu_groups', folder.id), { items_ref: arrayRemove(item.id) });
            });
            await batch.commit();
            toast.success("Producto eliminado");
            setDraft(null);
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    // --- SE ARMA POR INGREDIENTES (categoría con regla de precio) ---
    const openNewBuild = () => {
        const parent = folderFilter !== 'all' && folderFilter !== 'none' ? folderFilter : ROOT_ID;
        setBuildDraft({ id: '', name: '', level: 1, parent, rules_ref: rules[0]?.id || '', extra_groups: [], topping_groups: [] });
    };

    const updateBuild = (changes: Partial<MenuGroup>) => {
        if (!buildDraft) return;
        setBuildDraft({ ...buildDraft, ...changes });
    };

    const toggleBuildList = (field: 'extra_groups' | 'topping_groups', listId: string) => {
        if (!buildDraft) return;
        const current = buildDraft[field] || [];
        updateBuild({ [field]: current.includes(listId) ? current.filter(id => id !== listId) : [...current, listId] });
    };

    const handleSaveBuild = async () => {
        if (!buildDraft) return;
        const name = buildDraft.name.trim();
        if (!name) return toast.error("El nombre es obligatorio");
        if (!buildDraft.rules_ref) return toast.error("Elige la regla de precio");
        if (!buildDraft.base_group) return toast.error("Elige la lista de ingredientes que cuentan para el precio");

        const parentId = buildDraft.parent || ROOT_ID;
        const parent = folders.find(f => f.id === parentId);
        const level = parentId === ROOT_ID ? 1 : (parent?.level ?? 1) + 1;

        setIsSaving(true);
        try {
            const id = buildDraft.id || `group_${Date.now()}`;
            // Mismo formato que guarda la pestaña Categorías; clone() quita los undefined
            const toSave: MenuGroup = clone({
                ...buildDraft, id, name, level, parent: parentId,
                extra_groups: buildDraft.extra_groups || [],
                topping_groups: buildDraft.topping_groups || [],
                recipe: cleanRecipe(buildDraft.recipe)
            });
            delete toSave.items_ref;
            await setDoc(doc(db, 'menu_groups', id), toSave);
            toast.success(`"${name}" guardado`);
            setBuildDraft(null);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBuild = async (group: MenuGroup) => {
        if (!window.confirm(`¿Seguro que deseas eliminar "${group.name}"? Dejará de aparecer en el POS.`)) return;
        try {
            await deleteDoc(doc(db, 'menu_groups', group.id));
            toast.success("Eliminado");
            setBuildDraft(null);
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const renderBuildModal = () => {
        if (!buildDraft) return null;
        const rule = ruleById(buildDraft.rules_ref);
        const sharedWith = buildGroups.filter(g => g.id !== buildDraft.id && g.rules_ref === buildDraft.rules_ref).map(g => g.name);
        const branchesWithPrices = rule ? branches.filter(b => ruleHasBranchPrices(rule, b.id)) : [];
        const priceColumns = [{ id: '', name: 'General' }, ...branchesWithPrices];
        const otherLists = modGroups.filter(l => l.id !== buildDraft.base_group);

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">

                    {/* Header */}
                    <div className="p-4 border-b border-base-200 bg-base-200/50 flex items-center justify-between gap-2">
                        <h2 className="text-xl font-black text-primary">
                            {buildDraft.id ? 'Editar' : 'Nuevo'} · Se arma
                        </h2>
                        <button onClick={() => setBuildDraft(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 space-y-6">
                        <p className="text-xs opacity-70">
                            El cajero elige ingredientes y el precio sale de la regla, según cuántos ingredientes base lleve.
                        </p>

                        {/* 1. NOMBRE Y DÓNDE APARECE */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Nombre</span></label>
                                <input type="text" className="input input-bordered w-full" value={buildDraft.name}
                                    onChange={e => updateBuild({ name: e.target.value })} placeholder="Ej. Hot Cakes" />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">¿Dónde aparece?</span></label>
                                <select className="select select-bordered w-full" value={buildDraft.parent || ROOT_ID}
                                    onChange={e => updateBuild({ parent: e.target.value })}>
                                    <option value={ROOT_ID}>Menú principal</option>
                                    {folders.map(f => <option key={f.id} value={f.id}>{folderName(f)}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* 2. PRECIO */}
                        <section className="space-y-2">
                            <h3 className="font-bold">¿Cómo se cobra?</h3>
                            <select className="select select-bordered select-sm w-full" value={buildDraft.rules_ref || ''}
                                onChange={e => updateBuild({ rules_ref: e.target.value })}>
                                <option value="">Selecciona una regla de precio...</option>
                                {rules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            {rules.length === 0 && <p className="text-xs text-warning">Primero crea una regla en la pestaña "Reglas".</p>}

                            {rule && (
                                <div className="bg-base-200/50 rounded-xl p-3 border border-base-300 space-y-2">
                                    <div className="overflow-x-auto">
                                        <table className="table table-xs">
                                            <thead>
                                                <tr>
                                                    <th>Ingredientes base</th>
                                                    {priceColumns.map(c => <th key={c.id} className="text-right">{c.name}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {PREVIEW_COUNTS.map(count => (
                                                    <tr key={count}>
                                                        <td>{count}</td>
                                                        {priceColumns.map(c => {
                                                            // Mismo cálculo que el POS
                                                            const result = getRuleBasePrice(getBranchAdjustedRule(rule, c.id || null), count);
                                                            return (
                                                                <td key={c.id} className="text-right font-bold">
                                                                    {result.error ? <span className="text-error font-normal">{result.error}</span> : `$${result.price}`}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[11px] opacity-60">
                                        Los precios se cambian en la pestaña "Reglas".
                                        {sharedWith.length > 0 && <> Esta regla también la usa <b>{sharedWith.join(', ')}</b>: si la cambias, cambia para todos.</>}
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* 3. INVENTARIO DE LA BASE */}
                        <section className="space-y-2">
                            <h3 className="font-bold">Insumos de la base</h3>
                            <p className="text-[11px] opacity-60">Lo que gasta cada pieza además de los ingredientes elegidos (ej. 80 g de masa). Lo de cada ingrediente se captura en "Opciones".</p>
                            <RecipeEditor recipe={buildDraft.recipe} supplies={supplies}
                                onChange={recipe => updateBuild({ recipe })} />
                        </section>

                        {/* 4. INGREDIENTES */}
                        <section className="space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Ingredientes que cuentan para el precio</span></label>
                                <select className="select select-bordered select-sm w-full" value={buildDraft.base_group || ''}
                                    onChange={e => updateBuild({
                                        base_group: e.target.value || undefined,
                                        // Una lista no puede ser base y extra a la vez
                                        extra_groups: (buildDraft.extra_groups || []).filter(id => id !== e.target.value),
                                        topping_groups: (buildDraft.topping_groups || []).filter(id => id !== e.target.value)
                                    })}>
                                    <option value="">Selecciona una lista...</option>
                                    {modGroups.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>

                            {(['extra_groups', 'topping_groups'] as const).map(field => (
                                <div key={field} className="space-y-2">
                                    <h4 className="font-bold text-sm">
                                        {field === 'extra_groups' ? 'Extras (se cobran aparte)' : 'Toppings / cortesías (paso final)'}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {otherLists.map(l => {
                                            const isSelected = buildDraft[field]?.includes(l.id);
                                            return (
                                                <button key={l.id} onClick={() => toggleBuildList(field, l.id)}
                                                    className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                                    {isSelected ? <Check size={12} className="shrink-0" /> : <Plus size={12} className="shrink-0" />}{l.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <p className="text-[11px] opacity-60">Los ingredientes de cada lista se agregan o quitan en la pestaña "Opciones".</p>
                        </section>

                        {/* 4. VISTA PREVIA */}
                        {buildDraft.base_group && (
                            <section className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
                                <span className="font-bold">Así lo arma el cajero: </span>
                                {[
                                    listName(buildDraft.base_group),
                                    ...(buildDraft.extra_groups?.length ? ['Extras'] : []),
                                    ...(buildDraft.topping_groups?.length ? ['Toppings'] : [])
                                ].join(' → ')}
                            </section>
                        )}
                    </div>

                    {/* Footer / Botones */}
                    <div className="p-3 border-t border-base-200 bg-base-200/50 flex gap-2">
                        {buildDraft.id && (
                            <button onClick={() => handleDeleteBuild(buildDraft)} className="btn btn-ghost text-error"><Trash size={16} className="shrink-0" /></button>
                        )}
                        <button onClick={() => setBuildDraft(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSaveBuild} disabled={isSaving} className="btn btn-primary flex-[2] shadow-lg shadow-primary/30">
                            {isSaving ? 'Guardando...' : <><Save size={16} className="shrink-0" /> Guardar</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- RENDERIZADO DEL FORMULARIO ---
    const renderEditModal = () => {
        if (!draft) return null;
        const item = draft.item;
        const isVariant = isVariantItem(item);
        const rows = getPriceRows(item);
        const selectedGroups = (item.modifierGroups || [])
            .map(id => modGroups.find(g => g.id === id))
            .filter((g): g is ModifierGroup => !!g);
        const previewSteps = [
            ...(isVariant ? ['Tamaño'] : []),
            ...selectedGroups.map(g => g.name)
        ];

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">

                    {/* Header */}
                    <div className="p-4 border-b border-base-200 bg-base-200/50 flex items-center justify-between gap-2">
                        <h2 className="text-xl font-black text-primary">
                            {item.id ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <button onClick={() => setDraft(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>

                    {/* Cuerpo Scrollable */}
                    <div className="p-4 overflow-y-auto flex-1 space-y-6">

                        {/* 1. NOMBRE */}
                        <section className="form-control">
                            <label className="label"><span className="label-text font-bold">Nombre del producto</span></label>
                            <input type="text" className="input input-bordered w-full" value={item.name}
                                onChange={e => updateItem({ name: e.target.value })} placeholder="Ej. Frappé de Mazapán" />
                        </section>

                        {/* 2. DÓNDE APARECE */}
                        <section className="space-y-2">
                            <h3 className="font-bold">¿En qué categoría aparece?</h3>
                            <div className="flex flex-wrap gap-2">
                                {folders.map(folder => {
                                    const isSelected = draft.folderIds.includes(folder.id);
                                    return (
                                        <button key={folder.id} onClick={() => toggleFolder(folder.id)}
                                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                            {isSelected && <Check size={14} className="shrink-0" />}{folderName(folder)}
                                        </button>
                                    );
                                })}
                            </div>
                            {draft.folderIds.length === 0 && (
                                <p className="text-xs text-warning font-bold flex items-center gap-1"><TriangleAlert size={14} className="shrink-0" /> Sin categoría el producto no aparece en el POS.</p>
                            )}
                        </section>

                        {/* 3. CÓMO SE COBRA Y PRECIOS */}
                        <section className="space-y-3">
                            <h3 className="font-bold">¿Cómo se cobra?</h3>
                            <div className="join w-full">
                                <button onClick={() => setPriceMode('FIXED')}
                                    className={`btn btn-sm join-item flex-1 ${!isVariant ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                    Precio único
                                </button>
                                <button onClick={() => setPriceMode('VARIANT')}
                                    className={`btn btn-sm join-item flex-1 ${isVariant ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                    Por tamaños
                                </button>
                            </div>

                            <div className="space-y-2">
                                {rows.map((row, index) => {
                                    const customCount = Object.keys(row.branchPrices || {}).length;
                                    const isOpen = openBranchPrices === index;
                                    return (
                                        <div key={index} className="bg-base-200/50 rounded-xl p-3 space-y-2 border border-base-300">
                                            <div className="flex items-center gap-2">
                                                {isVariant ? (
                                                    <input type="text" className="input input-sm input-bordered flex-1 min-w-0 font-bold"
                                                        value={row.name} placeholder="Ej. Grande"
                                                        onChange={e => updatePriceRow(index, { name: e.target.value })} />
                                                ) : (
                                                    <span className="flex-1 font-bold text-sm">Precio</span>
                                                )}
                                                <label className="input input-sm input-bordered flex items-center gap-1 w-28">
                                                    <span className="opacity-50">$</span>
                                                    <input type="number" inputMode="decimal" className="w-full font-bold"
                                                        value={row.price || ''} placeholder="0"
                                                        onChange={e => updatePriceRow(index, { price: Number(e.target.value) })} />
                                                </label>
                                                {isVariant && (
                                                    <button onClick={() => removeSize(index)} className="btn btn-square btn-ghost btn-sm text-error" title="Quitar tamaño"><Trash size={16} className="shrink-0" /></button>
                                                )}
                                            </div>

                                            {branches.length > 0 && (
                                                <button onClick={() => setOpenBranchPrices(isOpen ? null : index)} className="text-xs link link-hover opacity-70 inline-flex items-center gap-1">
                                                    {isOpen ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />} Precio distinto por sucursal{customCount > 0 ? ` (${customCount})` : ''}
                                                </button>
                                            )}
                                            {isOpen && (
                                                <div className="space-y-1">
                                                    {branches.map(b => (
                                                        <div key={b.id} className="flex items-center justify-between gap-2">
                                                            <span className="text-sm truncate">{b.name}</span>
                                                            <label className="input input-xs input-bordered flex items-center gap-1 w-24">
                                                                <span className="opacity-50">$</span>
                                                                <input type="number" inputMode="decimal" className="w-full"
                                                                    placeholder={String(row.price || 0)}
                                                                    value={row.branchPrices?.[b.id] ?? ''}
                                                                    onChange={e => setBranchPrice(index, b.id, e.target.value)} />
                                                            </label>
                                                        </div>
                                                    ))}
                                                    <p className="text-[10px] opacity-60">En blanco = usa el precio general.</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {isVariant && (
                                    <button onClick={addSize} className="btn btn-sm btn-ghost w-full border border-dashed border-base-300">+ Agregar tamaño</button>
                                )}
                            </div>
                        </section>

                        {/* INVENTARIO */}
                        <section className="space-y-2">
                            <h3 className="font-bold">¿Qué insumos gasta?</h3>
                            <p className="text-[11px] opacity-60">Se descuentan del inventario de la sucursal en cada venta (ej. 1 pza de Coca-Cola, 250 ml de leche). Los de cada opción se capturan en "Opciones".</p>
                            {rows.map((row, index) => (
                                <div key={index} className="space-y-1">
                                    {isVariant && <p className="text-xs font-bold opacity-70">{row.name || `Tamaño ${index + 1}`}</p>}
                                    <RecipeEditor recipe={row.recipe} supplies={supplies}
                                        onChange={recipe => updatePriceRow(index, { recipe })} />
                                </div>
                            ))}
                        </section>

                        {/* 4. PREGUNTAS AL CLIENTE */}
                        <section className="space-y-2">
                            <h3 className="font-bold">¿Qué se le pregunta al cliente?</h3>
                            <div className="flex flex-wrap gap-2">
                                {modGroups.map(mg => {
                                    const isSelected = item.modifierGroups?.includes(mg.id);
                                    return (
                                        <button key={mg.id} onClick={() => toggleModGroup(mg.id)}
                                            className={`btn btn-sm h-auto py-1 ${isSelected ? 'btn-primary' : 'btn-outline border-base-300'}`}>
                                            <span className="flex flex-col items-start leading-tight">
                                                <span className="inline-flex items-center gap-1">{isSelected ? <Check size={12} className="shrink-0" /> : <Plus size={12} className="shrink-0" />}{mg.name}</span>
                                                <span className="text-[9px] font-normal opacity-70">
                                                    {isExclusiveGroup(mg.id, modGroups) ? 'elige una' : 'varias'}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {!newList ? (
                                <button onClick={() => setNewList(emptyNewList())} className="btn btn-sm btn-ghost w-full border border-dashed border-base-300">
                                    + Nueva lista (ej. Sabores)
                                </button>
                            ) : (
                                <div className="bg-info/5 border border-info/30 rounded-xl p-3 space-y-3">
                                    <input type="text" className="input input-sm input-bordered w-full font-bold" placeholder="Nombre de la lista (ej. Sabor)"
                                        value={newList.name} onChange={e => setNewList({ ...newList, name: e.target.value })} autoFocus />

                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" className="checkbox checkbox-sm checkbox-info" checked={newList.isExclusive}
                                            onChange={e => setNewList({ ...newList, isExclusive: e.target.checked })} />
                                        Elegir solo una (obligatorio)
                                    </label>

                                    <div className="space-y-2">
                                        {newList.options.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input type="text" className="input input-sm input-bordered flex-1 min-w-0" placeholder={`Opción ${index + 1}`}
                                                    value={option.name} onChange={e => updateNewListOption(index, { name: e.target.value })} />
                                                <label className="input input-sm input-bordered flex items-center gap-1 w-24">
                                                    <span className="opacity-50">+$</span>
                                                    <input type="number" inputMode="decimal" className="w-full" placeholder="0"
                                                        value={option.price} onChange={e => updateNewListOption(index, { price: e.target.value })} />
                                                </label>
                                                {newList.options.length > 1 && (
                                                    <button onClick={() => setNewList({ ...newList, options: newList.options.filter((_, i) => i !== index) })}
                                                        className="btn btn-square btn-ghost btn-xs text-error"><X size={14} className="shrink-0" /></button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => setNewList({ ...newList, options: [...newList.options, { name: '', price: '' }] })}
                                            className="btn btn-xs btn-ghost">+ otra opción</button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => setNewList(null)} className="btn btn-sm btn-ghost flex-1">Cancelar</button>
                                        <button onClick={handleCreateList} disabled={isSaving} className="btn btn-sm btn-info text-white flex-[2]">Crear lista</button>
                                    </div>
                                    <p className="text-[10px] opacity-60">Precio en blanco = gratis. Inventario y precios por sucursal se ajustan después en "Opciones".</p>
                                </div>
                            )}
                        </section>

                        {/* 5. DISPONIBILIDAD */}
                        {branches.length > 0 && (
                            <section className="space-y-2">
                                <h3 className="font-bold">¿Dónde se vende?</h3>
                                {branches.map(b => {
                                    const isDisabled = item.disabledIn?.includes(b.id);
                                    return (
                                        <label key={b.id} className="flex items-center justify-between bg-base-200/50 p-3 rounded-lg border border-base-300 cursor-pointer">
                                            <span className="font-medium">{b.name}</span>
                                            <span className="flex items-center gap-2">
                                                <span className={`text-xs ${isDisabled ? 'opacity-50' : 'text-success font-bold'}`}>
                                                    {isDisabled ? 'Oculto' : 'Visible'}
                                                </span>
                                                <input type="checkbox" className="toggle toggle-sm toggle-success" checked={!isDisabled} onChange={() => toggleBranch(b.id)} />
                                            </span>
                                        </label>
                                    );
                                })}
                            </section>
                        )}

                        {/* 6. VISTA PREVIA */}
                        <section className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
                            <span className="font-bold">Así lo vende el cajero: </span>
                            {previewSteps.length === 0
                                ? 'se agrega directo al ticket.'
                                : previewSteps.join(' → ')}
                        </section>
                    </div>

                    {/* Footer / Botones */}
                    <div className="p-3 border-t border-base-200 bg-base-200/50 flex gap-2">
                        {item.id && (
                            <button onClick={() => handleDelete(item)} className="btn btn-ghost text-error"><Trash size={16} className="shrink-0" /></button>
                        )}
                        <button onClick={() => setDraft(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex-[2] shadow-lg shadow-primary/30">
                            {isSaving ? 'Guardando...' : <><Save size={16} className="shrink-0" /> Guardar</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    return (
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-base-200/50 p-4 rounded-xl border border-base-300">
              <div>
                  <h3 className="text-xl font-bold">Productos</h3>
                  <p className="text-xs opacity-70">Precios, categoría y disponibilidad por sucursal. Incluye lo que se arma por ingredientes (crepas, waffles, hot cakes).</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={openNewBuild} className="btn btn-outline btn-sm flex-1 sm:flex-none">+ Se arma</button>
                  <button onClick={openNewItem} className="btn btn-primary btn-sm flex-1 sm:flex-none">+ Nuevo Producto</button>
              </div>
          </div>

          {/* Buscador y filtro */}
          <div className="flex flex-col sm:flex-row gap-2">
              <input type="search" className="input input-bordered input-sm flex-1" placeholder="Buscar producto..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              <select className="select select-bordered select-sm" value={folderFilter} onChange={e => setFolderFilter(e.target.value)}>
                  <option value="all">Todas las categorías</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{folderName(f)}</option>)}
                  <option value="none">Sin categoría ({orphanCount})</option>
              </select>
          </div>

          {orphanCount > 0 && folderFilter !== 'none' && (
              <button onClick={() => setFolderFilter('none')} className="alert alert-warning py-2 text-xs sm:text-sm text-left">
                  <TriangleAlert size={16} className="shrink-0" />
                  <span>{orphanCount} producto{orphanCount === 1 ? '' : 's'} sin categoría no aparece{orphanCount === 1 ? '' : 'n'} en el POS. Toca para verlos.</span>
              </button>
          )}

          {/* Listado Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredEntries.map(entry => {
                  if (entry.kind === 'build') {
                      const group = entry.group;
                      const rule = ruleById(group.rules_ref);
                      const fromPrice = getRuleBasePrice(rule, 1);
                      return (
                          <button key={`build_${group.id}`} onClick={() => setBuildDraft(clone(group))}
                              className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-left">
                              <div className="card-body p-4 gap-1">
                                  <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-bold text-base leading-tight">{group.name}</h4>
                                      <span className="text-lg font-black text-primary whitespace-nowrap">
                                          {fromPrice.error ? <span className="text-xs text-error">{fromPrice.error}</span> : <><span className="text-xs font-normal opacity-60">desde </span>${fromPrice.price}</>}
                                      </span>
                                  </div>
                                  <p className="text-xs opacity-60 truncate">{parentName(group.parent)}</p>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                      <span className="badge badge-xs badge-secondary gap-1"><Layers size={10} className="shrink-0" />Se arma</span>
                                      <span className="badge badge-xs badge-ghost truncate max-w-full">{rule?.name || 'Sin regla'}</span>
                                  </div>
                              </div>
                          </button>
                      );
                  }
                  const item = entry.item;
                  const itemFolders = foldersByItem.get(item.id) || [];
                  const prices = getPriceRows(item).map(r => r.price || 0);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  return (
                      <button key={item.id} onClick={() => openEditItem(item)}
                          className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-left">
                          <div className="card-body p-4 gap-1">
                              <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-base leading-tight">{item.name}</h4>
                                  <span className="text-lg font-black text-primary whitespace-nowrap">
                                      ${minPrice}{maxPrice !== minPrice ? `–${maxPrice}` : ''}
                                  </span>
                              </div>

                              <p className="text-xs opacity-60 truncate">
                                  {itemFolders.length > 0
                                      ? itemFolders.map(folderName).join(', ')
                                      : <span className="text-warning font-bold inline-flex items-center gap-1"><TriangleAlert size={12} className="shrink-0" /> No aparece en el POS</span>}
                              </p>

                              {/* Indicadores de Sucursal rápidos */}
                              {branches.length > 1 && (
                                  <div className="flex gap-1 mt-1">
                                      {branches.map(b => {
                                          const isOff = item.disabledIn?.includes(b.id);
                                          return (
                                              <span key={b.id} className={`badge badge-xs ${isOff ? 'badge-ghost opacity-30' : 'badge-success text-white'}`}>
                                                  {b.name.substring(0, 3)}
                                              </span>
                                          );
                                      })}
                                  </div>
                              )}
                          </div>
                      </button>
                  );
              })}
              {filteredEntries.length === 0 && (
                  <p className="col-span-full text-center opacity-60 py-10">No hay productos con ese filtro.</p>
              )}
          </div>

          {renderEditModal()}
          {renderBuildModal()}
      </div>
  );
};
