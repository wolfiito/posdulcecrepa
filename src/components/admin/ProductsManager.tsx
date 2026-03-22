// src/components/admin/ProductsManager.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import type { MenuItem, VariantPriceItem, FixedPriceItem } from '../../types/menu';

// Tipos auxiliares para el panel
interface Branch { id: string; name: string; }
interface ModGroup { id: string; name: string; }

export const ProductsManager: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [modGroups, setModGroups] = useState<ModGroup[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estado del modal de edición
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Cargamos productos, sucursales (para la tabla dinámica) y grupos de modificadores
            const [itemsSnap, branchesSnap, modGroupsSnap] = await Promise.all([
                getDocs(collection(db, 'menu_items')),
                getDocs(collection(db, 'branches')),
                getDocs(collection(db, 'modifier_groups'))
            ]);

            setItems(itemsSnap.docs.map(d => d.data() as MenuItem));
            setBranches(branchesSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
            setModGroups(modGroupsSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
        } catch (error) {
            toast.error("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    };

    // --- MANEJO DEL FORMULARIO ---
    const handleSave = async () => {
        if (!editingItem || !editingItem.name) return toast.error("El nombre es obligatorio");
        setIsSaving(true);
        try {
            const idToSave = editingItem.id || `item_${Date.now()}`;
            const itemToSave = { ...editingItem, id: idToSave };
            await setDoc(doc(db, 'menu_items', idToSave), itemToSave);
            toast.success("Producto guardado correctamente");
            setEditingItem(null);
            fetchData();
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
        try {
            await deleteDoc(doc(db, 'menu_items', id));
            toast.success("Producto eliminado");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const openNewItem = (type: 'FIXED' | 'VARIANT') => {
        if (type === 'FIXED') {
            setEditingItem({ id: '', name: '', category: 'bebidas', price: 0, disabledIn: [], branchPrices: {}, modifierGroups: [] } as FixedPriceItem);
        } else {
            setEditingItem({ id: '', name: '', category: 'bebidas', variants: [{ name: 'Sencillo', price: 0, branchPrices: {} }], disabledIn: [], modifierGroups: [] } as VariantPriceItem);
        }
    };

    // --- RENDERIZADO DEL MODAL ---
    const renderEditModal = () => {
        if (!editingItem) return null;
        const isVariant = 'variants' in editingItem;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-base-100 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-base-200 bg-base-200/50">
                        <h2 className="text-2xl font-black text-primary">
                            {editingItem.id ? '✏️ Editar Producto' : '✨ Nuevo Producto'}
                        </h2>
                    </div>

                    {/* Cuerpo Scrollable */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-8">
                        
                        {/* 1. DATOS BÁSICOS */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold border-b border-base-300 pb-2">1. Datos Básicos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Nombre del Producto</span></label>
                                    <input type="text" className="input input-bordered" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Ej. Capuchino" />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold">Categoría (Para reportes)</span></label>
                                    <select className="select select-bordered" value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}>
                                        <option value="bebidas">Bebidas</option>
                                        <option value="crepas">Crepas</option>
                                        <option value="postres">Postres</option>
                                        <option value="otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* 2. OPCIONES / MODIFICADORES (Leches, Sabores, Toppings) */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold border-b border-base-300 pb-2">2. Opciones de Armado (Checklist)</h3>
                            <p className="text-xs opacity-70">Selecciona qué opciones se le deben preguntar al cliente al vender esto:</p>
                            <div className="flex flex-wrap gap-2">
                                {modGroups.map(mg => {
                                    const isSelected = editingItem.modifierGroups?.includes(mg.id);
                                    return (
                                        <button key={mg.id} onClick={() => {
                                                const current = editingItem.modifierGroups || [];
                                                const updated = isSelected ? current.filter(id => id !== mg.id) : [...current, mg.id];
                                                setEditingItem({ ...editingItem, modifierGroups: updated });
                                            }}
                                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline border-base-300'}`}
                                        >
                                            {isSelected ? '✓ ' : '+ '} {mg.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        {/* 3. MATRIZ DE PRECIOS Y SUCURSALES (¡La magia visual!) */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold border-b border-base-300 pb-2">3. Precios y Sucursales</h3>
                            <div className="overflow-x-auto bg-base-200/30 rounded-xl border border-base-300">
                                <table className="table w-full">
                                    <thead className="bg-base-200">
                                        <tr>
                                            <th>Variante / Tamaño</th>
                                            <th>Precio Global</th>
                                            {branches.map(b => <th key={b.id} className="text-center text-primary">{b.name}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* SI ES PRECIO FIJO */}
                                        {!isVariant && (
                                            <tr>
                                                <td className="font-bold">Único</td>
                                                <td>
                                                    <input type="number" className="input input-sm input-bordered w-24 font-bold" value={(editingItem as FixedPriceItem).price || 0} onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })} />
                                                </td>
                                                {branches.map(b => {
                                                    const item = editingItem as FixedPriceItem;
                                                    const isDisabled = item.disabledIn?.includes(b.id);
                                                    const customPrice = item.branchPrices?.[b.id] ?? '';
                                                    return (
                                                        <td key={b.id} className="text-center bg-base-100/50 border-l border-base-200">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                                                    <input type="checkbox" className="toggle toggle-sm toggle-success" checked={!isDisabled} onChange={() => {
                                                                        const curr = item.disabledIn || [];
                                                                        setEditingItem({ ...item, disabledIn: isDisabled ? curr.filter(id => id !== b.id) : [...curr, b.id] });
                                                                    }} />
                                                                    {isDisabled ? 'Oculto' : 'Visible'}
                                                                </label>
                                                                {!isDisabled && (
                                                                    <div className="tooltip tooltip-bottom" data-tip="Deja en blanco para usar Precio Global">
                                                                        <input type="number" placeholder="Ej. 75" className="input input-xs input-bordered w-20 text-center" value={customPrice} onChange={e => {
                                                                            const newPrices = { ...(item.branchPrices || {}) };
                                                                            if (e.target.value === '') delete newPrices[b.id];
                                                                            else newPrices[b.id] = Number(e.target.value);
                                                                            setEditingItem({ ...item, branchPrices: newPrices });
                                                                        }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )}

                                        {/* SI TIENE VARIANTES (TAMAÑOS) */}
                                        {isVariant && (editingItem as VariantPriceItem).variants.map((v, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <input type="text" className="input input-sm input-bordered w-full font-bold" value={v.name} onChange={e => {
                                                        const newVariants = [...(editingItem as VariantPriceItem).variants];
                                                        newVariants[index].name = e.target.value;
                                                        setEditingItem({ ...editingItem, variants: newVariants } as VariantPriceItem);
                                                    }} />
                                                </td>
                                                <td>
                                                    <input type="number" className="input input-sm input-bordered w-24 font-bold" value={v.price || 0} onChange={e => {
                                                        const newVariants = [...(editingItem as VariantPriceItem).variants];
                                                        newVariants[index].price = Number(e.target.value);
                                                        setEditingItem({ ...editingItem, variants: newVariants } as VariantPriceItem);
                                                    }} />
                                                </td>
                                                {branches.map(b => {
                                                    const customPrice = v.branchPrices?.[b.id] ?? '';
                                                    return (
                                                        <td key={b.id} className="text-center bg-base-100/50 border-l border-base-200">
                                                            <div className="tooltip tooltip-bottom" data-tip="Precio especial sucursal">
                                                                <input type="number" placeholder="Global" className="input input-xs input-bordered w-20 text-center" value={customPrice} onChange={e => {
                                                                    const newVariants = [...(editingItem as VariantPriceItem).variants];
                                                                    const newPrices = { ...(v.branchPrices || {}) };
                                                                    if (e.target.value === '') delete newPrices[b.id];
                                                                    else newPrices[b.id] = Number(e.target.value);
                                                                    newVariants[index].branchPrices = newPrices;
                                                                    setEditingItem({ ...editingItem, variants: newVariants } as VariantPriceItem);
                                                                }} />
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {isVariant && (
                                    <div className="p-2 border-t border-base-300">
                                        <button onClick={() => {
                                            const newVariants = [...(editingItem as VariantPriceItem).variants, { name: 'Nuevo Tamaño', price: 0, branchPrices: {} }];
                                            setEditingItem({ ...editingItem, variants: newVariants } as VariantPriceItem);
                                        }} className="btn btn-sm btn-ghost w-full">+ Agregar variante / tamaño</button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer / Botones */}
                    <div className="p-4 border-t border-base-200 bg-base-200/50 flex justify-end gap-3">
                        <button onClick={() => setEditingItem(null)} className="btn btn-ghost">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary px-8 shadow-lg shadow-primary/30">
                            {isSaving ? 'Guardando...' : '💾 Guardar Producto'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    return (
      <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-200/50 p-4 rounded-xl border border-base-300">
              <div>
                  <h3 className="text-xl font-bold">Gestor de Productos</h3>
                  <p className="text-xs opacity-70">Precios y disponibilidad por sucursal.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => openNewItem('FIXED')} className="btn btn-primary btn-sm flex-1 sm:flex-none">+ Fijo</button>
                  <button onClick={() => openNewItem('VARIANT')} className="btn btn-secondary btn-sm flex-1 sm:flex-none">+ Tamaños</button>
              </div>
          </div>

          {/* Listado Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(item => (
                  <div key={item.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all">
                      <div className="card-body p-4">
                          <div className="flex justify-between items-start">
                              <h4 className="font-bold text-base leading-tight pr-2">{item.name}</h4>
                              <span className="badge badge-outline badge-xs opacity-50 uppercase">{item.category}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                              <span className="text-xl font-black text-primary">
                                  ${'variants' in item ? item.variants[0]?.price : item.price}
                              </span>
                              {'variants' in item && <span className="text-[10px] opacity-50">(Precio base)</span>}
                          </div>

                          {/* Indicadores de Sucursal rápidos */}
                          <div className="flex gap-2 mt-3">
                              {branches.map(b => {
                                  const isOff = item.disabledIn?.includes(b.id);
                                  return (
                                      <div key={b.id} className={`badge badge-xs ${isOff ? 'badge-ghost opacity-30' : 'badge-success text-white'}`}>
                                          {b.name.substring(0,3)}
                                      </div>
                                  );
                              })}
                          </div>

                          <div className="flex justify-between mt-4 pt-3 border-t border-base-200">
                              <button onClick={() => setEditingItem(item)} className="btn btn-sm btn-ghost text-primary flex-1">✏️ Editar</button>
                              <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-ghost text-error">🗑️</button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
          {/* El Modal ya es responsive por naturaleza al usar flex-col y overflow-y-auto */}
          {renderEditModal()}
      </div>
  );
};