import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { useMenuStore } from '../../store/useMenuStore';
import { useUIStore } from '../../store/useUIStore';
import { useTicketStore } from '../../store/useTicketStore';
import { ProductCard } from '../ProductCard';
import { IconBack } from '../Icons';
import type { MenuItem, MenuGroup } from '../../types/menu';

export const MenuScreen: React.FC = () => {
    const { groups, items } = useMenuStore();
    const { currentGroup, navigateToGroup, openCustomModal, openVariantModal } = useUIStore();
    const { addItem } = useTicketStore();
    
    // Determinamos si estamos en la raíz del menú
    const isRoot = !currentGroup;

    // Filtramos grupos según el nivel actual
    const groupsToShow = useMemo(() => {
        if (isRoot) return groups.filter(g => g.parent === 'root');
        return groups.filter(g => g.parent === currentGroup.id);
    }, [groups, currentGroup, isRoot]);

    // Filtramos items según el grupo actual
    const itemsToShow = useMemo(() => {
        if (!currentGroup?.items_ref) return [];
        return currentGroup.items_ref
            .map(refId => items.find(i => i.id === refId))
            .filter((i): i is MenuItem => !!i);
    }, [items, currentGroup]);

    const handleProductClick = (item: MenuItem | MenuGroup) => {
        // Lógica de navegación o selección
        if ('level' in item) { 
            const group = item as MenuGroup;
            if (group.rules_ref) openCustomModal(group);
            else navigateToGroup(group);
        } else { 
            const menuItem = item as MenuItem;
            const isVariant = 'variants' in menuItem;
            const hasModifiers = menuItem.modifierGroups && menuItem.modifierGroups.length > 0;

            if (isVariant || hasModifiers) {
                openVariantModal(menuItem);
            } else {
                addItem({
                    id: crypto.randomUUID(), // ¡Mejoramos esto de una vez!
                    baseName: menuItem.name,
                    finalPrice: menuItem.price || 0,
                    finalCost: menuItem.cost || 0,
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
                        onClick={() => navigateToGroup(groups.find(g => g.id === currentGroup.parent) || null)} 
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
                    <ProductCard key={item.id} item={item} onClick={() => handleProductClick(item)} />
                ))}
            </div>
        </div>
    );
};