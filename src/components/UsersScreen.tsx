// src/components/UsersScreen.tsx
import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import type { User, UserRole } from '../types/user';
import { toast } from 'sonner';

export const UsersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CAJERO');

  // Estado del Modal Numpad
  const [numpadConfig, setNumpadConfig] = useState<{
    isOpen: boolean;
    targetField: 'username' | 'password' | null;
    title: string;
  }>({ isOpen: false, targetField: null, title: '' });

  const loadUsers = () => {
    setLoading(true);
    userService.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || username.length !== 6 || password.length !== 6) {
        return toast.warning("Usuario y Contraseña deben tener 6 dígitos exactos");
    }

    setIsSubmitting(true);
    toast.promise(userService.createUser(name, username, password, role), {
      loading: 'Creando usuario...',
        success: () => {
            setName(''); setUsername(''); setPassword(''); setRole('CAJERO');
            loadUsers();
            setIsSubmitting(false);
            return <b>Usuario creado correctamente</b>;
        },
        error: (err) => {
            setIsSubmitting(false);
            return <b>Error: {err.message}</b>;
        }
    });
  };

  const handleDelete = async (id: string, userName: string) => {
      if(!confirm(`¿Eliminar a ${userName}?`)) return;
      await userService.deleteUser(id);
      toast.success("Usuario eliminado");
      loadUsers();
  };

  // Funciones del Numpad
  const openNumpad = (field: 'username' | 'password', title: string) => {
      setNumpadConfig({ isOpen: true, targetField: field, title });
  };

  const handleNumpadInput = (value: string) => {
      if (value.length !== 6) {
          toast.error("Deben ser exactamente 6 dígitos");
          return;
      }
      if (numpadConfig.targetField === 'username') setUsername(value);
      if (numpadConfig.targetField === 'password') setPassword(value);
      setNumpadConfig({ ...numpadConfig, isOpen: false });
  };

  return (
    <div className="p-4 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Gestión de Usuarios</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULARIO */}
        <div className="card bg-base-100 shadow-xl h-fit">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Nuevo Usuario</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              
              <div>
                <label className="label py-1"><span className="label-text">Nombre Completo</span></label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Alejandro Flores" 
                  className="input input-bordered w-full" 
                />
              </div>

              {/* INPUT USUARIO CON NUMPAD */}
              <div onClick={() => openNumpad('username', 'Ingresa ID (6 Dígitos)')}>
                <label className="label py-1"><span className="label-text">Usuario (ID)</span></label>
                <div className="input input-bordered w-full font-mono flex items-center cursor-pointer hover:bg-base-200">
                    {username ? username : <span className="opacity-40">_ _ _ _ _ _</span>}
                </div>
              </div>

              {/* INPUT PASSWORD CON NUMPAD */}
              <div onClick={() => openNumpad('password', 'Asignar Contraseña (6 Dígitos)')}>
                <label className="label py-1"><span className="label-text">Contraseña</span></label>
                <div className="input input-bordered w-full font-mono flex items-center cursor-pointer hover:bg-base-200">
                    {password ? '••••••' : <span className="opacity-40">_ _ _ _ _ _</span>}
                </div>
              </div>

              <div>
                <label className="label py-1"><span className="label-text">Rol</span></label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="select select-bordered w-full"
                >
                  <option value="CAJERO">Cajero</option>
                  <option value="MESERO">Mesero</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full mt-4">
                {isSubmitting ? "Guardando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        </div>

        {/* LISTA */}
        <div className="lg:col-span-2">
          <div className="bg-base-100 rounded-box shadow-xl overflow-hidden">
            {loading ? (
                <div className="p-10 text-center text-base-content/40">Cargando usuarios...</div>
            ) : users.length === 0 ? (
                <div className="p-10 text-center text-base-content/40">No hay usuarios registrados</div>
            ) : (
              <table className="table table-zebra w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th>Nombre</th>
                    <th>ID</th>
                    <th>Rol</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="font-bold">{user.name}</td>
                      <td className="font-mono">{user.username}</td>
                      <td>
                        <span className={`badge badge-sm ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDelete(user.id, user.name)} className="btn btn-ghost btn-xs text-error">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL DE TECLADO 6 DÍGITOS --- */}
      {numpadConfig.isOpen && (
          <NumpadModal 
            title={numpadConfig.title}
            onClose={() => setNumpadConfig({ ...numpadConfig, isOpen: false })}
            onConfirm={handleNumpadInput}
          />
      )}
    </div>
  );
};

// COMPONENTE INTERNO DEL MODAL (LIMITE DE 6)
const NumpadModal = ({ title, onClose, onConfirm }: { title: string, onClose: () => void, onConfirm: (val: string) => void }) => {
    const [val, setVal] = useState('');
    
    // Función para manejar el límite en el modal
    const addNum = (n: string) => {
        if (val.length < 6) setVal(prev => prev + n);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-base-100 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold text-center mb-4">{title}</h3>
                
                {/* VISUALIZADOR 6 ESPACIOS */}
                <div className="bg-base-200 p-4 rounded-xl mb-4 flex items-center justify-center space-x-2 h-20">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`
                            w-8 h-12 flex items-center justify-center rounded-md text-2xl font-mono font-bold
                            ${i < val.length ? 'bg-white text-primary shadow-sm' : 'bg-base-300 text-transparent'}
                        `}>
                            {i < val.length ? val[i] : '_'}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => addNum(n.toString())} className="btn btn-lg btn-outline font-mono text-2xl h-16">{n}</button>
                    ))}
                    <button onClick={() => setVal('')} className="btn btn-lg btn-ghost text-error">C</button>
                    <button onClick={() => addNum('0')} className="btn btn-lg btn-outline font-mono text-2xl">0</button>
                    <button 
                        onClick={() => onConfirm(val)} 
                        disabled={val.length !== 6} // Deshabilitar si no son 6
                        className="btn btn-lg btn-primary text-xl"
                    >
                        OK
                    </button>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-block mt-4">Cancelar</button>
            </div>
        </div>
    );
};