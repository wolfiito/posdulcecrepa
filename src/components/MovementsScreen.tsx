// src/components/MovementsScreen.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Modal from 'react-modal';
import { Timestamp } from '../firebase';

// Servicios y Stores
import { movementService } from '../services/movementService';
import { useAuthStore } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';

// Tipos
import type { Movement, MovementCategory } from '../types/movement';

Modal.setAppElement('#root');

const EXPENSE_CATEGORIES: Record<string, { label: string, icon: string, color: string }> = {
    INSUMO: { label: 'Insumos', icon: '🛒', color: 'bg-blue-100 text-blue-600' },
    SERVICIO: { label: 'Servicios', icon: '💡', color: 'bg-yellow-100 text-yellow-600' },
    NOMINA: { label: 'Nómina', icon: '👷', color: 'bg-purple-100 text-purple-600' },
    MANTENIMIENTO: { label: 'Mantenimiento', icon: '🛠️', color: 'bg-orange-100 text-orange-600' },
    RETIRO: { label: 'Retiro Caja', icon: '💸', color: 'bg-red-100 text-red-600' },
    OTRO: { label: 'Otro', icon: '📝', color: 'bg-gray-100 text-gray-600' }
};

export const MovementsScreen: React.FC = () => {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); // Control del Modal

    const { currentShift } = useShiftStore();

    const loadData = () => {
        setLoading(true);
        movementService.getDailyMovements()
            .then(data => {
                // Ordenar: más recientes primero
                const sorted = data.filter(m => m.type === 'OUT').sort((a,b) => {
                    const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                    const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                    return tB - tA;
                });
                setMovements(sorted);
            })
            .catch(() => toast.error("Error al cargar movimientos"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = (id: string) => {
        toast("¿Eliminar este registro?", {
            action: {
                label: "Eliminar",
                onClick: () => {
                    movementService.deleteMovement(id)
                        .then(() => { toast.success("Eliminado"); loadData(); })
                        .catch(() => toast.error("Error al eliminar"));
                }
            }
        });
    };

    const totalGastos = movements.reduce((acc, m) => acc + m.amount, 0);

    const formatTime = (dateVal: any) => {
        if (!dateVal) return '';
        const date = dateVal instanceof Timestamp ? dateVal.toDate() : new Date(dateVal);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="animate-fade-in max-w-2xl mx-auto pb-24 px-4">
            
            {/* 1. HEADER & RESUMEN */}
            <div className="flex justify-between items-end mb-6 mt-2">
                <div>
                    <h2 className="text-2xl font-black text-base-content">Gastos</h2>
                    <p className="text-sm opacity-60">
                        {currentShift ? 'Turno Actual' : 'Sin Turno (Histórico)'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase opacity-50 tracking-wider">Total Salidas</div>
                    <div className="text-3xl font-black text-error">-${totalGastos.toFixed(2)}</div>
                </div>
            </div>

            {/* AVISO SIN TURNO */}
            {!currentShift && (
                <div className="alert alert-warning mb-6 shadow-sm py-2">
                    <span className="text-xs font-bold">⚠️ No hay turno abierto. No afectará la caja actual.</span>
                </div>
            )}

            {/* 2. LISTA DE MOVIMIENTOS (Estilo App) */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-10 text-center"><span className="loading loading-spinner text-primary"></span></div>
                ) : movements.length === 0 ? (
                    <div className="text-center py-10 opacity-50 bg-base-200 rounded-3xl border-2 border-dashed border-base-300">
                        <div className="text-4xl mb-2">🍃</div>
                        <p className="font-bold">Sin gastos registrados hoy</p>
                    </div>
                ) : (
                    movements.map(mov => {
                        const style = EXPENSE_CATEGORIES[mov.category] || EXPENSE_CATEGORIES['OTRO'];
                        return (
                            <div key={mov.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all">
                                <div className="card-body p-4 flex-row items-center gap-4">
                                    {/* Icono */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${style.color}`}>
                                        {style.icon}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-base truncate">{mov.description}</h4>
                                        <div className="flex items-center gap-2 text-xs opacity-60">
                                            <span className="font-mono">{formatTime(mov.createdAt)}</span>
                                            <span>•</span>
                                            <span>{mov.registeredBy || 'Staff'}</span>
                                        </div>
                                    </div>

                                    {/* Monto y Acción */}
                                    <div className="text-right shrink-0">
                                        <div className="font-black text-error text-lg">-${mov.amount.toFixed(2)}</div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(mov.id); }}
                                            className="btn btn-ghost btn-xs text-error opacity-30 hover:opacity-100 -mr-2"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 3. BOTÓN FLOTANTE (FAB) */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-6 btn btn-circle btn-error btn-lg shadow-xl border-none z-40 w-16 h-16 text-2xl text-white animate-pop-in"
            >
                +
            </button>

            {/* 4. MODAL DE NUEVO GASTO */}
            <NewExpenseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={loadData} 
            />
        </div>
    );
};

// --- COMPONENTE INTERNO: MODAL FORMULARIO ---
const NewExpenseModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
    const [category, setCategory] = useState<MovementCategory>('INSUMO');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { currentUser } = useAuthStore();
    const { currentShift } = useShiftStore();

    // Resetear al abrir
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setDescription('');
            setCategory('INSUMO');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        setSubmitting(true);
        const shiftId = currentShift?.id;
        const userName = currentUser?.name || 'Staff';

        try {
            await movementService.addMovement('OUT', category, parseFloat(amount), description, shiftId, userName);
            toast.success('Gasto registrado');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Error al registrar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="w-full max-w-sm bg-base-100 p-0 rounded-3xl shadow-2xl overflow-hidden outline-none m-4"
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        >
            <div className="p-6 bg-base-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black">Nuevo Gasto</h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Monto Gigante */}
                    <div className="form-control">
                        <label className="label pb-0"><span className="label-text font-bold text-xs opacity-50 uppercase">Monto a retirar</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-error">$</span>
                            <input 
                                type="number" 
                                className="input input-lg w-full pl-10 text-3xl font-black text-error bg-error/5 border-transparent focus:border-error focus:bg-base-100 rounded-2xl h-20" 
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                autoFocus
                                required
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                            />
                        </div>
                    </div>

                    {/* Categoría (Grid de Iconos) */}
                    <div>
                         <label className="label py-1"><span className="label-text font-bold text-xs opacity-50 uppercase">Categoría</span></label>
                         <div className="grid grid-cols-3 gap-2">
                            {Object.entries(EXPENSE_CATEGORIES).map(([key, style]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setCategory(key as MovementCategory)}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all
                                        ${category === key 
                                            ? 'border-error bg-error/10 text-error scale-95' 
                                            : 'border-base-200 bg-base-100 opacity-60 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <span className="text-xl mb-1">{style.icon}</span>
                                    <span className="text-[10px] font-bold truncate w-full text-center">{style.label}</span>
                                </button>
                            ))}
                         </div>
                    </div>

                    {/* Descripción */}
                    <div className="form-control">
                        <label className="label py-1"><span className="label-text font-bold text-xs opacity-50 uppercase">Detalle</span></label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full font-bold" 
                            placeholder="Ej. Pago de Hielo"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting || !amount} 
                        className="btn btn-error btn-block btn-lg rounded-2xl shadow-lg mt-4 text-white"
                    >
                        {submitting ? <span className="loading loading-spinner"></span> : 'REGISTRAR SALIDA'}
                    </button>
                </form>
            </div>
        </Modal>
    );
};