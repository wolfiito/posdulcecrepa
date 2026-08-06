import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';

import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DatabaseSeeder } from './components/admin/DatabaseSeeder';
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
import ImagePreloader from './components/ImagePreloader';

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

  const STAFF_ROLES: UserRole[] = ['CAJERO', 'GERENTE', 'ADMIN'];
  const ADMIN_ONLY: UserRole[] = ['ADMIN'];

  return (
    <>
      <ImagePreloader />
      <Toaster position="top-center" richColors closeButton />

      <Routes>
        <Route element={<MainLayout />}>


          <Route path="/" element={<PosPage />} />


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
               <div className="flex flex-col sm:flex-row gap-4 mb-6">

                   {(currentUser?.username == '2310' || currentUser?.id == '2310') && <DatabaseSeeder />}

               </div>
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