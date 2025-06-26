import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 to-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-500 border-opacity-80 shadow-lg"></div>
      </div>
    );
  }

  // Redireccionar a la página de autenticación si el usuario no ha iniciado sesión
  // o a la página de inicio si el usuario no es administrador
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
