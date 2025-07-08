import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, ShoppingCart, CreditCard, MapPin, Trash2 } from '../utils/icons';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Reservation, Consumption, UserDebtResponse } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { reservationService, consumptionService, consumptionPaymentService } from '../services/api';
import { cleaningDutyService, CleaningAssignment } from '../services/cleaningDutyService';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { UserLayout } from '../components/layout/UserLayout';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [cleaningDuty, setCleaningDuty] = useState<CleaningAssignment | null>(null);
  const [userDebt, setUserDebt] = useState<UserDebtResponse['currentDebt'] | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para formatear la fecha de membresía de manera segura
  const formatMembershipDate = (): string => {
    // Priorizar membership_date si existe
    if (user?.membership_date) {
      try {
        const date = new Date(user.membership_date);
        if (!isNaN(date.getTime())) {
          return format(date, 'MMMM yyyy', { locale: es });
        }
      } catch (error) {
        console.warn('Error al formatear membership_date:', error);
      }
    }
    
    // Si no hay membership_date válida, usar createdAt
    if (user?.createdAt) {
      try {
        const date = new Date(user.createdAt);
        if (!isNaN(date.getTime())) {
          return format(date, 'MMMM yyyy', { locale: es });
        }
      } catch (error) {
        console.warn('Error al formatear createdAt:', error);
      }
    }
    
    return 'N/A';
  };

  useEffect(() => {
    // Fetch real data from API
    const fetchData = async () => {
      try {
        // Obtener reservas del usuario actual
        const reservationsData = await reservationService.getAllReservations();
        
        // Filtrar solo las reservas activas del usuario actual
        const userReservations = Array.isArray(reservationsData) 
          ? reservationsData.filter(res => res.user_id === user?.id && res.status === 'active')
          : [];
        
        setReservations(userReservations);

        // Obtener consumos del usuario actual
        if (user?.id) {
          const consumptionsData = await consumptionService.getUserConsumptions(user.id);
          // Ordenar consumos por fecha (más recientes primero)
          const sortedConsumptions = Array.isArray(consumptionsData) 
            ? consumptionsData.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            : [];
          
          setConsumptions(sortedConsumptions);
          
          // Obtener deuda del usuario
          try {
            const debtData = await consumptionPaymentService.getUserDebt();
            setUserDebt(debtData.currentDebt);
          } catch (error) {
            console.error('Error al obtener deuda del usuario:', error);
            setUserDebt({ unpaid: 0, pendingApproval: 0, total: 0 }); // Valor por defecto
          }
          
          // Obtener turno de limpieza del usuario actual
          try {
            console.log("Obteniendo asignaciones de limpieza para el usuario:", user.id);
            const currentAssignments = await cleaningDutyService.getCurrentAssignments();
            console.log("Asignaciones obtenidas:", currentAssignments);
            
            if (currentAssignments.length > 0) {
              // Comprobación por ID exacto - solo turnos pendientes
              let userCleaningDuty = currentAssignments.find(
                assignment => assignment.user_id === user.id && assignment.status === 'pending'
              );
              
              // Si no encontramos por ID exacto, intentamos comparar como string (por si hay problemas de tipo)
              if (!userCleaningDuty) {
                userCleaningDuty = currentAssignments.find(
                  assignment => String(assignment.user_id) === String(user.id) && assignment.status === 'pending'
                );
              }
              
              console.log("Turno pendiente del usuario:", userCleaningDuty);
              setCleaningDuty(userCleaningDuty || null);
            } else {
              console.log("No hay asignaciones de limpieza actuales");
              
              // Alternativa: Hacer una consulta directa al backend por las asignaciones del usuario
              try {
                console.log("Intentando obtener asignaciones directamente para el usuario:", user.id);
                const userHistory = await cleaningDutyService.getUserHistory(user.id);
                console.log("Historial de limpieza del usuario:", userHistory);
                
                // Filtrar para encontrar asignaciones actuales
                const now = new Date();
                const currentAssignment = userHistory.find(assignment => {
                  const startDate = new Date(assignment.week_start_date);
                  const endDate = new Date(assignment.week_end_date);
                  return startDate <= now && endDate >= now;
                });
                
                console.log("Asignación actual del usuario (por historial):", currentAssignment);
                if (currentAssignment) {
                  setCleaningDuty(currentAssignment);
                }
              } catch (historyErr) {
                console.error("Error al obtener historial de limpieza del usuario:", historyErr);
              }
            }
          } catch (err) {
            console.error("Error al obtener turno de limpieza:", err);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar datos si el usuario está autenticado
    if (user?.id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Calcular consumos del mes actual
  const getCurrentMonthConsumptions = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return consumptions.filter(consumption => {
      const consumptionDate = new Date(consumption.created_at);
      return consumptionDate >= startOfMonth;
    }).length;
  };

  const stats = [
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Reservas Activas',
      value: reservations.filter(r => r.status === 'active').length,
      color: 'text-primary-500'
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      label: 'Consumos del Mes',
      value: getCurrentMonthConsumptions(),
      color: 'text-secondary-500'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      label: 'Consumos Pendientes',
      value: `€${userDebt?.total !== undefined ? Number(userDebt.total).toFixed(2) : '0.00'}`,
      color: userDebt?.total && userDebt.total > 0 ? 'text-red-500' : 'text-green-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <UserLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenido de vuelta, {user?.name}
        </p>
      </motion.div>

      {/* Cleaning Duty Alert - Mostramos de forma prominente */}
      {/* Log estado */}
      <>{(() => { console.log("Estado de cleaningDuty en render:", cleaningDuty); return null; })()}</>
      
      {cleaningDuty ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900 rounded-md shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                  ¡TURNO DE LIMPIEZA ASIGNADO!
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>
                    Tienes asignado un turno de limpieza para la semana del{' '}
                    <span className="font-semibold">
                      {format(new Date(cleaningDuty.week_start_date), 'dd MMM', { locale: es })} al{' '}
                      {format(new Date(cleaningDuty.week_end_date), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </p>
                  <div className="mt-2 flex space-x-4">
                    <Link
                      to="/cleaning"
                      className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline"
                    >
                      Ver detalles &rarr;
                    </Link>
                    <span className="text-red-600 dark:text-red-400">|</span>
                    <button
                      onClick={async () => {
                        try {
                          if (cleaningDuty) {
                            await cleaningDutyService.updateStatus(cleaningDuty.id, { status: 'completed' });
                            addNotification({
                              type: 'info',
                              title: 'Éxito',
                              message: 'Has marcado tu turno de limpieza como completado'
                            });
                            // Refrescar datos - eliminamos de la vista el turno completado
                            setCleaningDuty(null);
                            
                            // También podríamos recargar todos los datos
                            // pero no es necesario porque ya hemos quitado el turno de limpieza
                            // y sabemos que está marcado como completado
                          }
                        } catch (err) {
                          console.error('Error al actualizar el estado del turno de limpieza:', err);
                          addNotification({
                            type: 'error',
                            title: 'Error',
                            message: 'No se pudo actualizar el estado del turno'
                          });
                        }
                      }}
                      className="text-sm font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 underline cursor-pointer"
                    >
                      Marcar como completada
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="hidden">No hay turnos de limpieza asignados</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className={`${stat.color} mr-4`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reservations */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Próximas Reservas
              </h2>
              <Calendar className="w-5 h-5 text-primary-500" />
            </div>
            
            {reservations.length > 0 ? (
              <div className="space-y-4">
                {reservations.slice(0, 3).map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-lg"
                  >
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-primary-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {reservation.table_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(reservation.start_time), 'PPp', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-secondary-100 text-dark-700 dark:bg-secondary-900 dark:text-secondary-200 rounded-full">
                      Activa
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No tienes reservas activas
              </p>
            )}
          </Card>
        </motion.div>

        {/* Recent Consumptions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Consumos Recientes
              </h2>
              <ShoppingCart className="w-5 h-5 text-primary-500" />
            </div>
            
            {consumptions.length > 0 ? (
              <div className="space-y-4">
                {consumptions.slice(0, 3).map((consumption) => (
                  <div
                    key={consumption.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {consumption.product_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cantidad: {consumption.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        €{consumption.total_price !== undefined ? Number(consumption.total_price).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(consumption.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No hay consumos recientes
              </p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Información del Perfil
            </h2>
            <User className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <p className="text-gray-900 dark:text-white">{user?.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user?.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rol
              </label>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                user?.role === 'admin' 
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Miembro desde
              </label>
              <p className="text-gray-900 dark:text-white">
                {formatMembershipDate()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado de Consumos
              </label>
              <div className="space-y-1">
                <p className="text-gray-900 dark:text-white">
                  Sin pagar: <span className={`font-medium ${userDebt?.unpaid && userDebt.unpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    €{userDebt?.unpaid !== undefined ? Number(userDebt.unpaid).toFixed(2) : '0.00'}
                  </span>
                </p>
                <p className="text-gray-900 dark:text-white">
                  En revisión: <span className={`font-medium ${userDebt?.pendingApproval && userDebt.pendingApproval > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    €{userDebt?.pendingApproval !== undefined ? Number(userDebt.pendingApproval).toFixed(2) : '0.00'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </UserLayout>
  );
};
