import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';
import { authService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Propagamos el error para manejarlo en la página de autenticación
    }
  };

  const register = async (name: string, username: string, email: string, phone: string, dni: string, password: string): Promise<boolean> => {
    try {
      await authService.register(name, username, email, phone, dni, password);
      // Como hemos configurado que los nuevos usuarios estén inactivos,
      // no debemos iniciar sesión automáticamente
      // Solo mostramos un mensaje de registro exitoso
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Propagamos el error para manejarlo en la página de autenticación
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Nueva función para actualizar el usuario
  const updateUserData = async () => {
    try {
      const userData = await authService.getProfile();
      
      // Log para depuración
      console.log('Datos actualizados del usuario obtenidos en AuthContext:', {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        dni: userData.dni,
        phone: userData.phone,
        avatar_url: userData.avatar_url
      });
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error al actualizar datos de usuario:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    register,
    loading,
    updateUserData, // Agregamos la nueva función al contexto
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};