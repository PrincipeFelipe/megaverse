import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  ShoppingCart, 
  Calendar, 
  Home, 
  BarChart, 
  Coffee, 
  Settings, 
  CreditCard, 
  FileText,
  ChartIcon
} from '../../utils/icons';
import { Card } from '../ui/Card';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

// Definición del tipo para submenu
interface MenuItem {
  name: string;
  icon: JSX.Element;
  path: string;
  active: boolean;
  children?: MenuItem[];
  isOpen?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Estado para controlar los submenús abiertos
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'economica': currentPath.includes('/admin/payments') || 
                 currentPath.includes('/admin/expenses') || 
                 currentPath.includes('/admin/consumption-payments')
  });

  // Función para manejar la apertura/cierre de submenús
  const toggleSubmenu = (menuKey: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };
  
  const menuItems: MenuItem[] = [
    { 
      name: 'Dashboard', 
      icon: <BarChart className="w-5 h-5" />, 
      path: '/admin',
      active: currentPath === '/admin'
    },
    { 
      name: 'Usuarios', 
      icon: <Users className="w-5 h-5" />, 
      path: '/admin/users',
      active: currentPath.includes('/admin/users')
    },
    { 
      name: 'Productos', 
      icon: <ShoppingCart className="w-5 h-5" />, 
      path: '/admin/products',
      active: currentPath.includes('/admin/products')
    },
    { 
      name: 'Mesas', 
      icon: <Coffee className="w-5 h-5" />, 
      path: '/admin/tables',
      active: currentPath.includes('/admin/tables')
    },    { 
      name: 'Reservas', 
      icon: <Calendar className="w-5 h-5" />, 
      path: '/admin/reservations',
      active: currentPath.includes('/admin/reservations')
    },    {
      name: 'Gestión Económica',
      icon: <ChartIcon className="w-5 h-5" />,
      path: '#',
      active: currentPath.includes('/admin/payments') || 
              currentPath.includes('/admin/expenses') ||
              currentPath.includes('/admin/consumption-payments'),
      isOpen: openMenus['economica'],
      children: [
        { 
          name: 'Cuotas', 
          icon: <CreditCard className="w-5 h-5" />, 
          path: '/admin/payments',
          active: currentPath.includes('/admin/payments')
        },
        { 
          name: 'Gastos', 
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>, 
          path: '/admin/expenses',
          active: currentPath.includes('/admin/expenses')
        },
        { 
          name: 'Pagos', 
          icon: <FileText className="w-5 h-5" />, 
          path: '/admin/consumption-payments',
          active: currentPath.includes('/admin/consumption-payments')
        }
      ]
    },
    {
      name: 'Documentación',
      icon: <FileText className="w-5 h-5" />,
      path: '/admin/documents',
      active: currentPath.includes('/admin/documents')
    },
    { 
      name: 'Configuración', 
      icon: <Settings className="w-5 h-5" />, 
      path: '/admin/reservation-config',
      active: currentPath.includes('/admin/reservation-config')
    },
    { 
      name: 'Volver al inicio', 
      icon: <Home className="w-5 h-5" />, 
      path: '/',
      active: false
    }
  ];  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-4 px-2 sm:px-4 md:py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-md">
              <div className="p-4">
                <h2 className="text-xl font-bold text-dark-700 dark:text-secondary-300 mb-4 flex items-center">
                  <img src="/images/logo.svg" alt="Megaverse Logo" className="w-8 h-8 mr-2" />
                  Panel Admin
                </h2>
                  <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <React.Fragment key={item.name}>
                      {item.children ? (
                        <div>
                          <button
                            onClick={() => toggleSubmenu('economica')}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              item.active
                                ? 'bg-primary-100 dark:bg-primary-800/30 text-primary-600 dark:text-primary-300'
                                : 'text-dark-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700/50'
                            }`}
                          >
                            <span className="mr-3">{item.icon}</span>
                            <span className="flex-1">{item.name}</span>
                            <svg 
                              className={`w-4 h-4 transition-transform ${item.isOpen ? 'transform rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {item.isOpen && (
                            <div className="pl-4 mt-1 space-y-1">
                              {item.children.map(child => (
                                <Link
                                  key={child.name}
                                  to={child.path}
                                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    child.active
                                      ? 'bg-primary-100 dark:bg-primary-800/30 text-primary-600 dark:text-primary-300'
                                      : 'text-dark-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700/50'
                                  }`}
                                >
                                  <span className="mr-3">{child.icon}</span>
                                  <span>{child.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
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
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>            </Card>
          </div>
            {/* Content */}
          <div className="lg:col-span-4">
            <Card className="shadow-md">
              <div className="p-4 sm:p-6">
                <h1 className="text-xl md:text-2xl font-bold text-dark-700 dark:text-secondary-300 mb-4 md:mb-6 flex items-center">
                  {title}
                </h1>
                
                {children}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
