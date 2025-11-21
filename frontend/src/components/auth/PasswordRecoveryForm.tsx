import React, { useState } from 'react';
import { User, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

interface PasswordRecoveryFormProps {
  onBack?: () => void;
}

export const PasswordRecoveryForm: React.FC<PasswordRecoveryFormProps> = ({ onBack }) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial');
    }
    
    return errors;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username) {
      setError('El nombre de usuario es obligatorio');
      return;
    }

    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005'}/auth/password-reset-request`, {
        username: username
      });

      setSuccess('Si el usuario existe, se enviará una contraseña temporal por Telegram al administrador.');
      setTimeout(() => {
        setStep('reset');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al solicitar recuperación de contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(`La contraseña no cumple los requisitos:\n${passwordErrors.join('\n')}`);
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005'}/auth/password-reset`, {
        token: token,
        new_password: newPassword
      });

      setSuccess('Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.');
      setTimeout(() => {
        if (onBack) onBack();
      }, 3000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al restablecer la contraseña. Verifica que el token sea correcto.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    const errors = validatePassword(password);
    if (password.length === 0) return { strength: 0, color: 'bg-gray-200' };
    if (errors.length > 3) return { strength: 25, color: 'bg-red-500' };
    if (errors.length > 1) return { strength: 50, color: 'bg-yellow-500' };
    if (errors.length === 1) return { strength: 75, color: 'bg-blue-500' };
    return { strength: 100, color: 'bg-green-500' };
  };

  const { strength, color } = passwordStrength(newPassword);

  if (step === 'request') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          )}
          <User className="mr-2 text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Recuperar Contraseña</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="mr-2 text-red-500 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircle className="mr-2 text-green-500" size={16} />
            <div className="text-green-700 text-sm">{success}</div>
          </div>
        )}

        <p className="text-gray-600 text-sm mb-4">
          Ingresa tu nombre de usuario y se enviará una contraseña temporal por Telegram al administrador.
        </p>

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa tu nombre de usuario"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Enviando...' : 'Solicitar Recuperación'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep('reset')}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={isLoading}
            >
              ¿Ya tienes un token de recuperación?
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setStep('request')}
          className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <User className="mr-2 text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Restablecer Contraseña</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="mr-2 text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle className="mr-2 text-green-500" size={16} />
          <div className="text-green-700 text-sm">{success}</div>
        </div>
      )}

      <p className="text-gray-600 text-sm mb-4">
        Ingresa la contraseña temporal que recibiste por Telegram y tu nueva contraseña.
      </p>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña Temporal
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ingresa la contraseña temporal recibida por Telegram"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Nueva Contraseña
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Ingresa tu nueva contraseña"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {newPassword && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Fortaleza de la contraseña</span>
                <span>{strength}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${color}`}
                  style={{ width: `${strength}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Nueva Contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Confirma tu nueva contraseña"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">La contraseña debe contener:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Al menos 8 caracteres</li>
            <li>Una letra mayúscula</li>
            <li>Una letra minúscula</li>
            <li>Un número</li>
            <li>Un carácter especial (!@#$%^&*(),.?":{}|&lt;&gt;)</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading || !token || !newPassword || !confirmPassword}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
        </button>
      </form>
    </div>
  );
};
