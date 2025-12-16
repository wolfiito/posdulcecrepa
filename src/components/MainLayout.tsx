import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useShiftStore } from '../store/useShiftStore'; // <--- 1. IMPORTAR STORE DE CAJA
import { 
  IconMenu, IconPOS, IconBox, IconWallet, IconChart, 
  IconUsers, IconSun, IconMoon, IconLogout, IconBack 
} from './Icons';

export const MainLayout: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const { theme, toggleTheme, view, setView } = useUIStore();
  const { startListeningToShift, stopListeningToShift } = useShiftStore(); // <--- 2. OBTENER FUNCIONES
  const location = useLocation();

  // Cerrar el drawer al cambiar de ruta en móvil
  useEffect(() => {
    document.getElementById('main-drawer')?.click();
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- 3. EL CEREBRO GLOBAL (ESTO ES LO QUE FALTABA) ---
  // Esto mantiene la caja vigilada en TODAS las pantallas
  useEffect(() => {
    if (currentUser) {
        console.log("📡 Iniciando escucha de caja global...");
        startListeningToShift();
    }
    return () => stopListeningToShift();
  }, [currentUser, startListeningToShift, stopListeningToShift]);
  // -----------------------------------------------------
  
  // Verificar si estamos en la ruta raíz (POS)
  const isPos = location.pathname === '/';

  // Helper para clases de enlace activo
  const getLinkClass = (path: string) => 
    location.pathname === path ? 'active font-bold' : '';

  return (
    <div className="drawer">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col min-h-screen bg-base-200 transition-colors duration-300 pb-[140px]">
        {/* Navbar */}
        <div className="navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-40 shadow-sm px-2 border-b border-base-200 h-16">
          <div className="navbar-start flex gap-1 items-center w-auto">
              {isPos && view === 'ticket' ? (
                  <button onClick={() => setView('menu')} className="btn btn-ghost btn-circle m-1 text-primary">
                      <IconBack />
                  </button>
              ) : (
                  <label htmlFor="main-drawer" className="btn btn-ghost btn-circle m-1 drawer-button">
                      <IconMenu />
                  </label>
              )}
              <span className="text-lg font-black tracking-tight text-base-content ml-2 hidden sm:inline">
                  DulceCrepa
              </span>
          </div>
        </div>

        <main className="p-4 max-w-5xl mx-auto w-full animate-fade-in flex-1">
            <Outlet />
        </main>
      </div>

      {/* SIDEBAR */}
      <div className="drawer-side z-50">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base-content gap-2">
          
          <li className="mb-4 border-b border-base-200 pb-4">
             <div className="flex flex-col gap-1 items-start pointer-events-none">
                <span className="font-black text-2xl text-primary">Dulce Crepa</span>
                <span className="text-xs font-bold">{currentUser?.name || 'Usuario'}</span>
                <span className="badge badge-sm badge-ghost">{currentUser?.role}</span>
             </div>
          </li>
          
          {/* Menú General */}
          <li>
            <Link to="/" className={getLinkClass('/')}>
                <IconPOS /> Punto de Venta
            </Link>
          </li>
          {['CAJERO', 'GERENTE', 'ADMIN'].includes(currentUser?.role || '') && (
            <li>
                <Link to="/orders" className={getLinkClass('/orders')}>
                    <span className="text-xl">🔔</span> Órdenes Pendientes
                </Link>
            </li>
          )}

          <div className="divider my-1"></div>

          {/* Menú Operativo */}
          {['CAJERO', 'GERENTE', 'ADMIN'].includes(currentUser?.role || '') && (
            <>
                <li>
                    <Link to="/shifts" className={getLinkClass('/shifts')}>
                        <IconBox /> Caja y Turnos
                    </Link>
                </li>
                <li>
                    <Link to="/movements" className={getLinkClass('/movements')}>
                        <IconWallet /> Gastos
                    </Link>
                </li>
            </>
          )}

          <div className="divider my-1"></div>

          {/* Menú Admin */}
          {currentUser?.role === 'ADMIN' && (
            <>
                <li className="menu-title opacity-50">Administración</li>
                <li>
                    <Link to="/reports" className={getLinkClass('/reports')}>
                        <IconChart /> Reportes
                    </Link>
                </li>
                <li>
                    <Link to="/users" className={getLinkClass('/users')}>
                        <IconUsers /> Usuarios
                    </Link>
                </li>
                <li>
                    <Link to="/admin-menu" className={getLinkClass('/admin-menu')}>
                        <span className="text-xl">🛠️</span> Editor de Menú
                    </Link>
                </li>
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
        </ul>
      </div>
    </div>
  );
};