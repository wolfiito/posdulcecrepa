// src/components/admin/InventoryByBranchScreen.tsx
// Inventario por insumo y sucursal: existencias en vivo, entradas/mermas/conteos, historial y catálogo.
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { db, collection, onSnapshot, getDocs } from '../../firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { inventoryService } from '../../services/inventoryService';
import { userService } from '../../services/userService';
import type { Branch } from '../../types/branch';
import type { MenuGroup, MenuItem, Modifier } from '../../types/menu';
import type { Supply, SupplyMove, SupplyMoveType, SupplyStock, SupplyUnit } from '../../types/inventory';
import { UNIT_LABELS, formatQty, fromBase, getStockStatus, toBase, type StockStatus } from '../../utils/inventory';
import { ArrowDownToLine, ClipboardList, History, Package, Pencil, Plus, RefreshCw, Scale, Search, Trash, TriangleAlert, X } from 'lucide-react';

type Tab = 'stock' | 'history' | 'supplies';
type ActionType = 'entry' | 'waste' | 'count' | 'min';
type StatusFilter = 'all' | 'low' | 'negative' | 'out';

const MOVE_LABELS: Record<SupplyMoveType, string> = {
    sale: 'Venta', cancel: 'Cancelación', entry: 'Entrada', waste: 'Merma', count: 'Conteo físico'
};

const ACTION_LABELS: Record<ActionType, { title: string; help: string; button: string }> = {
    entry: { title: 'Registrar entrada', help: 'Cantidad que llegó (ej. un frasco de 3 kg = 3).', button: 'Registrar entrada' },
    waste: { title: 'Registrar merma', help: 'Cantidad que se tiró o echó a perder.', button: 'Registrar merma' },
    count: { title: 'Conteo físico', help: 'Cantidad que hay realmente (pesada o contada). Reemplaza la existencia.', button: 'Guardar conteo' },
    min: { title: 'Existencia mínima', help: 'Cuando la existencia llegue a esta cantidad se marca "Por agotarse". En blanco = sin alerta.', button: 'Guardar mínimo' }
};

const STATUS_STYLES: Record<StockStatus, { label: string; badge: string; text: string }> = {
    out: { label: 'Agotado', badge: 'badge-error', text: 'text-error' },
    negative: { label: 'Negativo', badge: 'badge-error badge-outline', text: 'text-error' },
    low: { label: 'Por agotarse', badge: 'badge-warning', text: 'text-warning' },
    ok: { label: 'OK', badge: 'badge-success badge-outline', text: '' }
};

const formatDate = (value: any) => {
    const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
    return date ? date.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '…';
};

export const InventoryByBranchScreen: React.FC = () => {
    const { activeBranchId, currentUser } = useAuthStore();
    const [tab, setTab] = useState<Tab>('stock');
    const [branches, setBranches] = useState<Branch[]>([]);
    // Sucursal que se está viendo; no cambia la sucursal activa del POS
    const [branchId, setBranchId] = useState<string>(activeBranchId || currentUser?.branchId || '');

    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [stock, setStock] = useState<Record<string, SupplyStock>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Formulario de movimiento
    const [action, setAction] = useState<{ supply: Supply; type: ActionType } | null>(null);
    const [actionQty, setActionQty] = useState('');
    const [actionNote, setActionNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Historial
    const [moves, setMoves] = useState<SupplyMove[]>([]);
    const [movesLoading, setMovesLoading] = useState(false);
    const [historySupply, setHistorySupply] = useState('all');

    // Catálogo
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);

    const userName = currentUser?.name || 'Admin';

    useEffect(() => {
        userService.getBranches().then(list => {
            setBranches(list);
            setBranchId(prev => prev || list[0]?.id || '');
        });
    }, []);

    // Catálogo global en vivo
    useEffect(() => {
        return onSnapshot(collection(db, 'supplies'), snap => {
            setSupplies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Supply)).sort((a, b) => a.name.localeCompare(b.name)));
            setLoading(false);
        }, () => {
            toast.error('Error al cargar insumos');
            setLoading(false);
        });
    }, []);

    // Existencias de la sucursal en vivo (las ventas se ven al momento)
    useEffect(() => {
        if (!branchId) return;
        setStock({});
        return onSnapshot(collection(db, 'branches', branchId, 'supplies_stock'), snap => {
            const data: Record<string, SupplyStock> = {};
            snap.docs.forEach(d => { data[d.id] = d.data() as SupplyStock; });
            setStock(data);
        }, () => toast.error('Error al cargar existencias'));
    }, [branchId]);

    const loadMoves = async () => {
        if (!branchId) return;
        setMovesLoading(true);
        try {
            setMoves(await inventoryService.getRecentMoves(branchId));
        } catch (error) {
            toast.error('Error al cargar el historial');
        } finally {
            setMovesLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 'history') loadMoves();
    }, [tab, branchId]);

    // --- DATOS DERIVADOS ---
    const supplyById = useMemo(() => new Map(supplies.map(s => [s.id, s])), [supplies]);

    const statusCounts = useMemo(() => {
        const counts: Record<StockStatus, number> = { out: 0, negative: 0, low: 0, ok: 0 };
        supplies.forEach(s => { counts[getStockStatus(stock[s.id])]++; });
        return counts;
    }, [supplies, stock]);

    const filteredSupplies = useMemo(() => {
        const term = search.trim().toLowerCase();
        return supplies
            .filter(s => !term || s.name.toLowerCase().includes(term))
            .filter(s => statusFilter === 'all' || getStockStatus(stock[s.id]) === statusFilter);
    }, [supplies, stock, search, statusFilter]);

    const filteredMoves = useMemo(
        () => moves.filter(m => historySupply === 'all' || m.supplyId === historySupply),
        [moves, historySupply]
    );

    // --- MOVIMIENTOS ---
    const openAction = (supply: Supply, type: ActionType) => {
        const current = stock[supply.id];
        setAction({ supply, type });
        setActionNote('');
        if (type === 'min') setActionQty(current?.minStock !== undefined ? String(fromBase(current.minStock, supply.unit)) : '');
        else if (type === 'count') setActionQty(String(fromBase(current?.stock ?? 0, supply.unit)));
        else setActionQty('');
    };

    const handleSaveAction = async () => {
        if (!action || !branchId) return;
        const { supply, type } = action;
        const value = actionQty.trim() === '' ? null : Number(actionQty);

        if (type !== 'min' && (value === null || isNaN(value) || value < 0)) return toast.error('Captura una cantidad válida');
        if (type !== 'min' && type !== 'count' && !value) return toast.error('La cantidad debe ser mayor a 0');

        setIsSaving(true);
        try {
            if (type === 'min') {
                await inventoryService.updateStockSettings(branchId, supply.id, { minStock: value === null ? null : toBase(value, supply.unit) });
            } else {
                await inventoryService.registerMove(branchId, supply, type, toBase(value!, supply.unit), userName, actionNote);
            }
            toast.success(`${supply.name}: ${ACTION_LABELS[type].title.toLowerCase()} guardado`);
            setAction(null);
            if (tab === 'history') loadMoves();
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleOutOfStock = async (supply: Supply) => {
        if (!branchId) return;
        const next = !stock[supply.id]?.outOfStock;
        try {
            await inventoryService.updateStockSettings(branchId, supply.id, { outOfStock: next });
            toast.success(next ? `${supply.name} marcado como agotado: se oculta en el POS` : `${supply.name} disponible otra vez`);
        } catch (error) {
            toast.error('Error al guardar');
        }
    };

    // --- CATÁLOGO ---
    const handleSaveSupply = async () => {
        if (!editingSupply) return;
        if (!editingSupply.name.trim()) return toast.error('El nombre es obligatorio');
        const duplicated = supplies.some(s => s.id !== editingSupply.id && s.name.trim().toLowerCase() === editingSupply.name.trim().toLowerCase());
        if (duplicated) return toast.error('Ya existe un insumo con ese nombre');
        setIsSaving(true);
        try {
            await inventoryService.saveSupply(editingSupply);
            toast.success('Insumo guardado');
            setEditingSupply(null);
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSupply = async (supply: Supply) => {
        try {
            // No se puede borrar si alguna receta lo usa
            const [itemsSnap, groupsSnap, modsSnap] = await Promise.all([
                getDocs(collection(db, 'menu_items')),
                getDocs(collection(db, 'menu_groups')),
                getDocs(collection(db, 'modifiers'))
            ]);
            const uses = (recipe?: { supplyId: string }[]) => (recipe || []).some(l => l.supplyId === supply.id);
            const usedBy = [
                ...itemsSnap.docs.map(d => d.data() as MenuItem)
                    .filter(i => ('variants' in i ? i.variants.some(v => uses(v.recipe)) : uses(i.recipe))).map(i => i.name),
                ...groupsSnap.docs.map(d => d.data() as MenuGroup).filter(g => uses(g.recipe)).map(g => g.name),
                ...modsSnap.docs.map(d => d.data() as Modifier).filter(m => uses(m.recipe)).map(m => m.name)
            ];
            if (usedBy.length > 0) {
                const preview = usedBy.slice(0, 4).join(', ') + (usedBy.length > 4 ? ` y ${usedBy.length - 4} más` : '');
                return toast.error(`No se puede eliminar: lo usa ${preview}.`);
            }
            if (!window.confirm(`¿Eliminar el insumo "${supply.name}"? Su historial se conserva.`)) return;
            await inventoryService.deleteSupply(supply.id);
            toast.success('Insumo eliminado');
            setEditingSupply(null);
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // --- RENDER: MODALES ---
    const renderActionModal = () => {
        if (!action) return null;
        const { supply, type } = action;
        const labels = ACTION_LABELS[type];
        const current = stock[supply.id]?.stock ?? 0;
        const value = Number(actionQty) || 0;
        const preview = type === 'entry' ? current + toBase(value, supply.unit)
            : type === 'waste' ? current - toBase(value, supply.unit)
            : type === 'count' ? toBase(value, supply.unit) : null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-base-200 bg-base-200/50 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="text-lg font-black text-primary">{labels.title}</h2>
                            <p className="text-sm opacity-70 truncate">{supply.name} · hay {formatQty(current, supply.unit)}</p>
                        </div>
                        <button onClick={() => setAction(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>
                    <div className="p-4 space-y-3">
                        <label className="input input-bordered input-lg flex items-center gap-2">
                            <input type="number" inputMode="decimal" min={0} step="any" className="w-full font-mono font-bold"
                                value={actionQty} onChange={e => setActionQty(e.target.value)} autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveAction(); }} />
                            <span className="opacity-60">{supply.unit}</span>
                        </label>
                        <p className="text-xs opacity-60">{labels.help}</p>
                        {type !== 'min' && (
                            <input type="text" className="input input-bordered input-sm w-full" placeholder="Nota (opcional, ej. proveedor o motivo)"
                                value={actionNote} onChange={e => setActionNote(e.target.value)} />
                        )}
                        {preview !== null && (
                            <p className="text-sm">Quedará en <b className={preview < 0 ? 'text-error' : ''}>{formatQty(preview, supply.unit)}</b></p>
                        )}
                    </div>
                    <div className="p-3 border-t border-base-200 bg-base-200/50 flex gap-2">
                        <button onClick={() => setAction(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSaveAction} disabled={isSaving} className="btn btn-primary flex-[2]">
                            {isSaving ? 'Guardando...' : labels.button}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSupplyModal = () => {
        if (!editingSupply) return null;
        const isNew = !editingSupply.id;
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
                <div className="bg-base-100 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-base-200 bg-base-200/50 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-black text-primary">{isNew ? 'Nuevo insumo' : 'Editar insumo'}</h2>
                        <button onClick={() => setEditingSupply(null)} className="btn btn-circle btn-ghost btn-sm"><X size={16} className="shrink-0" /></button>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="form-control">
                            <label className="label-text font-bold mb-1">Nombre</label>
                            <input type="text" className="input input-bordered" placeholder="Ej. Nutella" autoFocus
                                value={editingSupply.name} onChange={e => setEditingSupply({ ...editingSupply, name: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label-text font-bold mb-1">Se compra y se cuenta en</label>
                            {/* La unidad no se cambia después: las existencias guardadas perderían sentido */}
                            <select className="select select-bordered" value={editingSupply.unit} disabled={!isNew}
                                onChange={e => setEditingSupply({ ...editingSupply, unit: e.target.value as SupplyUnit })}>
                                {(Object.keys(UNIT_LABELS) as SupplyUnit[]).map(u => <option key={u} value={u}>{UNIT_LABELS[u]} ({u})</option>)}
                            </select>
                            {!isNew && <p className="text-[11px] opacity-60 mt-1">La unidad no se puede cambiar una vez creado el insumo.</p>}
                        </div>
                    </div>
                    <div className="p-3 border-t border-base-200 bg-base-200/50 flex gap-2">
                        {!isNew && (
                            <button onClick={() => handleDeleteSupply(editingSupply)} className="btn btn-ghost text-error" title="Eliminar">
                                <Trash size={16} className="shrink-0" />
                            </button>
                        )}
                        <button onClick={() => setEditingSupply(null)} className="btn btn-ghost flex-1">Cancelar</button>
                        <button onClick={handleSaveSupply} disabled={isSaving} className="btn btn-primary flex-[2]">
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- RENDER: PESTAÑAS ---
    const renderStock = () => {
        if (supplies.length === 0) {
            return (
                <div className="text-center py-16 space-y-3">
                    <p className="opacity-60">Aún no hay insumos.</p>
                    <button onClick={() => setTab('supplies')} className="btn btn-primary btn-sm">Crear insumos</button>
                </div>
            );
        }
        const filters: { id: StatusFilter; label: string; count?: number }[] = [
            { id: 'all', label: 'Todos' },
            { id: 'low', label: 'Por agotarse', count: statusCounts.low },
            { id: 'negative', label: 'Negativos', count: statusCounts.negative },
            { id: 'out', label: 'Agotados', count: statusCounts.out }
        ];
        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <label className="input input-bordered input-sm flex items-center gap-2 flex-1">
                        <Search size={14} className="shrink-0 opacity-50" />
                        <input type="search" className="w-full" placeholder="Buscar insumo..." value={search} onChange={e => setSearch(e.target.value)} />
                    </label>
                    <div className="flex gap-1 overflow-x-auto">
                        {filters.map(f => (
                            <button key={f.id} onClick={() => setStatusFilter(f.id)}
                                className={`btn btn-sm whitespace-nowrap ${statusFilter === f.id ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                                {f.label}{f.count ? ` (${f.count})` : ''}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredSupplies.map(supply => {
                        const data = stock[supply.id];
                        const status = getStockStatus(data);
                        const style = STATUS_STYLES[status];
                        return (
                            <div key={supply.id} className="card bg-base-100 border border-base-300 shadow-sm">
                                <div className="card-body p-4 gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold truncate">{supply.name}</h3>
                                            <button onClick={() => openAction(supply, 'min')} className="text-[11px] opacity-60 link link-hover">
                                                {data?.minStock !== undefined ? `Mínimo ${formatQty(data.minStock, supply.unit)}` : 'Sin mínimo'}
                                            </button>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-xl font-black font-mono ${style.text}`}>{formatQty(data?.stock ?? 0, supply.unit)}</p>
                                            {status !== 'ok' && <span className={`badge badge-xs ${style.badge}`}>{style.label}</span>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <button onClick={() => openAction(supply, 'entry')} className="btn btn-xs btn-success btn-outline gap-1">
                                            <ArrowDownToLine size={12} className="shrink-0" /> Entrada
                                        </button>
                                        <button onClick={() => openAction(supply, 'waste')} className="btn btn-xs btn-warning btn-outline gap-1">
                                            <Trash size={12} className="shrink-0" /> Merma
                                        </button>
                                        <button onClick={() => openAction(supply, 'count')} className="btn btn-xs btn-info btn-outline gap-1">
                                            <Scale size={12} className="shrink-0" /> Conteo
                                        </button>
                                    </div>
                                    <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
                                        <span className={data?.outOfStock ? 'text-error font-bold' : 'opacity-60'}>
                                            {data?.outOfStock ? 'Agotado: oculto en el POS' : 'Marcar como agotado'}
                                        </span>
                                        <input type="checkbox" className="toggle toggle-xs toggle-error" checked={!!data?.outOfStock}
                                            onChange={() => toggleOutOfStock(supply)} />
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                    {filteredSupplies.length === 0 && <p className="col-span-full text-center opacity-60 py-10">No hay insumos con ese filtro.</p>}
                </div>
            </div>
        );
    };

    const renderHistory = () => (
        <div className="space-y-3">
            <div className="flex gap-2">
                <select className="select select-bordered select-sm flex-1" value={historySupply} onChange={e => setHistorySupply(e.target.value)}>
                    <option value="all">Todos los insumos</option>
                    {supplies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={loadMoves} className="btn btn-sm btn-ghost border border-base-300" title="Actualizar">
                    <RefreshCw size={14} className={`shrink-0 ${movesLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <p className="text-[11px] opacity-60">Últimos 200 movimientos de la sucursal.</p>
            {movesLoading && moves.length === 0 ? (
                <div className="flex justify-center py-10"><span className="loading loading-spinner text-primary"></span></div>
            ) : (
                <div className="bg-base-100 border border-base-300 rounded-2xl divide-y divide-base-200 overflow-hidden">
                    {filteredMoves.map(move => {
                        const supply = supplyById.get(move.supplyId);
                        const fmt = (v: number) => (supply ? formatQty(v, supply.unit) : String(v));
                        return (
                            <div key={move.id} className="p-3 flex justify-between items-start gap-3 text-sm">
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{move.supplyName}</p>
                                    <p className="text-[11px] opacity-60">
                                        {MOVE_LABELS[move.type]}{move.orderNumber ? ` · Orden #${move.orderNumber}` : ''} · {move.user} · {formatDate(move.createdAt)}
                                    </p>
                                    {move.note && <p className="text-[11px] opacity-80 italic truncate">{move.note}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`font-mono font-bold ${move.qty < 0 ? 'text-error' : 'text-success'}`}>
                                        {move.qty > 0 ? '+' : ''}{fmt(move.qty)}
                                    </p>
                                    {move.after !== undefined && (
                                        <p className="text-[11px] opacity-60 font-mono">{fmt(move.before ?? 0)} → {fmt(move.after)}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {filteredMoves.length === 0 && <p className="p-6 text-center opacity-60">Sin movimientos.</p>}
                </div>
            )}
        </div>
    );

    const renderSupplies = () => (
        <div className="space-y-3">
            <div className="flex justify-between items-center gap-2">
                <p className="text-xs opacity-70">Lo que se compra. Las recetas se capturan en Editor de Menú (Opciones y Productos).</p>
                <button onClick={() => setEditingSupply({ id: '', name: '', unit: 'kg' })} className="btn btn-primary btn-sm gap-1 shrink-0">
                    <Plus size={14} className="shrink-0" /> Insumo
                </button>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-2xl divide-y divide-base-200 overflow-hidden">
                {supplies.map(supply => (
                    <button key={supply.id} onClick={() => setEditingSupply({ ...supply })}
                        className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-base-200/50">
                        <span className="font-medium truncate">{supply.name}</span>
                        <span className="flex items-center gap-2 shrink-0 text-xs opacity-60">
                            {UNIT_LABELS[supply.unit]} <Pencil size={12} className="shrink-0" />
                        </span>
                    </button>
                ))}
                {supplies.length === 0 && <p className="p-6 text-center opacity-60">Aún no hay insumos.</p>}
            </div>
        </div>
    );

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'stock', label: 'Existencias', icon: <Package size={16} className="shrink-0" /> },
        { id: 'history', label: 'Historial', icon: <History size={16} className="shrink-0" /> },
        { id: 'supplies', label: 'Insumos', icon: <ClipboardList size={16} className="shrink-0" /> }
    ];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-24 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 mt-4">
                <div>
                    <h2 className="text-3xl font-black text-base-content flex items-center gap-2">
                        <Package size={28} className="shrink-0" /> Inventario
                    </h2>
                    <p className="text-sm opacity-60">Existencias por insumo (kg, L o piezas). Las ventas se descuentan solas según las recetas.</p>
                </div>
                {tab !== 'supplies' && (
                    <select className="select select-bordered font-bold min-w-[200px]" value={branchId} onChange={e => setBranchId(e.target.value)}>
                        <option value="" disabled>Selecciona sucursal</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                )}
            </div>

            {(statusCounts.low + statusCounts.negative > 0) && tab === 'stock' && statusFilter === 'all' && (
                <button onClick={() => setStatusFilter(statusCounts.low > 0 ? 'low' : 'negative')}
                    className="alert alert-warning py-2 text-sm text-left mb-4 flex gap-2">
                    <TriangleAlert size={16} className="shrink-0" />
                    {statusCounts.low > 0 && `${statusCounts.low} por agotarse. `}
                    {statusCounts.negative > 0 && `${statusCounts.negative} en negativo (falta un conteo físico).`}
                </button>
            )}

            <div role="tablist" className="tabs tabs-boxed mb-4 bg-base-200/50">
                {tabs.map(t => (
                    <button key={t.id} role="tab" onClick={() => setTab(t.id)} className={`tab gap-1 ${tab === t.id ? 'tab-active' : ''}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
            ) : tab !== 'supplies' && !branchId ? (
                <div className="text-center py-20 opacity-50 font-bold">Selecciona una sucursal para ver su inventario</div>
            ) : tab === 'stock' ? renderStock() : tab === 'history' ? renderHistory() : renderSupplies()}

            {renderActionModal()}
            {renderSupplyModal()}
        </div>
    );
};
