import React, { useState } from 'react';
import { Reservation } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, X, Pencil, User as UserIcon, Users, MapPin } from '../../utils/icons';

// Definir el tipo UserType localmente para evitar problemas de importación
interface UserType {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

interface ReservationsListProps {
  reservations: Reservation[];
  onEditReservation: (reservation: Reservation) => void;
  onCancelReservation: (reservationId: number) => void;
  currentUser?: UserType | null;
}

const ReservationsList: React.FC<ReservationsListProps> = ({ 
  reservations, 
  onEditReservation, 
  onCancelReservation
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  // Función para formatear fechas de manera más legible
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    }
  };

  // Función para formatear tiempo
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const now = new Date();
  
  // Filtrar reservas según el estado seleccionado
  const filteredReservations = reservations.filter(reservation => {
    if (statusFilter === 'all') return true;
    return reservation.status === statusFilter;
  });

  // Contar reservas por estado
  const reservationCounts = {
    all: reservations.length,
    active: reservations.filter(r => r.status === 'active').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length
  };

  // Agrupar reservas por fecha
  const groupedByDate = filteredReservations.reduce((groups, reservation) => {
    const date = reservation.start_time.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(reservation);
    return groups;
  }, {} as Record<string, Reservation[]>);

  // Ordenar fechas de más reciente a más antigua
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="space-y-4">
      {/* Header simplificado */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mis Reservas</h2>
        
        {/* Filtros minimalistas */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            Todas ({reservationCounts.all})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('active')}
            size="sm"
          >
            Activas ({reservationCounts.active})
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('completed')}
            size="sm"
          >
            Finalizadas ({reservationCounts.completed})
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'primary' : 'outline'}
            onClick={() => setStatusFilter('cancelled')}
            size="sm"
          >
            Canceladas ({reservationCounts.cancelled})
          </Button>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <Calendar size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No hay reservas {statusFilter === 'all' ? '' : statusFilter === 'active' ? 'activas' : statusFilter === 'completed' ? 'finalizadas' : 'canceladas'}
            </p>
          </div>
        </div>
      ) : (
        sortedDates.map((date) => {
          const dayReservations = groupedByDate[date];
          const reservationDate = new Date(date);
          const isPastDate = reservationDate < now;

          return (
            <div key={date} className="mb-6">
              {/* Header de fecha minimalista */}
              <h3 className={`text-md font-medium mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 ${isPastDate ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {formatDate(date)}
                {isPastDate && <span className="ml-2 text-sm text-gray-400">(Pasado)</span>}
                <span className="ml-2 text-sm text-gray-500">
                  ({dayReservations.length} {dayReservations.length === 1 ? 'reserva' : 'reservas'})
                </span>
              </h3>
              
              {/* Lista de reservas minimalista */}
              <div className="space-y-3">
                {dayReservations.map((reservation) => {
                  // Colores minimalistas según estado
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'active': return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
                      case 'completed': return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
                      case 'cancelled': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
                      default: return 'border-l-gray-300 bg-white dark:bg-gray-800';
                    }
                  };

                  const getBadgeColor = (status: string) => {
                    switch (status) {
                      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
                      case 'completed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
                      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                    }
                  };

                  return (
                    <Card key={reservation.id} className={`${getStatusColor(reservation.status)} border-l-4 hover:shadow-md transition-shadow`}>
                      <div className="p-4">
                        {/* Header de la reserva con usuario */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {/* Avatar simple */}
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {reservation.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {reservation.user_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Propietario · ID: {reservation.user_id}
                              </div>
                            </div>
                          </div>
                          
                          {/* Badge de estado simple */}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getBadgeColor(reservation.status)}`}>
                            {reservation.status === 'active' && 'Activa'}
                            {reservation.status === 'completed' && 'Finalizada'}
                            {reservation.status === 'cancelled' && 'Cancelada'}
                          </span>
                        </div>

                        {/* Información en grid simple */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                          <div className="space-y-2">
                            {/* Mesa */}
                            <div className="flex items-center text-sm">
                              <MapPin size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                              <span className="font-medium">{reservation.table_name}</span>
                            </div>
                            
                            {/* Horario */}
                            <div className="flex items-center text-sm">
                              <Clock size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                              {reservation.all_day ? (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">Todo el día</span>
                              ) : (
                                <span>
                                  {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)} 
                                  <span className="text-gray-500 ml-1">({reservation.duration_hours}h)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {/* Socios */}
                            <div className="flex items-center text-sm">
                              <UserIcon size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                              <span>{reservation.num_members} {reservation.num_members === 1 ? 'socio' : 'socios'}</span>
                            </div>
                            
                            {/* Invitados */}
                            <div className="flex items-center text-sm">
                              <Users size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                              <span>{reservation.num_guests} {reservation.num_guests === 1 ? 'invitado' : 'invitados'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Motivo si existe */}
                        {reservation.reason && (
                          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Motivo: </span>
                            <span className="text-blue-600 dark:text-blue-400">{reservation.reason}</span>
                          </div>
                        )}

                        {/* Alertas simples */}
                        {reservation.all_day && !reservation.approved && (
                          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm text-amber-700 dark:text-amber-300">
                            <Clock size={14} className="inline mr-1" />
                            Pendiente de aprobación
                          </div>
                        )}

                        {reservation.status === 'cancelled' && (
                          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                            Reserva cancelada - Solo un administrador puede eliminarla
                          </div>
                        )}
                        
                        {reservation.status === 'completed' && (
                          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm text-gray-600 dark:text-gray-400">
                            Esta reserva ya ha sido completada
                          </div>
                        )}
                        
                        {/* Botones de acción simples */}
                        {reservation.status === 'active' && (
                          <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              onClick={() => onEditReservation(reservation)}
                              size="sm"
                              className="flex items-center space-x-1"
                            >
                              <Pencil size={14} />
                              <span>Modificar</span>
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => onCancelReservation(reservation.id)}
                              size="sm"
                              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <X size={14} />
                              <span>Cancelar</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ReservationsList;
