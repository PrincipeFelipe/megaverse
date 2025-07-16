import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, CreditCard, Menu, X, Calendar, ShoppingCart } from '../../utils/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { getAvatarUrl, handleAvatarError } from '../../utils/avatar';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { createModuleLogger } from '../../utils/loggerExampleUsage';

// Crear logger para el componente Header
const headerLogger = createModuleLogger('UI');

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const forceUpdate = useForceUpdate();
  
  // Debug: loggar cuando cambie el usuario
  useEffect(() => {
    headerLogger.debug('Usuario actualizado en Header', { 
      hasUser: !!user, 
      userId: user?.id,
      username: user?.username 
    });
    if (user?.avatar_url) {
      const transformedUrl = getAvatarUrl(user.avatar_url);
      headerLogger.debug('Avatar configurado en Header', { 
        originalUrl: user.avatar_url,
        transformedUrl,
        userId: user.id
      });
      // Forzar actualización del componente cuando cambie el avatar
      forceUpdate();
    }
  }, [user, forceUpdate]);
  
  // Definir rutas de navegación basadas en autenticación  
  const navigation = [
    { name: 'Inicio', href: '/', requiresAuth: false },
    { name: 'Sobre Nosotros', href: '/about', requiresAuth: false },
    { name: 'Blog', href: '/blog', requiresAuth: false } // Enlaces públicos solamente
  ];

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuRef, mobileMenuRef]);

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

          {/* Botón de menú móvil */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Navegación de escritorio */}
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

          {/* User Menu de escritorio */}
          <div className="hidden md:flex items-center space-x-4">
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
                          key={`avatar-${user.id}-${user.avatar_url}-${Date.now()}`}
                          src={getAvatarUrl(user.avatar_url, undefined, true) || undefined}
                          alt="Avatar" 
                          onLoad={() => headerLogger.debug('Avatar cargado exitosamente en Header', { userId: user.id })}
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
                      </Link>
                      
                      <Link 
                        to="/consumption-payments" 
                        className="flex px-4 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-primary-400"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Mis Consumos
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

      {/* Menú móvil */}
      <div
        ref={mobileMenuRef}
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:hidden fixed inset-0 z-40 bg-dark-900 bg-opacity-75`}
      >
        <div 
          className={`fixed inset-y-0 right-0 max-w-xs w-full bg-dark-800 shadow-lg overflow-y-auto ${
            mobileMenuOpen ? 'mobile-menu-slide-in' : 'mobile-menu-slide-out'
          }`}
        >
          <div className="px-4 pt-5 pb-2 flex justify-between">
            <div className="flex items-center">
              <img src="/images/logo.svg" alt="Megaverse Logo" className="w-6 h-6 mr-2" />
              <span className="text-lg font-bold text-white">MEGAVERSE</span>
            </div>
            <button
              type="button"
              className="text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navegación móvil */}
          <div className="mt-4 px-2 space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary-400 bg-dark-700'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Enlaces principales para usuarios autenticados */}
          {user && (
            <div className="mt-4 px-2 space-y-1 border-t border-dark-600 pt-4">
              <Link
                to="/reservations"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/reservations')
                    ? 'text-primary-400 bg-dark-700'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3" />
                  Reservas
                </div>
              </Link>
              <Link
                to="/products"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/products')
                    ? 'text-primary-400 bg-dark-700'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  Productos
                </div>
              </Link>
            </div>
          )}

          {/* Menú de usuario móvil */}
          {user ? (
            <div className="mt-6 px-4 py-4 border-t border-dark-600">
              <div className="flex items-center mb-4">
                {user.avatar_url ? (
                  <div className="avatar avatar-header">
                    <img 
                      src={getAvatarUrl(user.avatar_url, undefined, true) || undefined}
                      alt="Avatar" 
                      onError={(e) => handleAvatarError(e.currentTarget)}
                    />
                  </div>
                ) : (
                  <div className="avatar avatar-header avatar-placeholder">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.name}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-dark-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    Dashboard
                  </div>
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-dark-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    Mi Perfil
                  </div>
                </Link>

                <Link
                  to="/consumption-payments"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-dark-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-3" />
                    Mis Consumos
                  </div>
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-dark-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 mr-3" />
                      Panel Admin
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-dark-700"
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 mr-3" />
                    Salir
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 px-4 py-4 border-t border-dark-600">
              <Link
                to="/auth"
                className="block w-full py-2 px-3 text-center rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
