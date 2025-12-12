// src/components/MovementsScreen.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Timestamp } from '../firebase'; // <--- Necesario para validar fechas

// Servicios y Stores
import { movementService } from '../services/movementService';
import { useAuthStore } from '../store/useAuthStore';  // <--- Para saber quién registra
import { useShiftStore } from '../store/useShiftStore'; // <--- Para ligar al turno

// Tipos
import type { Movement, MovementCategory } from '../types/movement';

const EXPENSE_CATEGORIES: Record<string, string> = {
    INSUMO: '🛒 Insumos (Coca, Hielo...)',
    SERVICIO: '💡 Servicios (Luz, Gas...)',
    NOMINA: '👷 Nómina / Sueldos',
    MANTENIMIENTO: '🛠️ Mantenimiento',
    RETIRO: '💸 Retiro de Efectivo',
    OTRO: '📝 Otro'
};

export const MovementsScreen: React.FC = () => {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Contexto Global
    const { currentUser } = useAuthStore();
    const { currentShift } = useShiftStore(); // <--- Obtenemos el turno actual

    // Formulario
    const [category, setCategory] = useState<MovementCategory>('INSUMO');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const loadData = () => {
        setLoading(true);
        movementService.getDailyMovements()
            .then(data => {
                // Filtramos solo salidas (OUT)
                setMovements(data.filter(m => m.type === 'OUT'));
            })
            .catch(err => toast.error("Error al cargar movimientos"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        setSubmitting(true);
        const shiftId = currentShift?.id; // ID del turno (si existe)
        const userName = currentUser?.name || 'Staff';

        // Promesa con Toast (UX de alta calidad)
        toast.promise(
            movementService.addMovement(
                'OUT', 
                category, 
                parseFloat(amount), 
                description,
                shiftId,  // <--- Pasamos el turno
                userName  // <--- Pasamos el usuario
            ),
            {
                loading: 'Registrando gasto...',
                success: () => {
                    setAmount('');
                    setDescription('');
                    loadData(); // Recargar lista
                    return 'Gasto registrado correctamente';
                },
                error: 'Error al registrar el gasto'
            }
        );
        setSubmitting(false);
    };

    const handleDelete = (id: string) => {
        toast("¿Eliminar este registro?", {
            action: {
                label: "Eliminar",
                onClick: () => {
                    movementService.deleteMovement(id)
                        .then(() => {
                            toast.success("Registro eliminado");
                            loadData();
                        })
                        .catch(() => toast.error("No se pudo eliminar"));
                }
            }
        });
    };

    const totalGastos = movements.reduce((acc, m) => acc + m.amount, 0);

    // Helper para formatear fecha segura
    const formatTime = (dateVal: any) => {
        if (!dateVal) return '--:--';
        // Verificación de tipo segura
        const date = dateVal instanceof Timestamp ? dateVal.toDate() : dateVal;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-error">
                <span>💸</span> Registro de Gastos
            </h2>

            {/* Aviso si no hay turno abierto */}
            {!currentShift && (
                <div className="alert alert-warning mb-6 shadow-sm">
                    <span>⚠️ No hay turno abierto. Este gasto quedará registrado, pero no se descontará de ninguna caja activa.</span>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                
                {/* COLUMNA 1: FORMULARIO */}
                <div className="card bg-base-100 shadow-lg border border-base-200 h-fit">
                    <div className="card-body p-5">
                        <h3 className="card-title text-sm uppercase opacity-70 mb-2">Nuevo Gasto</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold">Categoría</span></label>
                                <select 
                                    className="select select-bordered select-sm w-full" 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value as MovementCategory)}
                                >
                                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold">Monto</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1.5 opacity-50">$</span>
                                    <input 
                                        type="number" 
                                        className="input input-bordered input-sm w-full pl-6 font-mono font-bold text-error" 
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold">Descripción</span></label>
                                <input 
                                    type="text" 
                                    className="input input-bordered input-sm w-full" 
                                    placeholder="Ej. Pago de Hielo"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting || !amount} 
                                className="btn btn-block mt-2 btn-error text-white shadow-md"
                            >
                                {submitting ? 'Guardando...' : 'Registrar Salida'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLUMNA 2: LISTADO */}
                <div className="md:col-span-2 space-y-4">
                    <div className="stats shadow w-full bg-base-100 border border-base-200">
                        <div className="stat py-4">
                            <div className="stat-title text-sm font-bold uppercase">Total Gastado Hoy</div>
                            <div className="stat-value text-error text-3xl">-${totalGastos.toFixed(2)}</div>
                            <div className="stat-desc opacity-70">
                                {currentShift ? 'Se descontará del turno actual' : 'Registro informativo (sin turno)'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-base-100 rounded-box shadow-sm border border-base-200 overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center"><span className="loading loading-spinner"></span></div>
                        ) : movements.length === 0 ? (
                            <div className="p-10 text-center opacity-50 italic">No hay gastos registrados hoy.</div>
                        ) : (
                            <div className="overflow-x-auto h-[400px]">
                                <table className="table table-sm table-pin-rows">
                                    <thead className="bg-base-200">
                                        <tr>
                                            <th>Hora</th>
                                            <th>Descripción</th>
                                            <th>Categoría</th>
                                            <th className="text-right">Monto</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.map(mov => (
                                            <tr key={mov.id} className="hover:bg-base-200/50">
                                                <td className="text-xs opacity-60 font-mono">
                                                    {formatTime(mov.createdAt)}
                                                </td>
                                                <td className="font-bold">
                                                    {mov.description}
                                                    {mov.registeredBy && (
                                                        <div className="text-[10px] opacity-50 font-normal">
                                                            Por: {mov.registeredBy}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge badge-ghost badge-xs text-[10px]">
                                                        {EXPENSE_CATEGORIES[mov.category] || mov.category}
                                                    </span>
                                                </td>
                                                <td className="text-right font-bold font-mono text-error">
                                                    -${mov.amount.toFixed(2)}
                                                </td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleDelete(mov.id)}
                                                        className="btn btn-ghost btn-xs text-error opacity-50 hover:opacity-100"
                                                        title="Eliminar registro"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};