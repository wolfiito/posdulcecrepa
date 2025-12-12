// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types/user';

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { currentUser } = useAuthStore();

  // 1. Si no hay usuario, mandar a login (aunque App.tsx ya maneja esto, es doble seguridad)
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 2. Si el rol del usuario NO está en la lista de permitidos, sacarlo de ahí
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Si pasa las pruebas, mostrar la pantalla
  return <>{children}</>;
};