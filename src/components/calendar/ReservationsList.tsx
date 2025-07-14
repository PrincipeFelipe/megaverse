import React, { useState } from 'react';
import { Reservation } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, X, Pencil, User as UserIcon, Users } from '../../utils/icons';

// Definir el tipo UserType localmente para evitar problemas de importación
interface UserType {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  balance: number;
  createdAt: string;
}

interface ReservationsListProps {
  reservations: Reservation[];
  onEditReservation: (reservation: Reservation) => void;
  onCancelReservation: (id: number) => void;
  currentUser?: UserType | null; // hacemos este prop opcional para compatibilidad con el código existente
}

const ReservationsList: React.FC<ReservationsListProps> = ({
  reservations,
  onEditReservation,
  onCancelReservation,
  currentUser
}) => {
  // Mostrar solo reservas activas por defecto
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Filtrar las reservas canceladas para todos los usuarios
  // Las reservas canceladas se mostrarán solo en un panel de administración específico
  const userReservations = reservations.filter(res => res.status !== 'cancelled');

  // Calcular contadores por estado (sin incluir canceladas)
  const reservationCounts = {
    active: userReservations.filter(res => res.status === 'active').length,
    completed: userReservations.filter(res => res.status === 'completed').length,
    all: userReservations.length
  };
  
  // Filtrar reservas según el estado seleccionado
  const filteredReservations = [...userReservations]
    .filter(res => statusFilter === 'all' ? true : res.status === statusFilter);
    
  // Fecha actual para separar reservas futuras de pasadas
  const now = new Date();
  
  // Separar reservas futuras y pasadas
  const futureReservations = filteredReservations.filter(res => {
    const startDate = new Date(res.start_time);
    return startDate >= now || res.status === 'active'; // Incluir activas aunque hayan comenzado
  });
  
  const pastReservations = filteredReservations.filter(res => {
    const startDate = new Date(res.start_time);
    return startDate < now && res.status !== 'active'; // Solo las pasadas que no están activas
  });
  
  // Ordenar las reservas futuras (las más próximas primero) y pasadas (más recientes primero)
  const sortedFutureReservations = futureReservations.sort((a, b) => {
    const dateA = new Date(a.start_time);
    const dateB = new Date(b.start_time);
    return dateA.getTime() - dateB.getTime();
  });
  
  const sortedPastReservations = pastReservations.sort((a, b) => {
    const dateA = new Date(a.start_time);
    const dateB = new Date(b.start_time);
    return dateB.getTime() - dateA.getTime(); // Orden inverso para las pasadas
  });
  
  // Combinar las reservas ordenadas (futuras primero, luego pasadas)
  const sortedReservations = [...sortedFutureReservations, ...sortedPastReservations];
  
  // Agrupar por fecha
  const groupedByDate = sortedReservations.reduce((acc: Record<string, Reservation[]>, reservation) => {
    const date = format(new Date(reservation.start_time), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(reservation);
    return acc;
  }, {});
    // Función para formatear la fecha
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };
  
  // Función para formatear la hora
  const formatTime = (dateString: string): string => {
    return format(new Date(dateString), "HH:mm", { locale: es });
  };
  
  // Obtener el estado de CSS de la reserva
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-3">Mis Reservas</h2>
        <div className="flex flex-wrap gap-2">          
          <Button 
            variant={statusFilter === 'all' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('all')}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Todas ({reservationCounts.all})</span>
            <span className="sm:hidden">Todas <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">{reservationCounts.all}</span></span>
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('active')}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Activas ({reservationCounts.active})</span>
            <span className="sm:hidden">Activas <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">{reservationCounts.active}</span></span>
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('completed')}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Completadas ({reservationCounts.completed})</span>
            <span className="sm:hidden">Comp. <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">{reservationCounts.completed}</span></span>
          </Button>
        </div>
      </div>
      
      {Object.keys(groupedByDate).length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">No tienes reservas {statusFilter !== 'all' ? `${statusFilter}s` : ''} en este momento.</p>
        </Card>
      ) : (        
        Object.entries(groupedByDate).map(([date, dateReservations]) => {
          const reservationDate = new Date(date);
          const isPastDate = reservationDate < now;
          
          return (
          <div key={date} className="mb-6">
            <h3 className={`text-lg font-medium mb-3 ${isPastDate ? 'text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {formatDate(date)}
              {isPastDate && <span className="ml-2 text-sm text-gray-500">(Pasado)</span>}
            </h3>
            <div className="space-y-3">
              {dateReservations.map(reservation => (
                <Card key={reservation.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Barra lateral con el estado */}
                    <div className={`py-4 px-2 md:w-2 flex-shrink-0 ${getStatusStyles(reservation.status)}`}></div>
                    
                    {/* Contenido principal */}
                    <div className="flex-grow p-4">
                      <div className="flex flex-wrap justify-between items-start">
                        <h4 className="text-lg font-medium mb-1">{reservation.table_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(reservation.status)}`}>
                          {reservation.status === 'active' ? 'Activa' : 
                           reservation.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          {/* En móviles mostramos fecha más compacta */}
                          <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Calendar size={16} className="mr-1" />
                            <span>{formatDate(reservation.start_time)}</span>
                          </div>
                          <div className="sm:hidden flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Calendar size={16} className="mr-1" />
                            <span>{format(new Date(reservation.start_time), "dd/MM/yyyy (EEEE)", { locale: es })}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Clock size={16} className="mr-1" />
                            <span>{reservation.all_day ? 
                              `Todo el día (${window.reservationConfig?.allowed_start_time?.substring(0,5) || '08:00'} - ${window.reservationConfig?.allowed_end_time?.substring(0,5) || '22:00'} h)` : 
                              `${formatTime(reservation.start_time)} - ${formatTime(reservation.end_time)} h`}
                            </span>
                          </div>
                          {reservation.all_day && reservation.reason && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                              Motivo: {reservation.reason}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <UserIcon size={16} className="mr-1" />
                            <span>{reservation.num_members} {reservation.num_members === 1 ? 'socio' : 'socios'}</span>
                          </div>
                          {reservation.num_guests > 0 && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <Users size={16} className="mr-1" />
                              <span>{reservation.num_guests} {reservation.num_guests === 1 ? 'invitado' : 'invitados'}</span>
                            </div>
                          )}
                          {reservation.all_day && !reservation.approved && (
                            <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-2">
                              Pendiente de aprobación
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Mostrar mensajes informativos según el estado */}
                      {reservation.status === 'cancelled' && (
                        <div className="mt-4 text-sm text-red-600 dark:text-red-400 italic">
                          Esta reserva ha sido cancelada. Solo un administrador puede eliminar reservas canceladas.
                        </div>
                      )}
                      
                      {reservation.status === 'completed' && (
                        <div className="mt-4 text-sm text-blue-600 dark:text-blue-400 italic">
                          Esta reserva ya ha finalizado.
                        </div>
                      )}
                      
                      {/* Mostrar botones solo para reservas activas */}
                      {reservation.status === 'active' && (
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => onEditReservation(reservation)}
                            size="sm"
                            className="flex items-center"
                          >
                            <Pencil size={16} className="mr-1" />
                            Modificar
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => onCancelReservation(reservation.id)}
                            size="sm"
                            className="flex items-center bg-red-600 hover:bg-red-700 text-white"
                          >
                            <X size={16} className="mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )})
      )}
    </div>
  );
};

export default ReservationsList;
