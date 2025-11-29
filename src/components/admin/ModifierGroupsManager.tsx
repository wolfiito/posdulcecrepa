import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, deleteDoc, setDoc } from '../../firebase';

// Interfaz local para los grupos
interface ModifierGroupDef {
  id: string;   // ej. "soda_sabores"
  name: string; // ej. "Sabores de Soda"
}

export const ModifierGroupsManager: React.FC = () => {
  const [groups, setGroups] = useState<ModifierGroupDef[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Formulario
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'modifier_groups'));
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as ModifierGroupDef)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) return;
    
    // Normalizar ID (sin espacios, minúsculas) para evitar errores
    const cleanId = isEditing ? id : id.toLowerCase().replace(/\s+/g, '_');

    try {
      // Usamos setDoc para poder definir el ID manualmente (ej. "soda_sabores")
      await setDoc(doc(db, 'modifier_groups', cleanId), { name });
      alert("Grupo guardado");
      setId(''); 
      setName(''); 
      setIsEditing(false);
      loadData();
    } catch (e) { 
      console.error(e);
      alert("Error al guardar"); 
    }
  };

  const handleDelete = async (groupId: string) => {
    if(!confirm("¿Borrar grupo? Los ingredientes que usen este grupo quedarán huérfanos.")) return;
    try {
        await deleteDoc(doc(db, 'modifier_groups', groupId));
        loadData();
    } catch(e) {
        alert("Error al eliminar");
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Formulario */}
      <div className="card bg-base-200 h-fit p-4 shadow-sm border border-base-300">
        <h3 className="font-bold mb-2">{isEditing ? 'Editar Nombre' : 'Nuevo Grupo de Opciones'}</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="label-text text-xs font-bold">ID Interno</label>
            <input 
              className="input input-sm input-bordered w-full font-mono text-xs" 
              value={id} 
              onChange={e => setId(e.target.value)} 
              placeholder="ej. sabores_soda"
              disabled={isEditing} // El ID no se edita una vez creado
              required 
            />
            {!isEditing && <span className="text-[10px] opacity-50 block mt-1">Sin espacios (ej. leche_opciones)</span>}
          </div>
          <div>
            <label className="label-text text-xs font-bold">Nombre Visible</label>
            <input 
              className="input input-sm input-bordered w-full" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="ej. Sabores de Soda"
              required 
            />
          </div>
          <button className="btn btn-sm btn-primary btn-block mt-2 shadow-md">{isEditing ? 'Actualizar' : 'Crear'}</button>
          {isEditing && <button type="button" onClick={() => {setIsEditing(false); setId(''); setName('')}} className="btn btn-xs btn-ghost btn-block">Cancelar</button>}
        </form>
      </div>

      {/* Lista */}
      <div className="md:col-span-2 bg-base-100 rounded-box border border-base-200 overflow-hidden shadow-sm h-[500px] overflow-y-auto">
        <table className="table table-sm table-pin-rows">
          <thead className="bg-base-200">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && !loading && (
                <tr><td colSpan={3} className="text-center opacity-50 py-10">No hay grupos creados.</td></tr>
            )}
            {groups.map(g => (
              <tr key={g.id} className="hover">
                <td className="font-mono text-xs">{g.id}</td>
                <td className="font-bold">{g.name}</td>
                <td className="text-right">
                  <div className="join">
                    <button onClick={() => {setId(g.id); setName(g.name); setIsEditing(true)}} className="btn btn-xs join-item btn-ghost">✏️</button>
                    <button onClick={() => handleDelete(g.id)} className="btn btn-xs join-item btn-ghost text-error">🗑️</button>
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