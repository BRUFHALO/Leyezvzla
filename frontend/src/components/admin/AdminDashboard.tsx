import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../ProtectedRoute';
import { AdminLawCatalog } from './AdminLawCatalog';
import { AdminPaymentOptions } from './AdminPaymentOptions';
import { AdminCustomerSelections } from './AdminCustomerSelections';
import { AdminEncuadernacion } from './AdminEncuadernacion';
import { AdminDeliveredQuotations } from './AdminDeliveredQuotations';
import { ProfileManagement } from './ProfileManagement';
import { UserManagement } from './UserManagement';
import { BookIcon, CreditCardIcon, HomeIcon, LogOutIcon, UsersIcon, PackageIcon, UserIcon, SettingsIcon } from 'lucide-react';
export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'laws' | 'payments' | 'customers' | 'encuadernacion' | 'delivered' | 'profile' | 'users'>('laws');
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookIcon size={24} className="text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">
                Panel Administrativo
              </h1>
            </div>
            <div className="flex space-x-4">
              <button onClick={() => navigate('/')} className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                <HomeIcon size={16} className="mr-1.5" />
                Volver al Inicio
              </button>
              <button onClick={handleLogout} className="flex items-center px-3 py-2 border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50">
                <LogOutIcon size={16} className="mr-1.5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button onClick={() => setActiveTab('laws')} className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'laws' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <BookIcon size={18} className="mr-1.5" />
              Catálogo de Leyes
            </button>
            <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'payments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <CreditCardIcon size={18} className="mr-1.5" />
              Opciones de Pago
            </button>
            <button onClick={() => setActiveTab('customers')} className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'customers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <UsersIcon size={18} className="mr-1.5" />
              Cotizaciones de Clientes
            </button>
            <button
              onClick={() => setActiveTab('encuadernacion')}
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'encuadernacion' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PackageIcon size={18} className="mr-1.5" />
              Encuadernación
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'delivered' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PackageIcon size={18} className="mr-1.5" />
              Entregadas
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserIcon size={18} className="mr-1.5" />
              Mi Perfil
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SettingsIcon size={18} className="mr-1.5" />
              Gestión de Usuarios
            </button>
          </div>
        </div>
        {activeTab === 'laws' && <AdminLawCatalog />}
        {activeTab === 'payments' && <AdminPaymentOptions />}
        {activeTab === 'customers' && <AdminCustomerSelections />}
        {activeTab === 'encuadernacion' && <AdminEncuadernacion />}
        {activeTab === 'delivered' && <AdminDeliveredQuotations />}
        {activeTab === 'profile' && <ProfileManagement />}
        {activeTab === 'users' && <UserManagement />}
      </main>
    </div>
    </ProtectedRoute>
  );
};