// src/components/pos/MenuScreen.tsx
import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { useMenuStore } from '../../store/useMenuStore';
import { useUIStore } from '../../store/useUIStore';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore'; 
import { useInventoryStore } from '../../store/useInventoryStore';
import { ProductCard } from '../ProductCard';
import { IconBack } from '../Icons';
import { EXCLUSIVE_GROUPS } from '../../constants/menuConstants';
import type { MenuItem, MenuGroup } from '../../types/menu';

export const MenuScreen: React.FC = () => {
    const { groups, items, modifiers } = useMenuStore();
    const { currentGroup, navigateToGroup, openCustomModal, openVariantModal } = useUIStore();
    const { addItem } = useTicketStore();
    
    const { activeBranchId } = useAuthStore(); 
    const { stockData } = useInventoryStore();
    
    const isRoot = !currentGroup;

    const isItemOutOfStock = (item: MenuItem | MenuGroup) => {
        const inv = stockData[item.id];
        const isTracked = (item as any).trackStock === true || inv?.trackStock === true;
        const realStock = Number(inv?.currentStock) || 0;
        
        // 1. Check direct stock for the item if tracked
        if (isTracked && realStock <= 0) return true;

        // Helper to check if a group has any available options
        const hasOptionsInStock = (groupId: string) => {
            const modsForGroup = modifiers.filter(m => m.group === groupId);
            // If the group has no modifiers defined at all, we don't block it here (might be a configuration error elsewhere)
            if (modsForGroup.length === 0) return true;

            return modsForGroup.some(mod => {
                if (activeBranchId && mod.disabledIn?.includes(activeBranchId)) return false;
                const minv = stockData[mod.id];
                const mTracked = mod.trackStock === true || minv?.trackStock === true;
                const mStock = Number(minv?.currentStock) || 0;
                return !mTracked || mStock > 0;
            });
        };

        // 2. For custom groups (like "Armar Crepa"), check the base_group
        if ('level' in item) {
            const group = item as MenuGroup;
            if (group.base_group) {
                if (!hasOptionsInStock(group.base_group)) return true;
            }
            return false;
        }

        // 3. For products, check if any required (exclusive) modifier group is empty
        const menuItem = item as MenuItem;
        if (menuItem.modifierGroups && menuItem.modifierGroups.length > 0) {
            for (const groupId of menuItem.modifierGroups) {
                const isExclusive = EXCLUSIVE_GROUPS.includes(groupId);
                if (isExclusive && !hasOptionsInStock(groupId)) {
                    return true;
                }
            }
        }
        
        return false;
    };

    const groupsToShow = useMemo(() => {
        if (isRoot) return groups.filter(g => g.parent === 'root');
        return groups.filter(g => g.parent === currentGroup.id);
    }, [groups, currentGroup, isRoot]);

    const itemsToShow = useMemo(() => {
        if (!currentGroup?.items_ref) return [];
        
        return currentGroup.items_ref
            .map(refId => items.find(i => i.id === refId))
            .filter((item): item is MenuItem => {
                if (!item) return false;
                if (activeBranchId && item.disabledIn?.includes(activeBranchId)) return false;
                return true;
            });
    }, [currentGroup, items, activeBranchId]);

    // --- LÓGICA CORREGIDA DE CLICS ---
    const handleProductClick = (item: MenuItem | MenuGroup) => {
        if ('level' in item) {
            // 1. ES UNA CARPETA (MenuGroup)
            if (item.rules_ref) {
                // Si la carpeta tiene una regla de precio (Ej. "Arma tu Crepa"), va al modal de armar.
                openCustomModal(item);
            } else {
                // Si es una carpeta normal (Ej. "Bebidas Calientes"), entramos a ella.
                navigateToGroup(item);
            }
        } else {
            // 2. ES UN PRODUCTO (MenuItem)
            const menuItem = item as MenuItem;
            
            // Si el producto tiene Tamaños (variants) O tiene Opciones (modifierGroups)
            if ('variants' in menuItem || (menuItem.modifierGroups && menuItem.modifierGroups.length > 0)) {
                // Va al modal de Variantes (el que acabamos de actualizar para la leche y tamaños)
                openVariantModal(menuItem);
            } else {
                // Si es directo (Ej. "Fresas con crema"), se cobra directamente al ticket.
                const branchPrice = menuItem.branchPrices?.[activeBranchId || ''] ?? (menuItem as any).price ?? 0;
                
                addItem({
                    id: Date.now().toString(),
                    baseName: menuItem.name,
                    finalPrice: branchPrice,
                    finalCost: menuItem.cost,
                    type: 'FIXED',
                    details: { itemId: menuItem.id, selectedModifiers: [] }
                });
                toast.success(`Agregado: ${menuItem.name}`);
            }
        }
    };

    return (
        <div className="animate-fade-in pb-20"> 
            <div className="flex items-center mb-4 px-1">
                {!isRoot && (
                    <button 
                        onClick={() => navigateToGroup(null)} 
                        className="btn btn-circle btn-ghost btn-sm mr-2"
                    >
                        <IconBack />
                    </button>
                )}
                <h2 className="text-2xl font-bold text-base-content">
                    {isRoot ? 'Menú Principal' : currentGroup.name}
                </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {groupsToShow.map(group => (
                    <ProductCard key={group.id} item={group} onClick={() => handleProductClick(group)} isLarge={isRoot} />
                ))}
                {itemsToShow.map(item => (
                    <ProductCard 
                        key={item.id} 
                        item={item} 
                        onClick={() => handleProductClick(item)} 
                        isOutOfStock={isItemOutOfStock(item)}
                    />
                ))}
            </div>
        </div>
    );
};