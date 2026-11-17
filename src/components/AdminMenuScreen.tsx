// src/components/AdminMenuScreen.tsx
import React, { useState } from 'react';
import { ProductsManager } from './admin/ProductsManager';
import { GroupsManager } from './admin/GroupsManager'; 
import { OptionsManager } from './admin/OptionsManager';
import { PriceRulesManager } from './admin/PriceRulesManager';
import { CircleDollarSign, Folder, Layers, ListChecks, Utensils } from 'lucide-react';

export const AdminMenuScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'groups' | 'options' | 'rules'>('items');

  const tabs = [
    { id: 'items', label: 'Productos', icon: Utensils, color: 'primary' },
    { id: 'options', label: 'Opciones', icon: ListChecks, color: 'secondary' },
    { id: 'groups', label: 'Categorías', icon: Folder, color: 'primary' },
    { id: 'rules', label: 'Reglas', icon: CircleDollarSign, color: 'warning' },
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-20 px-2 sm:px-4">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-4 gap-2">
        <h2 className="text-2xl sm:text-3xl font-black text-primary flex items-center gap-2">
          <Layers size={28} className="shrink-0" /> Editor de Menú
        </h2>
        <span className="badge badge-ghost badge-sm opacity-60">Modo Administrador</span>
      </div>

      {/* TABS RESPONSIVAS: Scroll horizontal en móvil, expandidas en PC */}
      <div className="flex overflow-x-auto no-scrollbar mb-0 bg-base-200/50 rounded-t-2xl p-1 gap-1 border-x border-t border-base-300">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex-none sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-base-100 text-primary shadow-sm scale-[1.02]' 
                : 'text-base-content/60 hover:bg-base-100/50'}
            `}
          >
            <tab.icon size={16} className="shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenedor de Contenido */}
      <div className="bg-base-100 border-x border-b border-base-300 rounded-b-2xl p-3 sm:p-6 min-h-[600px] shadow-sm">
        <div className="max-w-full overflow-hidden">
            {activeTab === 'groups' && <GroupsManager />}
            {activeTab === 'items' && <ProductsManager />}
            
            {activeTab === 'options' && <OptionsManager />}

            {activeTab === 'rules' && <PriceRulesManager />}
        </div>
      </div>

      {/* Estilos para ocultar scrollbar pero mantener funcionalidad */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};