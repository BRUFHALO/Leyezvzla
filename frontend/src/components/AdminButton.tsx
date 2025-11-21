import React from 'react';
import { ShieldIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminButton: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-300">
          Bienvenido, {user.username}
        </span>
        <Link 
          to="/admin/dashboard" 
          className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <LayoutDashboard size={16} className="mr-1.5" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          <LogOut size={16} className="mr-1.5" />
          <span className="text-sm font-medium">Salir</span>
        </button>
      </div>
    );
  }

  return (
    <Link 
      to="/admin" 
      className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
    >
      <ShieldIcon size={16} className="mr-1.5" />
      <span className="text-sm font-medium">Admin</span>
    </Link>
  );
};