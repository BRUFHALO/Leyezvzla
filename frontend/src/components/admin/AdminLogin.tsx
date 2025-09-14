import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LockIcon, UserIcon, MailIcon } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const { login, error, clearError, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();
    
    const success = await login(username, password);
    if (success) {
      navigate('/admin/dashboard');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage('');
    clearError();
    
    const success = await requestPasswordReset(resetEmail);
    if (success) {
      setResetMessage('Se ha enviado un enlace de recuperación a su correo electrónico.');
      setResetEmail('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <LockIcon size={28} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Panel Administrativo
          </h1>
          <p className="text-gray-500 mt-1">
            {showForgotPassword ? 'Recuperar contraseña' : 'Ingrese sus credenciales para acceder'}
          </p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>}
          
        {resetMessage && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            {resetMessage}
          </div>}

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <UserIcon size={18} className="text-gray-400" />
              </div>
              <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="admin" required />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LockIcon size={18} className="text-gray-400" />
              </div>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" required />
            </div>
          </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md transition-colors font-medium"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <div className="mb-4">
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MailIcon size={18} className="text-gray-400" />
                </div>
                <input 
                  id="resetEmail" 
                  type="email" 
                  value={resetEmail} 
                  onChange={e => setResetEmail(e.target.value)} 
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="admin1@leyesvzla.com" 
                  required 
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-md transition-colors font-medium"
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}
        
        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={() => {
              setShowForgotPassword(!showForgotPassword);
              setResetMessage('');
              clearError();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showForgotPassword ? '← Volver al login' : '¿Olvidó su contraseña?'}
          </button>
        </div>
        
        {!showForgotPassword && (
        <p></p>
        )}
      </div>
    </div>
  );
};