// src/components/MainLayout.tsx
import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useShiftStore } from '../store/useShiftStore'; 
import { 
  IconMenu, IconPOS, IconBox, IconWallet, IconChart, 
  IconUsers, IconSun, IconMoon, IconLogout, IconBack 
} from './Icons';

export const MainLayout: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const { theme, toggleTheme, view, setView } = useUIStore();
  const { startListeningToShift, stopListeningToShift } = useShiftStore(); 
  const location = useLocation();

  // Cerrar drawer al navegar
  useEffect(() => {
    document.getElementById('main-drawer')?.click();
  }, [location.pathname]);

  // Sincronizar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Escuchar caja
  useEffect(() => {
    if (currentUser) {
        startListeningToShift();
    }
    return () => stopListeningToShift();
  }, [currentUser, startListeningToShift, stopListeningToShift]);
  
  const isPos = location.pathname === '/';
  const getLinkClass = (path: string) => 
    location.pathname === path ? 'active font-bold' : '';

  return (
    <div className="drawer h-dvh w-screen overflow-hidden">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="drawer-content flex flex-col bg-base-200 h-full overflow-hidden">
        
        {/* --- HEADER NATIVO SOLIDO --- */}
        <div className="flex-none w-full flex flex-col z-40 shadow-sm">
            
            {/* 1. BARRA DE ESTADO (Notch/Hora) 
                Esta barra solo existe para pintar el fondo detrás de la hora
                y empujar el navbar hacia abajo. */}
            <div className="w-full bg-base-100" style={{ height: 'max(env(safe-area-inset-top), 20px)' }}></div>

            {/* 2. NAVBAR REAL 
                Quitamos transparencias (/90) para evitar el "rosa fuerte" raro.
                Ahora es sólido y limpio. */}
            <div className="navbar bg-base-100 border-b border-base-200 h-16 min-h-[4rem] px-2 w-full">
                <div className="navbar-start flex gap-1 items-center w-full">
                    {isPos && view === 'ticket' ? (
                        <button onClick={() => setView('menu')} className="btn btn-ghost btn-circle text-primary">
                            <IconBack />
                        </button>
                    ) : (
                        <label htmlFor="main-drawer" className="btn btn-ghost btn-circle drawer-button">
                            <IconMenu />
                        </label>
                    )}
                    <span className="text-lg font-black tracking-tight text-base-content ml-2 hidden sm:inline">
                        DulceCrepa
                    </span>
                </div>
            </div>
        </div>

        {/* --- AREA DE CONTENIDO --- */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 w-full max-w-5xl mx-auto animate-fade-in safe-pb scroll-smooth">
            <Outlet />
            {/* Espacio extra al final */}
            <div className="h-20"></div>
        </main>
      </div>

      {/* SIDEBAR (Menú Lateral) */}
      <div className="drawer-side z-50">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        
        {/* Agregamos safe-pt aquí también para que el menú baje */}
        <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base-content gap-2">
          
          {/* Espaciador para el Notch en el menú */}
          <div className="safe-pt w-full"></div>

          <li className="mb-4 border-b border-base-200 pb-4 mt-2">
             <div className="flex flex-col gap-1 items-start pointer-events-none">
                <span className="font-black text-2xl text-primary">Dulce Crepa</span>
                <span className="text-xs font-bold">{currentUser?.name || 'Usuario'}</span>
                <span className="badge badge-sm badge-ghost">{currentUser?.role}</span>
             </div>
          </li>
          
          <li><Link to="/" className={getLinkClass('/')}><IconPOS /> Punto de Venta</Link></li>
          
          {['CAJERO', 'GERENTE', 'ADMIN'].includes(currentUser?.role || '') && (
            <li><Link to="/orders" className={getLinkClass('/orders')}><span className="text-xl">🔔</span> Órdenes Pendientes</Link></li>
          )}

          <div className="divider my-1"></div>

          {['CAJERO', 'GERENTE', 'ADMIN'].includes(currentUser?.role || '') && (
            <>
                <li><Link to="/shifts" className={getLinkClass('/shifts')}><IconBox /> Caja y Turnos</Link></li>
                <li><Link to="/movements" className={getLinkClass('/movements')}><IconWallet /> Gastos</Link></li>
            </>
          )}

          {/* ... resto del menú igual ... */}
          <div className="divider my-1"></div>
           {currentUser?.role === 'ADMIN' && (
            <>
                <li className="menu-title opacity-50">Administración</li>
                <li><Link to="/reports" className={getLinkClass('/reports')}><IconChart /> Reportes</Link></li>
                <li><Link to="/users" className={getLinkClass('/users')}><IconUsers /> Usuarios</Link></li>
                <li><Link to="/admin-menu" className={getLinkClass('/admin-menu')}><span className="text-xl">🛠️</span> Editor de Menú</Link></li>
            </>
          )}

          <div className="mt-auto"></div>
          
          <li>
            <button onClick={toggleTheme} className="flex justify-between bg-base-200">
              <span className="text-xs font-bold">Modo Oscuro</span>
              {theme === 'dulce-dark' ? <IconMoon /> : <IconSun />}
            </button>
          </li>
          <li>
              <button onClick={logout} className="text-error font-bold hover:bg-error/10 flex gap-2">
                  <IconLogout /> Cerrar Sesión
              </button>
          </li>
          
          {/* Espaciador inferior seguro */}
          <div className="safe-pb w-full"></div>
        </ul>
      </div>
    </div>
  );
};