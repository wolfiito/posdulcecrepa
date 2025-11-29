// src/components/admin/ProductsManager.tsx
import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../../firebase';
import type { MenuItem, VariantPriceItem, FixedPriceItem } from '../../types/menu';

// Lista de grupos conocidos para facilitar la selección
// (Podrías mover esto a una constante global si crece mucho)
const KNOWN_MODIFIER_GROUPS = [
  { id: 'leche_opciones', label: '🥛 Tipo de Leche' },
  { id: 'crepa_dulce_base', label: '🥞 Ingredientes Dulces' },
  { id: 'crepa_dulce_extra', label: '🍫 Extras Dulces' },
  { id: 'crepa_salada_base', label: '🧀 Ingredientes Salados' },
  { id: 'crepa_salada_extra', label: '🍗 Extras Salados' },
  { id: 'bebida_topping_general', label: '🥤 Topping Bebidas' },
  { id: 'sabor_tisana', label: '🍵 Sabores Tisana' },
  { id: 'sabor_te', label: '🌿 Sabores Té' },
  { id: 'frappe_sabores', label: '🍧 Sabores Frappé' },
];

export const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<MenuItem[]>([]);
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
  const [price, setPrice] = useState<number>(0); // Para precio fijo
  const [variants, setVariants] = useState<{name: string, price: number}[]>([{name: '', price: 0}]); // Para variantes

  // --- CARGA DE DATOS ---
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'menu_items'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
      // Ordenamos alfabéticamente para facilitar búsqueda
      setProducts(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error cargando productos:", error);
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

    // Construir el objeto a guardar
    const commonData = {
      name,
      category,
      description,
      modifierGroups
    };

    let itemData: any;
    if (hasVariants) {
      // Filtrar variantes vacías
      const validVariants = variants.filter(v => v.name.trim() !== '');
      if (validVariants.length === 0) {
        alert("Debes agregar al menos una variante válida.");
        setSubmitting(false);
        return;
      }
      itemData = { ...commonData, variants: validVariants };
    } else {
      itemData = { ...commonData, price };
    }

    try {
      if (editingId) {
        // Actualizar en Firebase
        await updateDoc(doc(db, 'menu_items', editingId), itemData);
        
        // Actualizar localmente (Optimistic Update)
        setProducts(prev => prev.map(p => p.id === editingId ? { ...itemData, id: editingId } : p));
        alert("Producto actualizado");
      } else {
        // Crear en Firebase
        const docRef = await addDoc(collection(db, 'menu_items'), itemData);
        
        // Agregar localmente
        setProducts(prev => [...prev, { ...itemData, id: docRef.id }].sort((a, b) => a.name.localeCompare(b.name)));
        alert("Producto creado");
      }
      handleResetForm();
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'menu_items', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  // Helpers para Variantes
  const addVariantRow = () => setVariants([...variants, { name: '', price: 0 }]);
  const updateVariant = (index: number, field: 'name' | 'price', value: any) => {
    const newVars = [...variants];
    newVars[index] = { ...newVars[index], [field]: value };
    setVariants(newVars);
  };
  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Toggle de Grupos
  const toggleGroup = (groupId: string) => {
    setModifierGroups(prev => 
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      
      {/* --- PANEL IZQUIERDO: FORMULARIO --- */}
      <div className="card bg-base-200 h-full overflow-y-auto shadow-inner">
        <div className="card-body p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg">{editingId ? '✏️ Editando' : '✨ Nuevo Producto'}</h3>
            {editingId && <button onClick={handleResetForm} className="btn btn-xs btn-ghost">Cancelar</button>}
          </div>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            
            {/* Datos Básicos */}
            <div className="form-control">
              <label className="label-text text-xs font-bold mb-1">Nombre del Producto</label>
              <input type="text" className="input input-sm input-bordered w-full font-bold" required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Crepa Hawaiana" />
            </div>

            <div className="form-control">
              <label className="label-text text-xs font-bold mb-1">Categoría (Etiqueta)</label>
              <input type="text" className="input input-sm input-bordered w-full" required value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej. Crepas Saladas" />
              <span className="text-[10px] opacity-60 mt-1">Texto que aparece en el ticket</span>
            </div>

            <div className="form-control">
              <label className="label-text text-xs font-bold mb-1">Descripción</label>
              <textarea className="textarea textarea-sm textarea-bordered w-full" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ingredientes, detalles..." />
            </div>

            <div className="divider my-1"></div>

            {/* Configuración de Precios */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <span className="label-text font-bold">¿Tiene tamaños/variantes?</span> 
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
              </label>
            </div>

            {!hasVariants ? (
              <div className="form-control animate-fade-in">
                <label className="label-text text-xs font-bold mb-1">Precio Fijo ($)</label>
                <input type="number" className="input input-bordered w-full font-mono text-lg font-bold text-primary" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} />
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in bg-base-100 p-2 rounded-box border border-base-300">
                <label className="label-text text-xs font-bold block mb-1">Lista de Variantes</label>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" placeholder="Ej. Chico" className="input input-xs input-bordered flex-1" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} required />
                    <input type="number" placeholder="$0" className="input input-xs input-bordered w-20 font-mono" value={v.price} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)} required />
                    <button type="button" onClick={() => removeVariant(idx)} className="btn btn-xs btn-square btn-ghost text-error">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addVariantRow} className="btn btn-xs btn-outline btn-block border-dashed">+ Agregar Tamaño</button>
              </div>
            )}

            <div className="divider my-1"></div>

            {/* Grupos de Modificadores */}
            <div className="form-control">
              <label className="label-text text-xs font-bold mb-2">Grupos de Ingredientes (Modifiers)</label>
              <div className="h-40 overflow-y-auto border border-base-300 rounded-box p-2 bg-base-100 grid grid-cols-1 gap-1">
                {KNOWN_MODIFIER_GROUPS.map(g => (
                  <label key={g.id} className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded p-1 py-0">
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-xs checkbox-primary" 
                      checked={modifierGroups.includes(g.id)} 
                      onChange={() => toggleGroup(g.id)}
                    />
                    <span className="label-text text-xs">{g.label}</span>
                  </label>
                ))}
                {/* Opción para agregar manual si falta alguno */}
                <div className="p-1 mt-2">
                   <p className="text-[10px] opacity-50 text-center">¿Falta un grupo? Agregalo en el código.</p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary btn-block shadow-lg mt-4">
              {submitting ? <span className="loading loading-spinner"></span> : (editingId ? 'Guardar Cambios' : 'Crear Producto')}
            </button>
          </form>
        </div>
      </div>

      {/* --- PANEL DERECHO: LISTA --- */}
      <div className="lg:col-span-2 bg-base-100 rounded-box border border-base-200 flex flex-col overflow-hidden shadow-sm h-full">
        {/* Buscador simple */}
        <div className="p-3 border-b border-base-200 bg-base-100">
            <input type="text" placeholder="Buscar producto..." className="input input-sm input-bordered w-full max-w-xs" onChange={(e) => {
                const term = e.target.value.toLowerCase();
                // Filtrado simple en cliente (ya tenemos todo en memoria)
                // Nota: Esto es solo visual, el estado 'products' tiene todo.
                // Para implementar búsqueda real, crea un estado 'searchTerm' y filtra el map de abajo.
            }} />
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="flex justify-center p-10"><span className="loading loading-spinner text-primary"></span></div>
          ) : (
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
                {products.map(p => {
                  const isVar = 'variants' in p;
                  return (
                    <tr key={p.id} className="hover group transition-colors">
                      <td>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] opacity-50">{p.category}</div>
                        {p.modifierGroups && p.modifierGroups.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {p.modifierGroups.map(g => (
                                    <span key={g} className="badge badge-xs badge-ghost text-[9px]">{g}</span>
                                ))}
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
                          <button onClick={() => handleEdit(p)} className="btn btn-xs join-item btn-ghost">✏️</button>
                          <button onClick={() => handleDelete(p.id)} className="btn btn-xs join-item btn-ghost text-error">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};