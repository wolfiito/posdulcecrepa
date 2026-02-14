// src/components/UsersScreen.tsx
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { toast } from 'sonner';

// Servicios y Componentes
import { userService } from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';
import { PinPadModal } from './PinPadModal';

// Tipos
import type { User, UserRole } from '../types/user';
import type { Branch } from '../types/branch';

Modal.setAppElement('#root');

// Configuración de Estilos por Rol
const ROLE_STYLES: Record<UserRole, { label: string, color: string, icon: string }> = {
    ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '' },
    GERENTE: { label: 'Gerente', color: 'bg-pink-100 text-pink-700 border-pink-200', icon: '' },
    CAJERO: { label: 'Cajero', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '' },
    MESERO: { label: 'Mesero', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '' },
};

export const UsersScreen: React.FC = () => {
    const { activeBranchId } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estados de Modales
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPinOpen, setIsPinOpen] = useState(false);
    
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const loadUsers = async () => {
        if (!activeBranchId) return;
        setLoading(true);
        try {
            const data = await userService.getUsers(activeBranchId);
            setUsers(data);
        } catch (error) {
            toast.error("Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    const loadBranches = async () => {
        try {
            const data = await userService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error("Error cargando sucursales", error);
        }
    };

    useEffect(() => {
        loadUsers();
        loadBranches();
    }, [activeBranchId]);

    // --- ELIMINAR (Con PIN de Seguridad) ---
    const requestDelete = (id: string) => {
        setUserToDelete(id);
        setIsPinOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await userService.deleteUser(userToDelete);
            toast.success("Usuario eliminado");
            loadUsers();
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setUserToDelete(null);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-24 px-4">
            <div className="flex items-center gap-3 mb-8 mt-4">
                <h2 className="text-3xl font-black text-base-content flex items-center gap-2">
                    👥 Equipo Local
                    <span className="badge badge-neutral badge-lg text-white font-bold">{users.length}</span>
                </h2>
                {!activeBranchId && <span className="text-error font-bold">(Selecciona una sucursal primero)</span>}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => {
                        const style = ROLE_STYLES[user.role] || ROLE_STYLES['MESERO'];
                        const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        // Buscamos el nombre de la sucursal para mostrarlo
                        const branchName = branches.find(b => b.id === user.branchId)?.name || 'Sucursal desconocida';

                        return (
                            <div key={user.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all group">
                                <div className="card-body p-5 flex-row items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${style.color.split(' ')[0]} ${style.color.split(' ')[1]}`}>
                                        {initials}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg truncate">{user.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`badge badge-sm font-bold border ${style.color} bg-opacity-20`}>
                                                {style.icon} {style.label}
                                            </span>
                                            {/* Badge de Sucursal */}
                                            <span className="badge badge-sm badge-ghost text-xs">
                                                🏢 {branchName}
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-50 font-mono bg-base-200 inline-block px-1 rounded">ID: {user.username}</p>
                                    </div>

                                    <div className="dropdown dropdown-end">
                                        <div tabIndex={0} role="button" className="btn btn-circle btn-ghost btn-sm bg-base-200/50">
                                            ⋮
                                        </div>
                                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-40 border border-base-200">
                                            <li><button onClick={() => handleEdit(user)}>✏️ Editar</button></li>
                                            <li><button onClick={() => requestDelete(user.id)} className="text-error">🗑️ Eliminar</button></li>
                                        </ul>
                                    </div>
                                </div>
                                <div className={`h-1 w-full ${style.color.split(' ')[0]}`}></div>
                            </div>
                        );
                    })}
                </div>
            )}

            <button 
                onClick={handleNew}
                disabled={!activeBranchId} // Deshabilitar si no hay sucursal seleccionada
                className="fixed bottom-6 right-6 btn btn-circle btn-primary btn-lg shadow-xl border-none z-40 w-16 h-16 text-3xl text-white animate-pop-in hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            >
                +
            </button>

            <UserFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                userToEdit={editingUser} 
                onSuccess={loadUsers}
                branches={branches} // Pasamos las sucursales
                defaultBranchId={activeBranchId || ''} // Sugerimos la actual
            />

            <PinPadModal 
                isOpen={isPinOpen} 
                onClose={() => setIsPinOpen(false)} 
                onSuccess={() => confirmDelete()}
                title="Autorizar Baja"
                requireAdmin={true}
            />
        </div>
    );
};

// --- SUB-COMPONENTE: FORMULARIO ---
interface FormProps { 
    isOpen: boolean; 
    onClose: () => void; 
    userToEdit: User | null; 
    onSuccess: () => void; 
    branches: Branch[];    
    defaultBranchId: string;
}

const UserFormModal: React.FC<FormProps> = ({ isOpen, onClose, userToEdit, onSuccess, branches, defaultBranchId }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('CAJERO');
    const [branchId, setBranchId] = useState(''); // Estado para la sucursal
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setName(userToEdit.name);
                setUsername(userToEdit.username);
                setPassword(userToEdit.password);
                setRole(userToEdit.role);
                setBranchId(userToEdit.branchId); // Cargamos su sucursal
            } else {
                setName('');
                setUsername('');
                setPassword('');
                setRole('CAJERO');
                setBranchId(defaultBranchId); // Pre-seleccionamos la actual
            }
        }
    }, [isOpen, userToEdit, defaultBranchId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!branchId) {
            toast.error("Debes asignar una sucursal");
            return;
        }
        if (password.length !== 4 || isNaN(Number(password))) {
            toast.error("La contraseña debe ser un PIN numérico de 4 dígitos");
            return;
        }
        setSubmitting(true);
        try {
            if (userToEdit) {
                await userService.updateUser(userToEdit.id, { name, username, password, role, branchId });
                toast.success("Usuario actualizado");
            } else {
                await userService.createUser({ name, username, password, role, branchId } as any);
                toast.success("Usuario creado exitosamente");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Error al guardar");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="w-full max-w-md bg-base-100 p-0 rounded-3xl shadow-2xl overflow-hidden outline-none m-4"
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div className="p-6">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    {userToEdit ? '✏️ Editar Usuario' : '👤 Nuevo Usuario'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label py-1 font-bold text-xs opacity-50 uppercase">Nombre Completo</label>
                        <input type="text" className="input input-bordered w-full font-bold" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Juan Pérez" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label py-1 font-bold text-xs opacity-50 uppercase">ID Usuario</label>
                            <input type="text" className="input input-bordered w-full font-mono" value={username} onChange={e => setUsername(e.target.value)} required placeholder="user1" />
                        </div>
                        <div className="form-control">
                            <label className="label py-1 font-bold text-xs opacity-50 uppercase">Contraseña</label>
                            <input type="text" className="input input-bordered w-full font-mono" value={password} onChange={e => setPassword(e.target.value)} required placeholder="****" />
                        </div>
                    </div>

                    {/* SELECTOR DE SUCURSAL NUEVO */}
                    <div className="form-control">
                        <label className="label py-1 font-bold text-xs opacity-50 uppercase">Sucursal Asignada</label>
                        <select 
                            className="select select-bordered w-full font-bold"
                            value={branchId}
                            onChange={e => setBranchId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Selecciona una sucursal</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    🏢 {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label py-1 font-bold text-xs opacity-50 uppercase">Rol</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.entries(ROLE_STYLES) as [UserRole, any][]).map(([key, style]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setRole(key)}
                                    className={`
                                        btn btn-sm h-auto py-2 justify-start
                                        ${role === key ? 'btn-neutral text-white' : 'btn-ghost bg-base-200'}
                                    `}
                                >
                                    <span className="text-lg mr-1">{style.icon}</span>
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost flex-1 rounded-xl">Cancelar</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1 rounded-xl shadow-lg">
                            {submitting ? <span className="loading loading-spinner"></span> : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};