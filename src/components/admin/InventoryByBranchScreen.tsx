// src/components/admin/InventoryByBranchScreen.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import { inventoryService, type BranchInventoryItem } from '../../services/inventoryService';
import { userService } from '../../services/userService';
import type { Branch } from '../../types/branch';

export const InventoryByBranchScreen: React.FC = () => {
    const { activeBranchId, setActiveBranch } = useAuthStore(); // Usamos el store para cambiar contexto si es admin
    const [branches, setBranches] = useState<Branch[]>([]);
    const [inventory, setInventory] = useState<BranchInventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Cargar lista de sucursales (Para el selector superior)
    useEffect(() => {
        userService.getBranches().then(setBranches);
    }, []);

    // Cargar inventario cuando cambia la sucursal seleccionada
    useEffect(() => {
        if (!activeBranchId) return;
        loadInventory();
    }, [activeBranchId]);

    const loadInventory = async () => {
        if (!activeBranchId) return;
        setLoading(true);
        try {
            const data = await inventoryService.getBranchInventory(activeBranchId);
            setInventory(data);
        } catch (error) {
            toast.error("Error cargando inventario");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (item: BranchInventoryItem, newQty: number) => {
        if (!activeBranchId) return;
        if (newQty < 0) return;

        // Actualización optimista (UI primero)
        const oldInventory = [...inventory];
        setInventory(prev => prev.map(i => i.id === item.id ? { ...i, currentStock: newQty } : i));

        try {
            await inventoryService.updateStock(activeBranchId, item.id, newQty, item.name);
            toast.success(`Stock actualizado: ${item.name}`);
        } catch (error) {
            toast.error("Error al guardar en base de datos");
            setInventory(oldInventory); // Revertir si falla
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const isTracked = (item as any).trackStock === true;

        return matchesSearch && isTracked;
    });

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-24 px-4">
            {/* Header con Selector de Sucursal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-4">
                <div>
                    <h2 className="text-3xl font-black text-base-content flex items-center gap-2">
                        📦 Existencias Locales
                    </h2>
                    <p className="text-sm opacity-60">Gestiona el stock físico de cada tienda independientemente</p>
                </div>

                <select 
                    className="select select-bordered select-lg font-bold shadow-sm min-w-[200px]"
                    value={activeBranchId || ''}
                    onChange={(e) => setActiveBranch(e.target.value)}
                >
                    <option value="" disabled>Selecciona Sucursal</option>
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>🏢 {b.name}</option>
                    ))}
                </select>
            </div>

            {/* Buscador */}
            <div className="mb-6 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                <input 
                    type="text"
                    placeholder="Buscar ingrediente..."
                    className="input input-lg w-full pl-12 bg-base-100 shadow-sm border-base-200"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
            ) : !activeBranchId ? (
                <div className="text-center py-20 opacity-50 font-bold">Selecciona una sucursal arriba para ver su inventario</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInventory.map(item => (
                        <div key={item.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all">
                            <div className="card-body p-4 flex-row items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-lg truncate">{item.name}</h3>
                                    <span className={`badge badge-xs font-bold ${item.currentStock > 0 ? 'badge-success text-white' : 'badge-error text-white'}`}>
                                        {item.currentStock > 0 ? 'Disponible' : 'Agotado'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 bg-base-200 rounded-lg p-1">
                                    <button 
                                        onClick={() => handleUpdateStock(item, item.currentStock - 1)}
                                        className="btn btn-sm btn-square btn-ghost text-lg"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        className="input input-sm w-16 text-center font-mono font-bold bg-transparent focus:outline-none p-0"
                                        value={item.currentStock}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            handleUpdateStock(item, val);
                                        }}
                                    />
                                    <button 
                                        onClick={() => handleUpdateStock(item, item.currentStock + 1)}
                                        className="btn btn-sm btn-square btn-ghost text-lg"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};