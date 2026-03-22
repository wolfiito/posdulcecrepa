// src/components/AdminMenuScreen.tsx
import React, { useState } from 'react';
import { ModifiersManager } from './admin/ModifiersManager';
import { ProductsManager } from './admin/ProductsManager';
import { GroupsManager } from './admin/GroupsManager'; 
import { ModifierGroupsManager } from './admin/ModifierGroupsManager';
import { PriceRulesManager } from './admin/PriceRulesManager';

export const AdminMenuScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'modifiers' | 'items' | 'groups' | 'mod_groups' | 'rules'>('groups');

  const tabs = [
    { id: 'groups', label: '📂 Categorías', color: 'primary' },
    { id: 'items', label: '🍕 Productos', color: 'primary' },
    { id: 'mod_groups', label: '📋 Listas', color: 'info' },
    { id: 'modifiers', label: '🥦 Ingredientes', color: 'secondary' },
    { id: 'rules', label: '💰 Reglas', color: 'warning' },
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-20 px-2 sm:px-4">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-4 gap-2">
        <h2 className="text-2xl sm:text-3xl font-black text-primary flex items-center gap-2">
          <span>🛠️</span> Editor de Menú
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
              flex-none sm:flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-base-100 text-primary shadow-sm scale-[1.02]' 
                : 'text-base-content/60 hover:bg-base-100/50'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenedor de Contenido */}
      <div className="bg-base-100 border-x border-b border-base-300 rounded-b-2xl p-3 sm:p-6 min-h-[600px] shadow-sm">
        <div className="max-w-full overflow-hidden">
            {activeTab === 'groups' && <GroupsManager />}
            {activeTab === 'items' && <ProductsManager />}
            
            {activeTab === 'mod_groups' && (
                <div className="animate-fade-in">
                    <div className="alert alert-info shadow-sm mb-6 py-3 text-xs sm:text-sm bg-info/10 border-info/20 text-info-content">
                        <div className="flex gap-2">
                            <span>💡</span>
                            <p>Crea aquí las listas de opciones (ej. <b>"Sabores de Soda"</b>). Luego agrega los sabores en la pestaña "Ingredientes".</p>
                        </div>
                    </div>
                    <ModifierGroupsManager />
                </div>
            )}

            {activeTab === 'modifiers' && <ModifiersManager />}

            {activeTab === 'rules' && (
                <div className="animate-fade-in">
                    <div className="alert alert-warning shadow-sm mb-6 py-3 text-xs sm:text-sm bg-warning/10 border-warning/20 text-warning-content">
                        <div className="flex gap-2">
                            <span>💡</span>
                            <p>Define cómo escala el precio por ingrediente. Estas reglas se asignan a las <b>Categorías</b> armables.</p>
                        </div>
                    </div>
                    <PriceRulesManager />
                </div>
            )}
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