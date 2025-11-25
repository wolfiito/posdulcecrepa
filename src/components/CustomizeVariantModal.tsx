// src/components/CustomizeVariantModal.tsx

import { useState, useMemo, useEffect } from 'react';
import Modal from 'react-modal';
import type { VariantPriceItem, FixedPriceItem, Modifier, TicketItem, MenuItem } from '../types/menu'; 

// --- CONSTANTES ---
const BEBIDA_LECHE_GRUPO = "leche_opciones";
const BEBIDA_SABOR_GRUPO = "sabor_te";
const SABOR_TISANA_GRUPO = "sabor_tisana";
const TOPPING_GRUPOS_TODOS = ["bebida_topping_general", "bublee_topping"];

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

type WizardStep = {
    name: string;
    options: (Modifier | {name: string, price: number})[]; 
    isExclusive: boolean;
    isRequired: boolean;
    group: string;
}

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

    const allowedModifierGroups = item.modifierGroups || [];

    const { milkOptions, flavorOptions, toppingOptions } = useMemo(() => { 
        const relevantMods = allModifiers.filter(mod => allowedModifierGroups.includes(mod.group));
        return {
            milkOptions: relevantMods.filter(mod => mod.group === BEBIDA_LECHE_GRUPO),
            flavorOptions: relevantMods.filter(mod => mod.group === BEBIDA_SABOR_GRUPO || mod.group === SABOR_TISANA_GRUPO),
            toppingOptions: relevantMods.filter(mod => TOPPING_GRUPOS_TODOS.includes(mod.group)),
        };
    }, [allModifiers, allowedModifierGroups]);
    
    const { price: currentPrice, cost: currentCost } = useMemo(() => {
        const variantPrice = isVariantPrice(item) ? selectedVariant.price : item.price;
        const extraPrice = Array.from(selectedModifiers.values()).reduce((sum, mod) => sum + mod.price, 0);
        const baseCost = isVariantPrice(item) ? (selectedVariant.cost || 0) : (item.cost || 0);
        const extraCost = Array.from(selectedModifiers.values()).reduce((sum, mod) => sum + (mod.cost || 0), 0);
        return { 
            price: variantPrice + extraPrice,
            cost: baseCost + extraCost 
        };
    }, [item, selectedVariant, selectedModifiers]);

    const steps = useMemo(() => {
        const stepList: WizardStep[] = [];
        if (isVariantPrice(item)) {
            stepList.push({ 
                name: 'Tamaño', 
                options: item.variants, 
                isRequired: true, 
                group: 'variants',
                isExclusive: true
            });
        }
        if (milkOptions.length > 0) stepList.push({ name: 'Leche', options: milkOptions, isExclusive: true, isRequired: true, group: BEBIDA_LECHE_GRUPO });
        if (flavorOptions.length > 0) stepList.push({ name: 'Sabor', options: flavorOptions, isExclusive: true, isRequired: true, group: (item.id.includes('tisana') ? SABOR_TISANA_GRUPO : BEBIDA_SABOR_GRUPO) });
        if (toppingOptions.length > 0) stepList.push({ name: 'Toppings', options: toppingOptions, isExclusive: false, isRequired: false, group: 'toppings' });
        return stepList;
    }, [item, milkOptions, flavorOptions, toppingOptions]);

    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;

    const isStepValid = useMemo(() => {
        if (!currentStep || !currentStep.isRequired) return true;
        if (currentStep.group === 'variants') return selectedVariant.price > 0;
        return Array.from(selectedModifiers.values()).some(mod => mod.group === currentStep.group);
    }, [currentStep, selectedModifiers, selectedVariant]);

    const handleModifierChange = (modifier: Modifier, isExclusive: boolean) => {
        setSelectedModifiers(prev => {
            const newMap = new Map(prev);
            if (isExclusive) { 
                allModifiers.filter(mod => mod.group === modifier.group).forEach(mod => newMap.delete(mod.id));
            }
            if (newMap.has(modifier.id)) newMap.delete(modifier.id);
            else newMap.set(modifier.id, modifier);
            return newMap;
        });
    };

    const handleAddToTicket = () => {
        const modsArray = Array.from(selectedModifiers.values());
        onAddItem({
            id: Date.now().toString(),
            baseName: item.name,
            finalPrice: currentPrice,
            finalCost: currentCost, // <--- ¡GUARDADO!
            type: 'VARIANT',
            details: {
                itemId: item.id,
                variantName: isVariantPrice(item) ? selectedVariant.name : '',
                selectedModifiers: modsArray,
            }
        });
    };
    
    const handleNext = () => { if (isStepValid) setStep(s => s + 1); };
    const handlePrev = () => setStep(s => s - 1);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            // CORRECCIÓN: rounded-box para consistencia con el tema
            className="bg-base-100 w-full max-w-lg max-h-[90dvh] rounded-box shadow-2xl flex flex-col overflow-hidden outline-none animate-pop-in border border-base-200"
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            {/* Header */}
            <div className="p-5 border-b border-base-200 bg-base-100 text-center relative">
                <h2 className="text-xl font-bold text-base-content">{item.name}</h2>
                
                {/* Steps Indicator */}
                <div className="flex gap-1 justify-center my-3 h-1.5 w-full max-w-xs mx-auto">
                    {steps.map((s, index) => (
                        <div key={s.name} className={`flex-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-primary' : 'bg-base-300'}`} />
                    ))}
                </div>
                
                {/* Precio Dinámico */}
                 <div className={`badge badge-lg font-bold transition-colors duration-300 ${isStepValid ? 'badge-success text-success-content' : 'badge-ghost opacity-50'}`}>
                    Total: ${currentPrice.toFixed(2)}
                </div>
            </div>
            
            {/* Contenido */}
            {currentStep && (
                 <div className="flex-1 overflow-y-auto p-4 bg-base-200/50">
                    <h4 className="text-sm font-bold uppercase tracking-wide opacity-70 mb-3 flex justify-between">
                        {currentStep.name} 
                        {currentStep.isRequired && !isStepValid && <span className="text-error text-xs font-bold">Requerido</span>}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        
                        {/* Renderizado de Variantes (Tamaños) */}
                        {currentStep.group === 'variants' && (currentStep.options as {name: string, price: number}[]).map(variant => {
                            const isSelected = selectedVariant.name === variant.name;
                            return (
                                <button
                                    key={variant.name}
                                    onClick={() => setSelectedVariant(variant)}
                                    // CORRECCIÓN: Estilos unificados con el modal de crepas
                                    className={`
                                        btn h-auto min-h-[3.5rem] py-2 px-3 flex flex-col leading-tight normal-case border
                                        ${isSelected 
                                            ? 'btn-primary border-primary shadow-md scale-[1.02]' 
                                            : 'btn-ghost bg-base-100 border-base-300 hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <span className="text-sm font-semibold">{variant.name}</span>
                                    <span className={`text-xs font-normal mt-1 ${isSelected ? 'text-primary-content/90' : 'text-base-content/60'}`}>
                                        ${variant.price.toFixed(2)}
                                    </span>
                                </button>
                            )
                        })}
                        
                        {/* Renderizado de Modificadores Normales */}
                        {currentStep.group !== 'variants' && (currentStep.options as Modifier[]).map(mod => {
                            const isSelected = selectedModifiers.has(mod.id);
                            return (
                                <button
                                    key={mod.id}
                                    onClick={() => handleModifierChange(mod, currentStep.isExclusive)}
                                    className={`
                                        btn h-auto min-h-[3.5rem] py-2 px-3 flex flex-col leading-tight normal-case border
                                        ${isSelected 
                                            ? 'btn-primary border-primary shadow-md scale-[1.02]' 
                                            : 'btn-ghost bg-base-100 border-base-300 hover:border-primary/50'
                                        }
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
            )}
            
            {/* Footer */}
            <div className="p-4 border-t border-base-200 bg-base-100 flex gap-3">
                <button onClick={step === 0 ? onClose : handlePrev} className="btn btn-ghost text-base-content/70">
                    {step === 0 ? 'Cancelar' : 'Atrás'}
                </button>

                {isLastStep ? (
                    <button 
                        onClick={handleAddToTicket} 
                        disabled={!isStepValid}
                        className="btn btn-primary flex-1 shadow-lg shadow-primary/20"
                    >
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