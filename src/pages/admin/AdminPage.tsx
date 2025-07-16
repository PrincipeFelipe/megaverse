import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Users, ShoppingCart, Calendar, Clock, Coffee, CreditCard, TrendingUp, Settings } from 'lucide-react';
import { adminUserService, adminReservationService, productService, adminTableService, paymentsService } from '../../services/api';
import { expensesService } from '../../services/expensesService';
import { createModuleLogger } from '../../utils/loggerExampleUsage';

// Logger específico para la página de admin
const adminLogger = createModuleLogger('ADMIN');

export const AdminPage: React.FC = () => {
  // Función para formatear valores monetarios
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    tables: 0,
    reservations: {
      total: 0,
      active: 0,
      today: 0
    },
    financials: {
      income: 0,       // Total de ingresos (antes payments.total)
      expenses: 0,     // Total de gastos (antes payments.currentMonth)
      currentYear: 0   // Ingresos del año actual (mantenemos esta propiedad)
    }
  });
  const [loading, setLoading] = useState(true);  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        adminLogger.info('Cargando estadísticas de admin');
        
        // En un entorno real, podrías tener un endpoint específico para estadísticas
        // Aquí simulamos obteniendo datos y calculando estadísticas
        const [users, products, tables, reservations, totalIncome, totalExpenses] = await Promise.all([
          adminUserService.getAllUsers(),
          productService.getAllProducts(),
          adminTableService.getAllTables(),
          adminReservationService.getAllReservations(),
          paymentsService.getTotalIncome(), // Nuevo método que incluye cuotas + consumos
          expensesService.getTotalExpenses() // Método específico para el total de gastos
        ]);
        
        adminLogger.debug('Datos estadísticos cargados', { 
          usersCount: users.length,
          productsCount: products.length,
          tablesCount: tables.length,
          reservationsCount: reservations.length
        });
          
        adminLogger.debug('Datos estadísticos cargados', { 
          usersCount: users.length,
          productsCount: products.length,
          tablesCount: tables.length,
          reservationsCount: reservations.length
        });
        
        // Contar reservas activas y de hoy
        const today = new Date().toISOString().split('T')[0];
        const activeReservations = reservations.filter((r) => r.status === 'active').length;
        const todayReservations = reservations.filter((r) => 
          r.start_time.startsWith(today) && r.status === 'active'
        ).length;
        
        adminLogger.debug('Estadísticas financieras obtenidas', { 
          totalIncome, 
          totalExpenses 
        });
        
        // Convertir explícitamente los valores a número para evitar concatenación
        const incomeParsed = Number(totalIncome);
        const expensesParsed = Number(totalExpenses);
        
        adminLogger.debug('Estadísticas financieras procesadas', { 
          incomeParsed, 
          expensesParsed, 
          balance: incomeParsed - expensesParsed 
        });
        
        setStats({
          users: users.length,
          products: products.length,
          tables: tables.length,
          reservations: {
            total: reservations.length,
            active: activeReservations,
            today: todayReservations
          },
          financials: {
            // Ingresos totales (cuotas + consumos) como número
            income: incomeParsed,
            // Gastos totales como número
            expenses: expensesParsed,
            // Esto seguirá usándose para el año actual
            currentYear: incomeParsed  // Actualizado para ser consistente
          }
        });
        
        adminLogger.info('Estadísticas de admin cargadas exitosamente', {
          usersCount: users.length,
          productsCount: products.length,
          tablesCount: tables.length,
          reservationsCount: reservations.length,
          totalIncome: incomeParsed,
          totalExpenses: expensesParsed
        });
      } catch (error) {
        adminLogger.error('Error al cargar estadísticas', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);  const statCards = [
    { 
      title: 'Usuarios registrados', 
      value: stats.users, 
      icon: <Users className="w-8 h-8 text-blue-500" />,
      color: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
      title: 'Productos', 
      value: stats.products, 
      icon: <ShoppingCart className="w-8 h-8 text-green-500" />,
      color: 'bg-green-100 dark:bg-green-900/30'
    },
    { 
      title: 'Mesas', 
      value: stats.tables, 
      icon: <Coffee className="w-8 h-8 text-cyan-500" />,
      color: 'bg-cyan-100 dark:bg-cyan-900/30'
    },
    { 
      title: 'Reservas Totales', 
      value: stats.reservations.total, 
      icon: <Calendar className="w-8 h-8 text-purple-500" />,
      color: 'bg-purple-100 dark:bg-purple-900/30'
    },
    { 
      title: 'Reservas Activas', 
      value: stats.reservations.active, 
      icon: <Clock className="w-8 h-8 text-amber-500" />,
      color: 'bg-amber-100 dark:bg-amber-900/30'
    },
    { 
      title: 'Reservas Hoy', 
      value: stats.reservations.today, 
      icon: <Calendar className="w-8 h-8 text-red-500" />,
      color: 'bg-red-100 dark:bg-red-900/30'
    },    { 
      title: 'Ingresos', 
      value: formatCurrency(stats.financials.income), 
      icon: <CreditCard className="w-8 h-8 text-emerald-500" />,
      color: 'bg-emerald-100 dark:bg-emerald-900/30',
      isMonetary: true
    },
    { 
      title: 'Gastos', 
      value: formatCurrency(stats.financials.expenses), 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>,
      color: 'bg-indigo-100 dark:bg-indigo-900/30',
      isMonetary: true
    },    { 
      title: 'Balance Total', 
      value: formatCurrency(Number(stats.financials.income) - Number(stats.financials.expenses)), 
      icon: <TrendingUp className="w-8 h-8 text-amber-500" />,
      color: 'bg-amber-100 dark:bg-amber-900/30',
      isMonetary: true,
      textColor: Number(stats.financials.income) - Number(stats.financials.expenses) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className={`p-6 rounded-lg ${stat.color}`}>
                <div className="flex items-center">
                  <div className="mr-4">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {stat.title}
                    </p>                    <p className={`text-2xl font-bold ${stat.textColor || 'text-gray-900 dark:text-white'}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Acciones rápidas
            </h2>            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/users" className="block text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <span className="block text-gray-800 dark:text-white font-medium">Gestionar Usuarios</span>
                </Link>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/products" className="block text-center">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <span className="block text-gray-800 dark:text-white font-medium">Gestionar Productos</span>
                </Link>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/tables" className="block text-center">
                  <Coffee className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                  <span className="block text-gray-800 dark:text-white font-medium">Gestionar Mesas</span>
                </Link>
              </Card>              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/reservations" className="block text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <span className="block text-gray-800 dark:text-white font-medium">Gestionar Reservas</span>
                </Link>
              </Card>              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/payments" className="block text-center">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <span className="block text-gray-800 dark:text-white font-medium">Gestionar Cuotas</span>
                </Link>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/expenses" className="block text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mx-auto mb-2 text-red-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>
                  <span className="block text-gray-800 dark:text-white font-medium">Gestionar Gastos</span>
                </Link>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/consumption-payments" className="block text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mx-auto mb-2 text-blue-500"><path d="M2 17h2v4h16v-4h2"></path><path d="M6 7v4a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V7"></path><circle cx="12" cy="5" r="1"></circle><path d="M8 5h1"></path><path d="M15 5h1"></path></svg>
                  <span className="block text-gray-800 dark:text-white font-medium">Consumos Pendientes</span>
                </Link>
              </Card>
              
              <Card className="p-4 hover:shadow-md transition-shadow">
                <Link to="/admin/logger" className="block text-center">
                  <Settings className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <span className="block text-gray-800 dark:text-white font-medium">Sistema de Logging</span>
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};
