import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children
}) => {
  const {
    isAuthenticated
  } = useAdmin();
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};