import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, CheckCircle2, XCircle } from 'lucide-react';

export const ProfileManagement: React.FC = () => {
  const { user, changePassword, error, clearError } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false
  });

  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: newPassword === confirmPassword
    };
    
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  // Efecto para validar la contraseña en tiempo real
  useEffect(() => {
    if (newPassword || confirmPassword) {
      validatePassword(newPassword);
    }
  }, [newPassword, confirmPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    clearError();

    if (newPassword !== confirmPassword) {
      setPasswordRequirements(prev => ({ ...prev, passwordsMatch: false }));
      alert('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (!validatePassword(newPassword)) {
      setIsLoading(false);
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setSuccessMessage('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Perfil</h2>
      
      {/* Información del Usuario */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Información del Usuario</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <UserIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="pl-10 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MailIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="pl-10 w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cambio de Contraseña */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Cambiar Contraseña</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="grid grid-cols-1 gap-4">
            {/* Contraseña Actual */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Actual
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockIcon size={18} className="text-gray-400" />
                </div>
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese su contraseña actual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showCurrentPassword ? (
                    <EyeOffIcon size={18} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon size={18} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockIcon size={18} className="text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese su nueva contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showNewPassword ? (
                    <EyeOffIcon size={18} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon size={18} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockIcon size={18} className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirme su nueva contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon size={18} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon size={18} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              La contraseña debe contener:
            </p>
            <ul className="text-sm space-y-1.5">
              <li className={`flex items-center ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.minLength ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-400" />
                )}
                8 caracteres mínimo
              </li>
              <li className={`flex items-center ${passwordRequirements.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.hasUpper ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-400" />
                )}
                Al menos una letra mayúscula (A-Z)
              </li>
              <li className={`flex items-center ${passwordRequirements.hasLower ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.hasLower ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-400" />
                )}
                Al menos una letra minúscula (a-z)
              </li>
              <li className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.hasNumber ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-400" />
                )}
                Al menos un número (0-9)
              </li>
              <li className={`flex items-center ${passwordRequirements.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.hasSpecial ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-400" />
                )}
                Al menos un carácter especial (!@#$%^&*)
              </li>
              <li className={`flex items-center ${passwordRequirements.passwordsMatch && confirmPassword ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.passwordsMatch && confirmPassword ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-400" />
                )}
                Las contraseñas coinciden
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || !Object.values(passwordRequirements).every(Boolean) || !currentPassword}
            className={`mt-6 text-white py-2 px-4 rounded-md transition-colors font-medium ${
              isLoading || !Object.values(passwordRequirements).every(Boolean) || !currentPassword
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};
