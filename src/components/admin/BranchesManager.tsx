// src/components/admin/BranchesManager.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { branchService } from '../../services/branchService';
import type { Branch } from '../../types/branch';

export const BranchesManager: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Formulario (Agregamos tableCount)
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [tableCount, setTableCount] = useState(10); // Default 10 mesas
    const [processing, setProcessing] = useState(false);

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

    useEffect(() => { loadBranches(); }, []);

    const handleOpenModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setName(branch.name);
            setAddress(branch.address || '');
            setTableCount(branch.tableCount || 10);
        } else {
            setEditingBranch(null);
            setName('');
            setAddress('');
            setTableCount(10);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setProcessing(true);
        try {
            if (editingBranch) {
                // Editar
                await branchService.updateBranch(editingBranch.id, { 
                    name, 
                    address, 
                    tableCount: Number(tableCount) 
                });
                toast.success("Sucursal actualizada");
            } else {
                // Crear
                await branchService.createBranch(name, address, Number(tableCount));
                toast.success("Sucursal creada exitosamente");
            }
            setIsModalOpen(false);
            loadBranches();
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setProcessing(false);
        }
    };

    const toggleStatus = async (branch: Branch) => {
        try {
            await branchService.updateBranch(branch.id, { isActive: !branch.isActive });
            toast.success(`Estado actualizado`);
            loadBranches();
        } catch (error) { toast.error("Error al actualizar"); }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-24 px-4">
            <div className="flex items-center justify-between mb-8 mt-4">
                <h2 className="text-3xl font-black text-base-content flex items-center gap-2">
                    🏢 Mis Sucursales
                </h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary text-white shadow-lg"
                >
                    + Nueva Sucursal
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
            ) : (
                <div className="grid gap-4">
                    {branches.map((branch) => (
                        <div key={branch.id} className="card bg-base-100 shadow-sm border border-base-200 flex-row items-center p-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-primary/10 mr-4`}>🏢</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {branch.name}
                                    {!branch.isActive && <span className="badge badge-error text-white badge-xs">Inactiva</span>}
                                </h3>
                                <div className="text-sm opacity-60 flex gap-4">
                                    <span>📍 {branch.address || 'Sin dirección'}</span>
                                    <span>🪑 {branch.tableCount || 10} Mesas</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleOpenModal(branch)} className="btn btn-sm btn-ghost">✏️ Editar</button>
                                <input 
                                    type="checkbox" 
                                    className="toggle toggle-success toggle-sm" 
                                    checked={branch.isActive}
                                    onChange={() => toggleStatus(branch)} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
                        <div className="p-6">
                            <h3 className="text-xl font-black mb-4">
                                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="form-control">
                                    <label className="label font-bold text-xs uppercase opacity-60">Nombre</label>
                                    <input type="text" className="input input-bordered w-full font-bold" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="form-control">
                                    <label className="label font-bold text-xs uppercase opacity-60">Dirección</label>
                                    <input type="text" className="input input-bordered w-full" value={address} onChange={e => setAddress(e.target.value)} />
                                </div>
                                
                                {/* INPUT DE MESAS */}
                                <div className="form-control">
                                    <label className="label font-bold text-xs uppercase opacity-60">Número de Mesas</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="100"
                                        className="input input-bordered w-full font-mono font-bold text-lg" 
                                        value={tableCount} 
                                        onChange={e => setTableCount(Number(e.target.value))}
                                        required 
                                    />
                                    <label className="label text-xs opacity-50">
                                        Define cuántas mesas aparecerán en el POS para esta tienda.
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1">Cancelar</button>
                                    <button type="submit" className="btn btn-primary flex-1 shadow-lg" disabled={processing}>
                                        {processing ? <span className="loading loading-spinner"></span> : 'Guardar'}
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