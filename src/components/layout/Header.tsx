import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, CreditCard } from '../../utils/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { getAvatarUrl, handleAvatarError } from '../../utils/avatar';
import { NotificationDropdown } from '../ui/NotificationDropdown';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Definir rutas de navegación basadas en autenticación  
  const navigation = [
    { name: 'Inicio', href: '/', requiresAuth: false },
    { name: 'Sobre Nosotros', href: '/about', requiresAuth: false },
    { name: 'Blog', href: '/blog', requiresAuth: false }, // Añadimos el blog para todos los usuarios
    { name: 'Reservas', href: '/reservations', requiresAuth: true },
    { name: 'Productos', href: '/products', requiresAuth: true },
    { name: 'Limpieza', href: '/cleaning', requiresAuth: true }, // Añadimos el sistema de limpieza para usuarios
    // Eliminados los enlaces individuales para añadirlos al menú desplegable
  ];

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuRef]);

  // Filtrar las rutas de navegación basadas en si el usuario está autenticado o no
  const filteredNavigation = navigation.filter(item => 
    !item.requiresAuth || (item.requiresAuth && user)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-dark-700 border-b border-dark-600 sticky top-0 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/images/logo.svg" alt="Megaverse Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">MEGAVERSE</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary-400 bg-dark-800'
                    : 'text-gray-300 hover:text-white hover:bg-dark-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notificaciones */}
                <NotificationDropdown />
                
                {/* Avatar y saludo con menú desplegable */}
                <div className="relative" ref={userMenuRef}>
                  <div 
                    className="flex items-center text-gray-300 text-sm hover:text-primary-400 transition-colors cursor-pointer" 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {user.avatar_url ? (
                      <div className="avatar avatar-header">
                        <img 
                          src={getAvatarUrl(user.avatar_url) || undefined}
                          alt="Avatar" 
                          onLoad={() => console.log('Avatar cargado exitosamente en Header')}
                          onError={(e) => handleAvatarError(e.currentTarget)}
                        />
                      </div>
                    ) : (
                      <div className="avatar avatar-header avatar-placeholder">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <span className="mx-2">
                      Hola, <span className="font-semibold">{user.name}</span>
                    </span>
                    {/* Icono de flecha para indicar desplegable */}
                    <svg 
                      className={`w-4 h-4 transition-transform ${userMenuOpen ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Menú desplegable */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-lg py-1 z-40 border border-dark-600">
                      <Link 
                        to="/profile" 
                        className="flex px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-primary-400"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Mi Perfil
                      </Link>                      <Link 
                        to="/payments/history" 
                        className="flex px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-primary-400"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Historial de Pagos
                      </Link>
                    </div>
                  )}
                </div>

                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Salir
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
