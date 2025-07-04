import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Calendar, ShoppingCart, Trash2 } from '../../utils/icons';
import { Card } from '../ui/Card';

interface MenuItem {
  name: string;
  icon: JSX.Element;
  path: string;
  active: boolean;
}

export const UserSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Definir las opciones de navegación para usuarios
  const menuItems: MenuItem[] = [
    { 
      name: 'Dashboard', 
      icon: <User className="w-5 h-5" />, 
      path: '/dashboard',
      active: currentPath === '/dashboard'
    },
    { 
      name: 'Reservas', 
      icon: <Calendar className="w-5 h-5" />, 
      path: '/reservations',
      active: currentPath === '/reservations'
    },
    { 
      name: 'Productos', 
      icon: <ShoppingCart className="w-5 h-5" />, 
      path: '/products',
      active: currentPath === '/products'
    },
    { 
      name: 'Limpieza', 
      icon: <Trash2 className="w-5 h-5" />, 
      path: '/cleaning',
      active: currentPath === '/cleaning'
    }
  ];
  
  return (
    <Card className="sticky top-20 shadow-md">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-dark-700 dark:text-secondary-300 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Menú
        </h2>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                item.active
                  ? 'bg-primary-100 dark:bg-primary-800/30 text-primary-600 dark:text-primary-300'
                  : 'text-dark-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700/50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </Card>
  );
};
