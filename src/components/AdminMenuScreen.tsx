// src/components/AdminMenuScreen.tsx
import React, { useState } from 'react';
import { ModifiersManager } from './admin/ModifiersManager'; // Crearemos esto en el Paso 3
import { ProductsManager } from './admin/ProductsManager';   // Paso 4
import { GroupsManager } from './admin/GroupsManager';       // Paso 5

export const AdminMenuScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'modifiers' | 'items' | 'groups'>('items');

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black text-primary flex items-center gap-2">
          <span>🛠️</span> Editor de Menú
        </h2>
      </div>

      {/* Tabs de Navegación */}
      <div role="tablist" className="tabs tabs-boxed bg-base-200 p-2 mb-6">
        <a 
          role="tab" 
          className={`tab tab-lg flex-1 ${activeTab === 'modifiers' ? 'tab-active bg-white font-bold shadow-sm' : ''}`}
          onClick={() => setActiveTab('modifiers')}
        >
          🥦 Ingredientes (Modifiers)
        </a>
        <a 
          role="tab" 
          className={`tab tab-lg flex-1 ${activeTab === 'items' ? 'tab-active bg-white font-bold shadow-sm' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          🍔 Productos
        </a>
        <a 
          role="tab" 
          className={`tab tab-lg flex-1 ${activeTab === 'groups' ? 'tab-active bg-white font-bold shadow-sm' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          📂 Categorías
        </a>
      </div>

      {/* Contenido Dinámico */}
      <div className="bg-base-100 rounded-box shadow-lg border border-base-200 p-6 min-h-[500px]">
        {activeTab === 'modifiers' && <ModifiersManager />}
        {activeTab === 'items' && <ProductsManager />}
        {activeTab === 'groups' && <GroupsManager />}
      </div>
    </div>
  );
};