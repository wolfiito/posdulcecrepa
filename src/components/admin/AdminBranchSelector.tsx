// src/components/admin/AdminBranchSelector.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { branchService } from '../../services/branchService';
import type { Branch } from '../../types/branch';

export const AdminBranchSelector: React.FC = () => {
    const { currentUser, activeBranchId, setActiveBranch } = useAuthStore();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Referencia para poder cerrar el menú flotante al hacer clic
    const dropdownRef = useRef<HTMLDetailsElement>(null); 

    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'GERENTE';

    useEffect(() => {
        if (isAdmin) {
            branchService.getBranches().then(data => {
                const activeBranches = data.filter(b => b.isActive);
                setBranches(activeBranches);
                
                if (!activeBranchId && activeBranches.length > 0) {
                    setActiveBranch(activeBranches[0].id);
                }
                setLoading(false);
            }).catch(err => {
                console.error("Error cargando sucursales:", err);
                setLoading(false);
            });
        }
    }, [isAdmin, activeBranchId, setActiveBranch]);

    if (!isAdmin) return null;
    if (loading) return <span className="loading loading-spinner loading-xs text-primary"></span>;

    // Buscamos el nombre de la sucursal actual para mostrarlo en el botón
    const currentBranch = branches.find(b => b.id === activeBranchId);

    const handleSelect = (branchId: string) => {
        setActiveBranch(branchId);
        // Cerramos el menú flotante automáticamente
        if (dropdownRef.current) {
            dropdownRef.current.removeAttribute('open');
        }
    };

    return (
        <details ref={dropdownRef} className="dropdown dropdown-end animate-fade-in">
            {/* BOTÓN VISIBLE EN LA BARRA */}
            <summary className="btn btn-sm btn-ghost bg-base-200 border-base-300 shadow-sm flex items-center gap-2 rounded-xl hover:bg-base-300 transition-all m-0">
                <span className="text-xl leading-none">🏢</span>
                <span className="hidden sm:inline font-bold text-base-content/80">
                    {currentBranch?.name || 'Seleccionar...'}
                </span>
                <span className="text-[10px] opacity-50 ml-1">▼</span>
            </summary>
            
            {/* MENÚ FLOTANTE (ESTILIZADO) */}
            <ul className="dropdown-content z-[100] menu p-2 shadow-2xl bg-base-100 border border-base-200 rounded-2xl w-56 mt-2">
                <li className="menu-title px-4 py-2 text-[10px] uppercase tracking-widest opacity-50">
                    Cambiar Sucursal
                </li>
                
                {branches.length === 0 && (
                    <li><span className="opacity-50 text-sm">Sin sucursales activas</span></li>
                )}
                
                {branches.map(b => (
                    <li key={b.id}>
                        <button 
                            onClick={() => handleSelect(b.id)}
                            className={`rounded-xl transition-all ${
                                activeBranchId === b.id 
                                ? 'bg-primary/10 text-primary font-black' 
                                : 'hover:bg-base-200'
                            }`}
                        >
                            <span className="truncate">{b.name}</span>
                            {/* Palomita si es la activa */}
                            {activeBranchId === b.id && (
                                <span className="ml-auto text-primary">✓</span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </details>
    );
};