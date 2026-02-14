// src/components/admin/BranchesManager.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { branchService } from '../../services/branchService';
import type { Branch } from '../../types/branch';

export const BranchesManager: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Formulario
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [creating, setCreating] = useState(false);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (error) {
            toast.error("Error cargando sucursales");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setCreating(true);
        try {
            await branchService.createBranch(newName, newAddress);
            toast.success("¡Sucursal creada e inventario inicializado!");
            setIsModalOpen(false);
            setNewName('');
            setNewAddress('');
            loadBranches();
        } catch (error) {
            toast.error("Error al crear la sucursal");
        } finally {
            setCreating(false);
        }
    };

    const toggleStatus = async (branch: Branch) => {
        try {
            await branchService.updateBranch(branch.id, { isActive: !branch.isActive });
            toast.success(`Sucursal ${branch.isActive ? 'desactivada' : 'activada'}`);
            loadBranches();
        } catch (error) {
            toast.error("Error al actualizar estado");
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-24 px-4">
            <div className="flex items-center justify-between mb-8 mt-4">
                <h2 className="text-3xl font-black text-base-content flex items-center gap-2">
                    🏢 Mis Sucursales
                </h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary text-white shadow-lg"
                >
                    + Nueva Sucursal
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
            ) : branches.length === 0 ? (
                <div className="text-center py-20 opacity-50 bg-base-200 rounded-xl border-2 border-dashed border-base-300">
                    <h3 className="text-xl font-bold">No hay sucursales registradas</h3>
                    <p>Crea la primera para comenzar a operar.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {branches.map((branch) => (
                        <div key={branch.id} className="card bg-base-100 shadow-sm border border-base-200 flex-row items-center p-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-primary/10 mr-4`}>
                                🏢
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {branch.name}
                                    {!branch.isActive && <span className="badge badge-error text-white badge-xs">Inactiva</span>}
                                </h3>
                                <p className="text-sm opacity-60">{branch.address || 'Sin dirección registrada'}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="tooltip" data-tip={branch.isActive ? "Desactivar" : "Activar"}>
                                    <input 
                                        type="checkbox" 
                                        className="toggle toggle-success" 
                                        checked={branch.isActive}
                                        onChange={() => toggleStatus(branch)} 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-black mb-4">Nueva Sucursal</h3>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="form-control">
                                    <label className="label font-bold text-xs uppercase opacity-60">Nombre de la Sucursal</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        className="input input-bordered w-full font-bold"
                                        placeholder="Ej. Sucursal Centro"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label font-bold text-xs uppercase opacity-60">Dirección</label>
                                    <input 
                                        type="text" 
                                        className="input input-bordered w-full"
                                        placeholder="Calle, Número, Colonia..."
                                        value={newAddress}
                                        onChange={e => setNewAddress(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn btn-ghost flex-1"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary flex-1 shadow-lg"
                                        disabled={creating}
                                    >
                                        {creating ? <span className="loading loading-spinner"></span> : 'Crear Sucursal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};