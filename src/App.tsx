// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';

// Layout y Componente de Seguridad
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute'; // <--- IMPORTAR

// Páginas
import { LoginScreen } from './components/LoginScreen';
import { PosPage } from './pages/PosPage';
import { OrdersScreen } from './components/OrdersScreen';
import { ShiftsScreen } from './components/ShiftsScreen';
import { MovementsScreen } from './components/MovementsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { UsersScreen } from './components/UsersScreen';
import { AdminMenuScreen } from './components/AdminMenuScreen';
import type { UserRole } from './types/user';
import { BranchesManager } from './components/admin/BranchesManager';
import { InventoryByBranchScreen } from './components/admin/InventoryByBranchScreen';
function App() {
  const { currentUser } = useAuthStore();

  if (!currentUser) {
      return (
        <>
          <Toaster position="top-center" richColors />
          <LoginScreen />
        </>
      );
  }

  // Definimos roles comunes para reutilizar
  const STAFF_ROLES: UserRole[] = ['CAJERO', 'GERENTE', 'ADMIN']; 
  const ADMIN_ONLY: UserRole[] = ['ADMIN'];

  return (
    <>
      <Toaster position="top-center" richColors closeButton />

      <Routes>
        <Route element={<MainLayout />}>
          
          {/* ACCESO TOTAL: Todos (incluido Mesero) pueden ver el POS */}
          <Route path="/" element={<PosPage />} />

          {/* ACCESO STAFF: Mesero NO puede entrar aquí */}
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <OrdersScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/shifts" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
               <ShiftsScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/movements" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
               <MovementsScreen />
            </ProtectedRoute>
          } />

          {/* ACCESO ADMIN: Solo el dueño entra aquí */}
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
               <ReportsScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
               <UsersScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-menu" element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
               <AdminMenuScreen />
            </ProtectedRoute>
          } />
<Route path="/branches" element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
               <BranchesManager />
            </ProtectedRoute>
          } />

          <Route path="/inventory-branch" element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
               <InventoryByBranchScreen />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Route>
      </Routes>
    </>
  );
}

export default App;