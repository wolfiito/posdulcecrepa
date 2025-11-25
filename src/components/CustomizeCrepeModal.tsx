// src/components/CustomizeCrepeModal.tsx (Limpio)
import { useState, useMemo, useEffect } from 'react';
import Modal from 'react-modal';
import type { MenuGroup, Modifier, TicketItem, PriceRule } from '../types/menu';
import { MODIFIER_GROUPS, EXCLUSIVE_GROUPS, EXCLUSIVE_BASE_GROUPS } from '../constants/menuConstants';
import { calculateCustomItemPrice } from '../utils/pricing';

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

  const maxIngredients = useMemo(() => group?.id.includes('hotcakes') ? 3 : 5, [group]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSelectedModifiers(new Map());
    }
  }, [isOpen, group]);

  const priceRule = useMemo(() => {
    if (!group || !group.rules_ref) return undefined;
    return allPriceRules.find(rule => rule.id === group.rules_ref);
  }, [group, allPriceRules]);

  // --- Lógica de Pasos (Wizard) ---
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
            name: extraGroups.includes(MODIFIER_GROUPS.BEBIDA_LECHE) ? 'Tipo de Leche' : 'Extras',
            groups: extraGroups,
            isRequired: extraGroups.includes(MODIFIER_GROUPS.BEBIDA_LECHE) 
        });
    }
    if (toppingGroups.length > 0) {
        if (group.id.includes('dulces') || group.id.includes('postre')) {
             allSteps.push({ name: 'Salsas (1 Gratis)', groups: [MODIFIER_GROUPS.CREPA_TOPPING_SALSA], isRequired: false });
             allSteps.push({ name: 'Topping Seco (1 Gratis)', groups: [MODIFIER_GROUPS.CREPA_TOPPING_SECO], isRequired: false });
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

  // --- USO DE LA NUEVA UTILIDAD DE PRECIOS ---
  const { price: currentPrice, cost: currentCost, ruleDescription: currentRule, isValid } = useMemo(() => {
      if (!group) return { price: 0, cost: 0, ruleDescription: '', isValid: false };
      const modsList = Array.from(selectedModifiers.values());
      return calculateCustomItemPrice(group, modsList, priceRule);
  }, [group, selectedModifiers, priceRule]);

  // Validaciones de UI
  const isStepValid = useMemo(() => {
    if (!currentStepInfo || !currentStepInfo.isRequired) return true;
    return Array.from(selectedModifiers.values()).some(mod => currentStepInfo.groups.includes(mod.group));
  }, [currentStepInfo, selectedModifiers]);

  const handleModifierChange = (modifier: Modifier) => {
    const isExclusive = EXCLUSIVE_GROUPS.includes(modifier.group);
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
    if (!group || !isValid) return;
    onAddItem({
      id: Date.now().toString(),
      baseName: group.name.split('(')[0].trim(), 
      finalPrice: currentPrice,
      finalCost: currentCost,
      type: 'CUSTOM',
      details: {
        baseRuleId: group.rules_ref,
        basePriceRule: currentRule,
        selectedModifiers: Array.from(selectedModifiers.values()),
      }
    });
  };

  // Lógica de límite visual (no afecta precio, solo deshabilita botones)
  const selectedBaseCount = useMemo(() => {
    let count = 0;
    if (group?.base_group === MODIFIER_GROUPS.CREPA_DULCE_BASE || group?.base_group === MODIFIER_GROUPS.CREPA_SALADA_BASE) {
        selectedModifiers.forEach(mod => { if (mod.group === group.base_group) count++; });
    }
    return count;
  }, [group, selectedModifiers]);
  const isCrepeLimitReached = selectedBaseCount >= maxIngredients;

  if (!group || !currentStepInfo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-base-100 w-full max-w-lg max-h-[90dvh] rounded-box shadow-2xl flex flex-col overflow-hidden outline-none animate-pop-in border border-base-200"
      overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      {/* Header */}
      <div className="p-5 border-b border-base-200 bg-base-100 text-center relative">
        <h2 className="text-xl font-bold text-base-content">{group.name}</h2>
        {/* Steps */}
        <div className="flex gap-1 justify-center my-3 h-1.5 w-full max-w-xs mx-auto">
            {steps.map((s, index) => (
                <div key={s.name} className={`flex-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-primary' : 'bg-base-300'}`} />
            ))}
        </div>
        {/* Precio */}
        <div className={`badge badge-lg font-bold transition-colors duration-300 ${isValid ? 'badge-success text-success-content' : 'badge-ghost opacity-50'}`}>
          {currentRule} &rarr; ${currentPrice.toFixed(2)}
        </div>
      </div>
      
      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 bg-base-200/50">
          <h4 className="text-sm font-bold uppercase tracking-wide opacity-70 mb-3 flex justify-between">
            {currentStepInfo.name}
            {currentStepInfo.isRequired && !isStepValid && <span className="text-error text-xs font-bold">Requerido</span>}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modifiersForCurrentStep.map(mod => {
                  const isSelected = selectedModifiers.has(mod.id);
                  const isCrepeOrPostreBase = mod.group === MODIFIER_GROUPS.CREPA_DULCE_BASE || mod.group === MODIFIER_GROUPS.CREPA_SALADA_BASE;
                  const shouldBeDisabled = isCrepeOrPostreBase && isCrepeLimitReached && !isSelected;

                  return (
                      <button
                          key={mod.id}
                          onClick={() => handleModifierChange(mod)}
                          disabled={shouldBeDisabled}
                          className={`
                            btn h-auto min-h-[3.5rem] py-2 px-3 flex flex-col leading-tight normal-case border 
                            ${isSelected ? 'btn-primary border-primary shadow-md' : 'btn-ghost bg-base-100 border-base-300 hover:border-primary/50'}
                            ${shouldBeDisabled ? 'opacity-30' : ''}
                          `}
                      >
                          <span className="text-sm font-semibold">{mod.name}</span>
                          {mod.price > 0 && (
                              <span className={`text-xs font-normal mt-1 ${isSelected ? 'text-primary-content/90' : 'text-base-content/60'}`}>
                                  +${mod.price.toFixed(2)}
                              </span>
                          )}
                      </button>
                  );
              })}
          </div>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-base-200 bg-base-100 flex gap-3">
        <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)} className="btn btn-ghost text-base-content/70">
            {step === 0 ? 'Cancelar' : 'Atrás'}
        </button>
        {isLastStep ? (
            <button onClick={handleAddToTicket} disabled={!isValid} className="btn btn-primary flex-1 shadow-lg shadow-primary/20">
                Agregar ${currentPrice.toFixed(2)}
            </button>
        ) : (
            <button onClick={() => setStep(s => s + 1)} disabled={!isStepValid} className="btn btn-secondary flex-1">
                Siguiente
            </button>
        )}
      </div>
    </Modal>
  );
}