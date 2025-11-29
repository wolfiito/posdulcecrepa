// src/components/AdminMenuScreen.tsx
import React, { useState } from 'react';
import { ModifiersManager } from './admin/ModifiersManager'; // Crearemos esto en el Paso 3
import { ProductsManager } from './admin/ProductsManager';   // Paso 4
import { GroupsManager } from './admin/GroupsManager'; 
import { ModifierGroupsManager } from './admin/ModifierGroupsManager';      // Paso 5
import { PriceRulesManager } from './admin/PriceRulesManager';

export const AdminMenuScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'modifiers' | 'items' | 'groups' | 'mod_groups' | 'rules'>('groups');
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-3xl font-black text-primary flex items-center gap-2"><span>🛠️</span> Editor de Menú</h2>
      </div>

      <div role="tablist" className="tabs tabs-lifted tabs-lg mb-0">
        <a role="tab" className={`tab font-bold ${activeTab === 'groups' ? 'tab-active [--tab-bg:oklch(var(--b1))] text-primary' : ''}`} onClick={() => setActiveTab('groups')}>📂 Categorías</a>
        <a role="tab" className={`tab font-bold ${activeTab === 'items' ? 'tab-active [--tab-bg:oklch(var(--b1))] text-primary' : ''}`} onClick={() => setActiveTab('items')}>🍔 Productos</a>
        
        {/* NUEVA PESTAÑA */}
        <a role="tab" className={`tab font-bold ${activeTab === 'mod_groups' ? 'tab-active [--tab-bg:oklch(var(--b1))] text-secondary' : ''}`} onClick={() => setActiveTab('mod_groups')}>Eq Grupos Opc.</a>
        <a role="tab" className={`tab font-bold ${activeTab === 'rules' ? 'tab-active [--tab-bg:oklch(var(--b1))] text-warning' : ''}`} onClick={() => setActiveTab('rules')}>📏 Reglas Precio</a>
        <a role="tab" className={`tab font-bold ${activeTab === 'modifiers' ? 'tab-active [--tab-bg:oklch(var(--b1))] text-primary' : ''}`} onClick={() => setActiveTab('modifiers')}>🥦 Ingredientes</a>
        <a role="tab" className="tab flex-1 cursor-default pointer-events-none"></a>
      </div>

      <div className="bg-base-100 border-base-300 rounded-b-box rounded-tr-box border p-6 min-h-[600px] shadow-sm">
        {activeTab === 'groups' && <GroupsManager />}
        {activeTab === 'items' && <ProductsManager />}
        
        {/* NUEVO CONTENIDO */}
        {activeTab === 'mod_groups' && (
            <div className="animate-fade-in">
                <div className="alert alert-info shadow-sm mb-4 py-2 text-xs">
                    <span>💡 Crea aquí las listas de opciones (ej. "Sabores de Soda", "Tipos de Leche"). Luego agrega ingredientes a estas listas en la pestaña "Ingredientes".</span>
                </div>
                <ModifierGroupsManager />
            </div>
        )}

{activeTab === 'rules' && (
            <div className="animate-fade-in">
                <div className="alert alert-warning shadow-sm mb-4 py-2 text-xs">
                    <span>💡 Define aquí cómo se cobran los productos armables (ej. "1 ingrediente $30, 2 por $35"). Úsalas en la pestaña "Categorías".</span>
                </div>
                <PriceRulesManager />
            </div>
        )}

        {activeTab === 'modifiers' && <ModifiersManager />}
      </div>
    </div>
  );
};