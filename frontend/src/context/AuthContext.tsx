import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8005';

interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  password_needs_reset: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  requestPasswordReset: (username: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configurar axios interceptor para incluir token en requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Interceptor para manejar errores de autenticación
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          console.log('🔒 Token expirado o inválido - cerrando sesión automáticamente');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  // Función para validar token con el servidor
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  };

  // Cargar token del localStorage al inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Verificar si el usuario está activo al cargar desde localStorage
          if (!parsedUser.is_active) {
            console.log('Usuario inactivo detectado, cerrando sesión...');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setIsLoading(false);
            return;
          }
          
          // Primero establecer el token y usuario desde localStorage
          console.log('🔄 Restaurando sesión desde localStorage para:', parsedUser.username);
          setToken(savedToken);
          setUser(parsedUser);
          
          // Validar token con el servidor en segundo plano
          // Si falla, el interceptor de axios se encargará de hacer logout automáticamente
          try {
            await validateToken(savedToken);
            console.log('✅ Token válido - sesión mantenida para:', parsedUser.username);
          } catch (error) {
            console.log('⚠️ Error validando token, pero manteniendo sesión. El interceptor manejará errores 401.');
          }
          
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      // Verificar si el usuario está activo
      if (!userData.is_active) {
        setError('Esta cuenta está desactivada. Por favor, contacte al administrador.');
        setIsLoading(false);
        return false;
      }
      
      setToken(access_token);
      setUser(userData);
      
      // Guardar en localStorage
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      setIsLoading(false);
      
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Error de conexión. Verifica que el servidor esté funcionando.');
      }
      
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const clearError = () => {
    setError(null);
  };

  const requestPasswordReset = async (username: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/auth/password-reset-request`, {
        username
      });
      
      return response.status === 200;
    } catch (error: any) {
      // Manejar errores de validación de Pydantic (422)
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.detail;
        if (Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map((err: any) => err.msg).join(', ');
          setError(errorMessages);
        } else {
          setError('Error de validación en los datos enviados');
        }
      } else {
        setError(error.response?.data?.detail || 'Error al solicitar recuperación de contraseña');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      return response.status === 200;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al cambiar contraseña');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    clearError,
    requestPasswordReset,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
