// src/components/CustomizeVariantModal.tsx
import { useState, useMemo, useEffect } from 'react';
import Modal from 'react-modal';
import type { VariantPriceItem, FixedPriceItem, Modifier, TicketItem, MenuItem } from '../types/menu'; 
import { EXCLUSIVE_GROUPS } from '../constants/menuConstants'; // Usamos tu lista maestra de exclusividad

Modal.setAppElement('#root');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: VariantPriceItem | FixedPriceItem | null; 
  allModifiers: Modifier[];
  onAddItem: (item: TicketItem) => void;
}

const initialVariant = { name: '', price: 0, cost: 0 };

function isVariantPrice(item: MenuItem): item is VariantPriceItem {
  return 'variants' in item;
}

// Función para limpiar nombres de grupos (ej. "soda_sabores" -> "Soda Sabores")
const formatGroupName = (str: string) => {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function CustomizeVariantModal({ isOpen, onClose, item, allModifiers, onAddItem }: Props) {
    if (!item) return null;
    
    const [step, setStep] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(isVariantPrice(item) ? item.variants[0] : initialVariant);
    const [selectedModifiers, setSelectedModifiers] = useState<Map<string, Modifier>>(new Map());
    
    useEffect(() => {
        if (isOpen && item) {
            setStep(0);
            setSelectedVariant(isVariantPrice(item) ? item.variants[0] : initialVariant);
            setSelectedModifiers(new Map());
        }
    }, [isOpen, item]);

    // --- CÁLCULO DE PRECIOS ---
    const { price: currentPrice, cost: currentCost } = useMemo(() => {
        const variantPrice = isVariantPrice(item) ? selectedVariant.price : item.price;
        const baseCost = isVariantPrice(item) ? (selectedVariant.cost || 0) : (item.cost || 0);
        
        const extraPrice = Array.from(selectedModifiers.values()).reduce((sum, mod) => sum + mod.price, 0);
        const extraCost = Array.from(selectedModifiers.values()).reduce((sum, mod) => sum + (mod.cost || 0), 0);
        
        return { 
            price: variantPrice + extraPrice,
            cost: baseCost + extraCost 
        };
    }, [item, selectedVariant, selectedModifiers]);

    // --- GENERACIÓN DINÁMICA DE PASOS (WIZARD) ---
    const steps = useMemo(() => {
        const stepList = [];

        // 1. Paso de Tamaño (Si tiene variantes)
        if (isVariantPrice(item)) {
            stepList.push({ 
                id: 'variants',
                name: 'Tamaño', 
                options: item.variants, 
                isExclusive: true,
                isRequired: true,
                type: 'variant_selector'
            });
        }

        // 2. Pasos de Modificadores (Dinámicos)
        // Recorremos los grupos que tiene asignados el producto (ej. ["soda_sabores"])
        const productGroups = item.modifierGroups || [];
        
        productGroups.forEach(groupId => {
            // Buscamos los ingredientes que pertenecen a este grupo
            const options = allModifiers.filter(mod => mod.group === groupId);
            
            if (options.length > 0) {
                // Determinamos si es selección única (Radio) o múltiple (Checkbox)
                // Usando tu constante EXCLUSIVE_GROUPS
                const isExclusive = EXCLUSIVE_GROUPS.includes(groupId);
                
                stepList.push({
                    id: groupId,
                    name: formatGroupName(groupId), // "soda_sabores" -> "Soda Sabores"
                    options: options,
                    isExclusive: isExclusive,
                    isRequired: isExclusive, // Si es exclusivo (ej. sabor), solemos obligar a elegir uno
                    type: 'modifier_selector'
                });
            }
        });

        return stepList;
    }, [item, allModifiers]);

    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;

    // --- VALIDACIÓN ---
    const isStepValid = useMemo(() => {
        if (!currentStep) return true;
        if (!currentStep.isRequired) return true;

        if (currentStep.type === 'variant_selector') {
            return selectedVariant.price > 0; // Debe tener variante seleccionada
        }
        
        // Verificar si hay al menos un modificador seleccionado para este grupo
        return Array.from(selectedModifiers.values()).some(mod => mod.group === currentStep.id);
    }, [currentStep, selectedModifiers, selectedVariant]);

    // --- HANDLERS ---
    const handleModifierChange = (modifier: Modifier, isExclusive: boolean) => {
        setSelectedModifiers(prev => {
            const newMap = new Map(prev);
            
            if (isExclusive) { 
                // Si es exclusivo, borramos cualquier otro del mismo grupo antes de agregar este
                allModifiers
                    .filter(mod => mod.group === modifier.group)
                    .forEach(mod => newMap.delete(mod.id));
            }
            
            // Toggle lógico
            if (newMap.has(modifier.id)) {
                // Si ya estaba y es requerido/exclusivo, no dejamos desmarcar (UX decision)
                // O dejamos desmarcar solo si no es requerido.
                if (!isExclusive) newMap.delete(modifier.id);
            } else {
                newMap.set(modifier.id, modifier);
            }
            return newMap;
        });
    };

    const handleAddToTicket = () => {
        const modsArray = Array.from(selectedModifiers.values());
        onAddItem({
            id: Date.now().toString(),
            baseName: item.name,
            finalPrice: currentPrice,
            finalCost: currentCost,
            type: isVariantPrice(item) ? 'VARIANT' : 'FIXED',
            details: {
                itemId: item.id,
                variantName: isVariantPrice(item) ? selectedVariant.name : '',
                selectedModifiers: modsArray,
            }
        });
    };
    
    const handleNext = () => { if (isStepValid) setStep(s => s + 1); };
    const handlePrev = () => setStep(s => s - 1);

    if (!currentStep) return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="bg-base-100 w-full max-w-lg max-h-[90dvh] rounded-box shadow-2xl flex flex-col overflow-hidden outline-none animate-pop-in border border-base-200"
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            {/* Header */}
            <div className="p-5 border-b border-base-200 bg-base-100 text-center relative">
                <h2 className="text-xl font-bold text-base-content">{item.name}</h2>
                
                {/* Steps Indicator */}
                <div className="flex gap-1 justify-center my-3 h-1.5 w-full max-w-xs mx-auto">
                    {steps.map((s, index) => (
                        <div key={s.id} className={`flex-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-primary' : 'bg-base-300'}`} />
                    ))}
                </div>
                
                {/* Precio Dinámico */}
                 <div className={`badge badge-lg font-bold transition-colors duration-300 ${isStepValid ? 'badge-success text-success-content' : 'badge-ghost opacity-50'}`}>
                    Total: ${currentPrice.toFixed(2)}
                </div>
            </div>
            
            {/* Contenido Dinámico */}
            <div className="flex-1 overflow-y-auto p-4 bg-base-200/50">
                <h4 className="text-sm font-bold uppercase tracking-wide opacity-70 mb-3 flex justify-between">
                    {currentStep.name} 
                    {currentStep.isRequired && !isStepValid && <span className="text-error text-xs font-bold">Requerido</span>}
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    
                    {/* CASO 1: SELECCIONAR TAMAÑO (VARIANTE) */}
                    {currentStep.type === 'variant_selector' && (currentStep.options as any[]).map(variant => {
                        const isSelected = selectedVariant.name === variant.name;
                        return (
                            <button
                                key={variant.name}
                                onClick={() => setSelectedVariant(variant)}
                                className={`
                                    btn h-auto min-h-[3.5rem] py-2 px-3 flex flex-col leading-tight normal-case border
                                    ${isSelected ? 'btn-primary border-primary shadow-md scale-[1.02]' : 'btn-ghost bg-base-100 border-base-300 hover:border-primary/50'}
                                `}
                            >
                                <span className="text-sm font-semibold">{variant.name}</span>
                                <span className={`text-xs font-normal mt-1 ${isSelected ? 'text-primary-content/90' : 'text-base-content/60'}`}>
                                    ${variant.price.toFixed(2)}
                                </span>
                            </button>
                        )
                    })}
                    
                    {/* CASO 2: SELECCIONAR MODIFICADORES (SABORES, LECHES, ETC) */}
                    {currentStep.type === 'modifier_selector' && (currentStep.options as Modifier[]).map(mod => {
                        const isSelected = selectedModifiers.has(mod.id);
                        return (
                            <button
                                key={mod.id}
                                onClick={() => handleModifierChange(mod, currentStep.isExclusive)}
                                className={`
                                    btn h-auto min-h-[3.5rem] py-2 px-3 flex flex-col leading-tight normal-case border
                                    ${isSelected ? 'btn-primary border-primary shadow-md scale-[1.02]' : 'btn-ghost bg-base-100 border-base-300 hover:border-primary/50'}
                                `}
                            >
                                <span className="text-sm font-semibold">{mod.name}</span> 
                                {mod.price > 0 && (
                                    <span className={`text-xs font-normal mt-1 ${isSelected ? 'text-primary-content/90' : 'text-base-content/60'}`}>
                                        +${mod.price.toFixed(2)}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-base-200 bg-base-100 flex gap-3">
                <button onClick={step === 0 ? onClose : handlePrev} className="btn btn-ghost text-base-content/70">
                    {step === 0 ? 'Cancelar' : 'Atrás'}
                </button>

                {isLastStep ? (
                    <button onClick={handleAddToTicket} disabled={!isStepValid} className="btn btn-primary flex-1 shadow-lg shadow-primary/20">
                        Agregar ${currentPrice.toFixed(2)}
                    </button>
                ) : (
                    <button onClick={handleNext} disabled={!isStepValid} className="btn btn-secondary flex-1">
                        Siguiente
                    </button>
                )}
            </div>
        </Modal>
    );
}