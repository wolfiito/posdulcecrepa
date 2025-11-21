// src/components/CustomizeCrepeModal.tsx

import { useState, useMemo, useEffect } from 'react';
import Modal from 'react-modal';
import type { MenuGroup, Modifier, TicketItem, PriceRule } from '../types/menu';

// --- CONSTANTES DE GRUPOS ---
const BEBIDA_LECHE_GRUPO = "leche_opciones";
const CREPA_DULCE_BASE = "crepa_dulce_base";
const CREPA_SALADA_BASE = "crepa_salada_base";
const CREPA_TOPPING_SALSA = "crepa_topping_salsa";
const CREPA_TOPPING_SECO = "crepa_topping_seco";

const exclusiveBaseGroups = ["frappe_sabores", "malteada_sabores", "frappe_especial_sabores", "soda_sabores", "chamoyada_sabores", "icee_sabores"];
const exclusiveGroups = [...exclusiveBaseGroups, BEBIDA_LECHE_GRUPO, CREPA_TOPPING_SALSA, CREPA_TOPPING_SECO];

Modal.setAppElement('#root');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  group: MenuGroup | null; 
  allModifiers: Modifier[];
  allPriceRules: PriceRule[]; 
  onAddItem: (item: TicketItem) => void;
}

export function CustomizeCrepeModal({ isOpen, onClose, group, allModifiers, allPriceRules, onAddItem }: Props) {
  const [step, setStep] = useState(0);
  const [selectedModifiers, setSelectedModifiers] = useState<Map<string, Modifier>>(new Map());

  // --- Lógica de Negocio (Sin cambios mayores) ---
  const maxIngredients = useMemo(() => group?.id.includes('hotcakes') ? 3 : 5, [group]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSelectedModifiers(new Map());
    }
  }, [isOpen, group]);

  const priceRule = useMemo(() => {
    if (!group || !group.rules_ref) return null;
    return allPriceRules.find(rule => rule.id === group.rules_ref) || null;
  }, [group, allPriceRules]);

  const steps = useMemo(() => {
    if (!group) return [];
    const baseGroups = group.base_group ? [group.base_group] : [];
    const extraGroups = group.extra_groups || [];
    const toppingGroups = group.topping_groups || [];
    const allSteps = [];

    if (baseGroups.length > 0) {
        allSteps.push({ 
            name: (group.id.includes('frappe') || group.id.includes('malteada')) ? 'Seleccione Sabor' : 'Ingredientes Base',
            groups: baseGroups,
            isRequired: true
        });
    }
    if (extraGroups.length > 0) {
        allSteps.push({
            name: extraGroups.includes(BEBIDA_LECHE_GRUPO) ? 'Tipo de Leche' : 'Extras',
            groups: extraGroups,
            isRequired: extraGroups.includes(BEBIDA_LECHE_GRUPO) 
        });
    }
    if (toppingGroups.length > 0) {
        if (group.id.includes('dulces') || group.id.includes('postre')) {
             allSteps.push({ name: 'Salsas (1 Gratis)', groups: [CREPA_TOPPING_SALSA], isRequired: false });
             allSteps.push({ name: 'Topping Seco (1 Gratis)', groups: [CREPA_TOPPING_SECO], isRequired: false });
        } else {
            allSteps.push({ name: 'Toppings', groups: toppingGroups, isRequired: false });
        }
    }
    return allSteps.filter(s => s.groups.length > 0);
  }, [group]);

  const currentStepInfo = steps[step];
  const isLastStep = step === steps.length - 1;

  const modifiersForCurrentStep = useMemo(() => {
      if (!currentStepInfo) return [];
      return allModifiers.filter(mod => currentStepInfo.groups.includes(mod.group));
  }, [currentStepInfo, allModifiers]);

  const selectedBaseCount = useMemo(() => {
    let count = 0;
    if (group?.base_group === CREPA_DULCE_BASE || group?.base_group === CREPA_SALADA_BASE) {
        selectedModifiers.forEach(mod => {
            if (mod.group === group.base_group) count++;
        });
    }
    return count;
  }, [group, selectedModifiers]);
  
  const isCrepeLimitReached = selectedBaseCount >= maxIngredients;

  const { price: currentPrice, rule: currentRule, isValid } = useMemo(() => {
    if (!priceRule || !group) return { price: 0, rule: 'N/A', isValid: false };
    let baseCount = 0;
    let extraCost = 0;
    selectedModifiers.forEach(mod => {
        if (mod.group === group.base_group) baseCount++; 
        if (mod.price > 0) extraCost += mod.price;
    });
    
    let ruleDesc = group.rules_ref === "regla_precio_fijo" ? group.name : `${baseCount} Ingredientes`;
    let basePrice = 0;
    let valid = true;
    
    const isBaseExclusive = group.base_group ? exclusiveBaseGroups.includes(group.base_group) : false;

    if (isBaseExclusive) {
        if (baseCount !== 1) valid = false;
        basePrice = group.price || 0; 
    } else if (group.id.includes('licuados')) {
        const req = group.id.includes('sencillo') ? 1 : 2;
        if (baseCount !== req) valid = false;
        basePrice = priceRule.basePrices.find(r => r.count === req)?.price || 0;
    } else if (group.base_group === CREPA_DULCE_BASE || group.base_group === CREPA_SALADA_BASE) {
         if (baseCount === 0) valid = false;
         basePrice = priceRule.basePrices.sort((a, b) => b.count - a.count).find(r => baseCount >= r.count)?.price || 0;
    }

    if (group.extra_groups?.includes(BEBIDA_LECHE_GRUPO)) {
        const hasMilk = selectedModifiers.has('leche_entera') || selectedModifiers.has('leche_deslactosada');
        if (!hasMilk) valid = false;
    }
    
    return { price: basePrice + extraCost, rule: ruleDesc, isValid: valid };
  }, [selectedModifiers, priceRule, group]);

  const isStepValid = useMemo(() => {
    if (!currentStepInfo || !currentStepInfo.isRequired) return true;
    return Array.from(selectedModifiers.values()).some(mod => currentStepInfo.groups.includes(mod.group));
  }, [currentStepInfo, selectedModifiers]);

  const handleModifierChange = (modifier: Modifier) => {
    const isExclusive = exclusiveGroups.includes(modifier.group);
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

  const handleNext = () => { if (isStepValid) setStep(s => s + 1); };
  const handlePrev = () => setStep(s => s - 1);
  
  const handleAddToTicket = () => {
    if (!group || !isValid) return;
    onAddItem({
      id: Date.now().toString(),
      baseName: group.name.split('(')[0].trim(), 
      finalPrice: currentPrice,
      type: 'CUSTOM',
      details: {
        baseRuleId: group.rules_ref,
        basePriceRule: currentRule,
        selectedModifiers: Array.from(selectedModifiers.values()),
      }
    });
  };

  if (!group || !currentStepInfo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      // Clases Tailwind para el overlay y contenido
      className="bg-base-100 w-full max-w-lg max-h-[90dvh] rounded-3xl shadow-2xl flex flex-col overflow-hidden outline-none animate-pop-in"
      overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      {/* Header */}
      <div className="p-5 border-b border-base-200 bg-base-100 text-center relative">
        <h2 className="text-xl font-bold text-base-content">{group.name}</h2>
        
        {/* Wizard Steps */}
        <div className="flex gap-1 justify-center my-3 h-1.5 w-full max-w-xs mx-auto">
            {steps.map((s, index) => (
                <div 
                    key={s.name} 
                    className={`flex-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-primary' : 'bg-base-300'}`} 
                />
            ))}
        </div>

        {/* Precio Dinámico */}
        <div className={`badge badge-lg font-bold transition-colors duration-300 ${isValid ? 'badge-success text-white' : 'badge-ghost opacity-50'}`}>
          {currentRule} &rarr; ${currentPrice.toFixed(2)}
        </div>
      </div>
      
      {/* Contenido Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 bg-base-200/30">
          <h4 className="text-sm font-bold uppercase tracking-wide opacity-70 mb-3 flex justify-between">
            {currentStepInfo.name}
            {currentStepInfo.isRequired && !isStepValid && <span className="text-error text-xs">Requerido</span>}
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modifiersForCurrentStep.map(mod => {
                  const isSelected = selectedModifiers.has(mod.id);
                  const isCrepeOrPostreBase = mod.group === CREPA_DULCE_BASE || mod.group === CREPA_SALADA_BASE;
                  const shouldBeDisabled = isCrepeOrPostreBase && isCrepeLimitReached && !isSelected;

                  return (
                      <button
                          key={mod.id}
                          onClick={() => handleModifierChange(mod)}
                          disabled={shouldBeDisabled}
                          className={`
                            btn h-auto min-h-[3.5rem] py-2 px-3 flex flex-col leading-tight normal-case border-2
                            ${isSelected 
                                ? 'btn-primary border-primary shadow-lg scale-[1.02]' 
                                : 'btn-ghost bg-base-100 border-base-200 hover:border-primary/50'
                            }
                            ${shouldBeDisabled ? 'opacity-30' : ''}
                          `}
                      >
                          <span className="text-sm font-semibold">{mod.name}</span>
                          {mod.price > 0 && (
                              <span className={`text-xs font-normal mt-1 ${isSelected ? 'text-primary-content/80' : 'text-base-content/60'}`}>
                                  +${mod.price.toFixed(2)}
                              </span>
                          )}
                      </button>
                  );
              })}
          </div>
      </div>
      
      {/* Footer Acciones */}
      <div className="p-4 border-t border-base-200 bg-base-100 flex gap-3">
        <button 
            onClick={step === 0 ? onClose : handlePrev} 
            className="btn btn-ghost text-base-content/70"
        >
            {step === 0 ? 'Cancelar' : 'Atrás'}
        </button>

        {isLastStep ? (
            <button 
                onClick={handleAddToTicket} 
                disabled={!isValid}
                className="btn btn-primary flex-1 shadow-lg shadow-primary/30"
            >
                Agregar ${currentPrice.toFixed(2)}
            </button>
        ) : (
            <button 
                onClick={handleNext} 
                disabled={!isStepValid} 
                className="btn btn-secondary flex-1"
            >
                Siguiente
            </button>
        )}
      </div>
    </Modal>
  );
}