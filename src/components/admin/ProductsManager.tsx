// src/components/admin/ProductsManager.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../../firebase';
import type { MenuItem, FixedPriceItem } from '../../types/menu';
import { TableRowSkeleton } from '../../components/Skeletons';

export const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  // Estado para los grupos disponibles (leídos de la BD)
  const [availableGroups, setAvailableGroups] = useState<{id: string, name: string}[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado del Formulario
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Datos del ítem
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [modifierGroups, setModifierGroups] = useState<string[]>([]);
  
  // Lógica de Precios
  const [hasVariants, setHasVariants] = useState(false);
  const [price, setPrice] = useState<number>(0); 
  const [variants, setVariants] = useState<{name: string, price: number}[]>([{name: '', price: 0}]); 

  // --- CARGA DE DATOS ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Productos
      const itemsSnap = await getDocs(collection(db, 'menu_items'));
      const itemsData = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
      setProducts(itemsData.sort((a, b) => a.name.localeCompare(b.name)));

      // 2. Cargar Grupos de Opciones (Dinámicos)
      const groupsSnap = await getDocs(collection(db, 'modifier_groups'));
      const groupsData = groupsSnap.docs.map(d => ({ 
          id: d.id, 
          name: d.data().name || d.id 
      }));
      setAvailableGroups(groupsData);

    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJADORES DEL FORMULARIO ---
  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('');
    setDescription('');
    setModifierGroups([]);
    setHasVariants(false);
    setPrice(0);
    setVariants([{name: '', price: 0}]);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setModifierGroups(item.modifierGroups || []);

    if ('variants' in item) {
      setHasVariants(true);
      setVariants(item.variants);
      setPrice(0);
    } else {
      setHasVariants(false);
      setPrice(item.price);
      setVariants([{name: '', price: 0}]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const commonData = { name, category, description, modifierGroups };

    let itemData: any;
    if (hasVariants) {
      const validVariants = variants.filter(v => v.name.trim() !== '');
      if (validVariants.length === 0) {
        toast.error("Agrega al menos una variante válida."); 
        setSubmitting(false);
        return;
      }
      itemData = { ...commonData, variants: validVariants };
    } else {
      itemData = { ...commonData, price };
    }

    const savePromise = async () => {
      if (editingId) {
        await updateDoc(doc(db, 'menu_items', editingId), itemData);
        setProducts(prev => prev.map(p => p.id === editingId ? { ...itemData, id: editingId } : p));
      } else {
        const docRef = await addDoc(collection(db, 'menu_items'), itemData);
        setProducts(prev => [...prev, { ...itemData, id: docRef.id }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      handleResetForm();
    }; 

    toast.promise(savePromise(), {
      loading: editingId ? 'Actualizando producto...' : 'Creando producto...',
      success: '¡Producto guardado exitosamente!',
      error: 'Error al guardar el producto',
    });
    
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    toast("¿Eliminar este producto permanentemente?", {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
              await deleteDoc(doc(db, 'menu_items', id));
              setProducts(prev => prev.filter(p => p.id !== id));
              toast.success("Producto eliminado");
          } catch (error) {
              toast.error("Error al eliminar");
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}, // <--- CORRECCIÓN AQUÍ: onClick vacío obligatorio
      },
      duration: 5000, 
    });
  };

  // Helpers
  const addVariantRow = () => setVariants([...variants, { name: '', price: 0 }]);
  const updateVariant = (index: number, field: 'name' | 'price', value: any) => {
    const newVars = [...variants];
    newVars[index] = { ...newVars[index], [field]: value };
    setVariants(newVars);
  };
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));
  
  const toggleGroup = (groupId: string) => {
    setModifierGroups(prev => prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
      
      {/* --- PANEL IZQUIERDO: FORMULARIO --- */}
      <div className="card bg-base-200 h-full overflow-y-auto shadow-inner border border-base-300">
        <div className="card-body p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg">{editingId ? '✏️ Editando' : '✨ Nuevo Producto'}</h3>
            {editingId && <button onClick={handleResetForm} className="btn btn-xs btn-ghost">Cancelar</button>}
          </div>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            
            <div className="form-control">
              <label className="label-text text-xs font-bold mb-1">Nombre del Producto</label>
              <input type="text" className="input input-sm input-bordered w-full font-bold" required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Soda Italiana" />
            </div>

            <div className="form-control">
              <label className="label-text text-xs font-bold mb-1">Categoría (Ticket)</label>
              <input type="text" className="input input-sm input-bordered w-full" required value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej. Bebidas" />
            </div>

            <div className="form-control">
              <label className="label-text text-xs font-bold mb-1">Descripción</label>
              <textarea className="textarea textarea-sm textarea-bordered w-full" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles opcionales..." />
            </div>

            <div className="divider my-1"></div>

            {/* PRECIO FIJO O VARIANTES */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4 bg-base-100 p-2 rounded-lg border border-base-300">
                <span className="label-text font-bold">¿Tiene tamaños diferentes?</span> 
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
              </label>
            </div>

            {!hasVariants ? (
              <div className="form-control animate-fade-in">
                <label className="label-text text-xs font-bold mb-1">Precio Fijo ($)</label>
                <input type="number" className="input input-bordered w-full font-mono text-lg font-bold text-primary" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} />
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in bg-base-100 p-2 rounded-box border border-base-300">
                <label className="label-text text-xs font-bold block mb-1">Lista de Tamaños</label>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" placeholder="Ej. Chico" className="input input-xs input-bordered flex-1" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} />
                    <input type="number" placeholder="$0" className="input input-xs input-bordered w-20 font-mono" value={v.price} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)} />
                    <button type="button" onClick={() => removeVariant(idx)} className="btn btn-xs btn-square btn-ghost text-error">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addVariantRow} className="btn btn-xs btn-outline btn-block border-dashed border-base-300">+ Agregar Tamaño</button>
              </div>
            )}

            <div className="divider my-1"></div>

            {/* GRUPOS DINÁMICOS */}
            <div className="form-control">
              <label className="label-text text-xs font-bold mb-2">
                  Grupos de Ingredientes (Modifiers)
                  <span className="block font-normal text-[10px] opacity-60">Selecciona qué opciones salen al vender este producto</span>
              </label>
              
              <div className="h-40 overflow-y-auto border border-base-300 rounded-box p-2 bg-base-100 grid grid-cols-1 gap-1">
                {availableGroups.length === 0 && <p className="text-xs opacity-50 p-2 text-center">No hay grupos creados.<br/>Ve a la pestaña "Eq Grupos Opc."</p>}
                
                {availableGroups.map(g => (
                  <label key={g.id} className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded p-1 py-0 border border-transparent hover:border-base-300 transition-colors">
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-xs checkbox-primary" 
                      checked={modifierGroups.includes(g.id)} 
                      onChange={() => toggleGroup(g.id)}
                    />
                    <div className="flex flex-col">
                        <span className="label-text text-xs font-bold">{g.name}</span>
                        <span className="label-text text-[9px] opacity-40 font-mono">{g.id}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary btn-block shadow-lg mt-4">
              {submitting ? <span className="loading loading-spinner"></span> : (editingId ? 'Guardar Cambios' : 'Crear Producto')}
            </button>
          </form>
        </div>
      </div>

      {/* --- PANEL DERECHO: LISTA CON SKELETONS --- */}
      <div className="lg:col-span-2 bg-base-100 rounded-box border border-base-200 flex flex-col overflow-hidden shadow-sm h-full">
        {/* Header simple */}
        <div className="p-3 border-b border-base-200 bg-base-100 flex justify-between items-center">
            <span className="text-xs font-bold opacity-50 uppercase">{products.length} Productos registrados</span>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <table className="table table-sm table-pin-rows w-full">
            <thead className="bg-base-200 text-xs uppercase">
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th className="text-right">Precio</th>
                <th className="text-center w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => <TableRowSkeleton key={i} />)
              ) : (
                products.map(p => {
                  const isVar = 'variants' in p;
                  return (
                    <tr key={p.id} className="hover group transition-colors">
                      <td>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] opacity-50">{p.category}</div>
                        {p.modifierGroups && p.modifierGroups.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {p.modifierGroups.map(gid => {
                                    const groupName = availableGroups.find(ag => ag.id === gid)?.name || gid;
                                    return <span key={gid} className="badge badge-xs badge-ghost text-[9px] border-base-300">{groupName}</span>;
                                })}
                            </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-xs ${isVar ? 'badge-secondary' : 'badge-neutral'}`}>
                          {isVar ? 'Variantes' : 'Fijo'}
                        </span>
                      </td>
                      <td className="text-right font-mono font-bold text-success">
                        {isVar 
                          ? `${p.variants.length} tam.` 
                          : `$${(p as FixedPriceItem).price.toFixed(2)}`
                        }
                      </td>
                      <td className="text-center">
                        <div className="join">
                          <button onClick={() => handleEdit(p)} className="btn btn-xs join-item btn-ghost text-primary">✏️</button>
                          <button onClick={() => handleDelete(p.id)} className="btn btn-xs join-item btn-ghost text-error">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {!loading && products.length === 0 && (
            <div className="text-center p-10 opacity-50 text-sm">No hay productos. ¡Crea uno a la izquierda!</div>
          )}
        </div>
      </div>
    </div>
  );
};