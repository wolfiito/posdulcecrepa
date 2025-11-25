// src/components/UsersScreen.tsx
import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import type { User, UserRole } from '../store/useAuthStore';

export const UsersScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>('CAJERO');

  const loadUsers = () => {
    setLoading(true);
    userService.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin || pin.length < 4) return alert("Completa los datos correctamente.");

    setIsSubmitting(true);
    try {
      await userService.createUser(name, pin, role);
      setName('');
      setPin('');
      setRole('CAJERO'); // Reset a default
      alert("Empleado creado con éxito");
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Error al crear usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${userName}?`)) return;
    try {
      await userService.deleteUser(id);
      loadUsers();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-primary">
        <span>👥</span> Gestión de Personal
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: FORMULARIO DE ALTA */}
        <div className="card bg-base-100 shadow-lg border border-base-200 h-fit">
          <div className="card-body p-5">
            <h3 className="card-title text-sm uppercase opacity-70 mb-2">Nuevo Empleado</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold">Nombre</span></label>
                <input 
                  type="text" 
                  className="input input-bordered input-sm w-full" 
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold">PIN de Acceso</span></label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength={4}
                  className="input input-bordered input-sm w-full font-mono tracking-widest" 
                  placeholder="0000"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                />
                <span className="label-text-alt text-xs opacity-60 mt-1">Solo 4 dígitos numéricos</span>
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold">Rol / Permisos</span></label>
                <select 
                  className="select select-bordered select-sm w-full" 
                  value={role} 
                  onChange={e => setRole(e.target.value as UserRole)}
                >
                  <option value="MESERO">Mesero (Toma Orden / Envía)</option>
                  <option value="CAJERO">Cajero (Solo Venta)</option>
                  <option value="GERENTE">Gerente (Caja y Gastos)</option>
                  <option value="ADMIN">Admin (Reportes Totales)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || name.length < 3 || pin.length < 4} 
                className="btn btn-primary btn-block mt-2 text-white"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA 2: LISTA DE EMPLEADOS */}
        <div className="md:col-span-2">
          <div className="bg-base-100 rounded-box shadow-sm border border-base-200 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center"><span className="loading loading-spinner"></span></div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center opacity-50 italic">No hay empleados registrados.</div>
            ) : (
              <table className="table table-zebra w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>PIN</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="font-bold">{user.name}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          user.role === 'ADMIN' ? 'badge-primary' : 
                          user.role === 'GERENTE' ? 'badge-secondary' : 'badge-ghost'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="font-mono opacity-50">****</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(user.id, user.name)}
                          className="btn btn-ghost btn-xs text-error"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};