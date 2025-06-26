import React from 'react';
import { Reservation } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, Trash2, User as UserIcon, Users } from '../../utils/icons';

interface CancelledReservationsListProps {
  reservations: Reservation[];
  onDeleteReservation?: (id: number) => void;
}

const CancelledReservationsList: React.FC<CancelledReservationsListProps> = ({
  reservations,
  onDeleteReservation
}) => {
  // Filtrar solo reservas canceladas
  const cancelledReservations = reservations.filter(res => res.status === 'cancelled');
  
  // Si no hay reservas canceladas, mostrar mensaje
  if (cancelledReservations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">No hay reservas canceladas actualmente.</p>
      </Card>
    );
  }

  // Agrupar por fecha
  const groupedByDate = cancelledReservations.reduce((acc: Record<string, Reservation[]>, reservation) => {
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

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Reservas Canceladas</h2>
      
      {Object.entries(groupedByDate).map(([date, dateReservations]) => (
        <div key={date} className="mb-6">
          <h3 className="text-lg font-medium mb-3">
            {formatDate(date)}
          </h3>
          <div className="space-y-3">
            {dateReservations.map(reservation => (
              <Card key={reservation.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Barra lateral con el estado */}
                  <div className="py-4 px-2 md:w-2 flex-shrink-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"></div>
                  
                  {/* Contenido principal */}
                  <div className="flex-grow p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-medium">{reservation.table_name}</h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Cancelada
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Calendar size={16} className="mr-1" />
                          <span>{formatDate(reservation.start_time)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Clock size={16} className="mr-1" />
                          <span>{reservation.all_day ? 
                            'Todo el día (08:00 - 22:00 h)' : 
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
                          <span>Usuario: {reservation.user_name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Users size={16} className="mr-1" />
                          <span>{reservation.num_members} {reservation.num_members === 1 ? 'socio' : 'socios'}</span>
                        </div>
                        {reservation.num_guests > 0 && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <Users size={16} className="mr-1" />
                            <span>{reservation.num_guests} {reservation.num_guests === 1 ? 'invitado' : 'invitados'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Botones de acción para administradores */}
                    {onDeleteReservation && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="primary"
                          onClick={() => onDeleteReservation(reservation.id)}
                          size="sm"
                          className="flex items-center bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Eliminar permanentemente
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CancelledReservationsList;
