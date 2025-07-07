import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import momentPlugin from '@fullcalendar/moment';
import moment from 'moment';
import 'moment/locale/es';
import { 
  EventClickArg,
  EventContentArg, 
  DateSelectArg,
  ViewMountArg,
  EventSourceInput 
} from '@fullcalendar/core';
import { Reservation, Table, ReservationConfig } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { showError, showConfirm } from '../../utils/alerts';
import './calendar-styles.css'; // Estilos personalizados existentes
import './fullcalendar-styles.css'; // Nuevos estilos para FullCalendar

// Extender la interfaz Window para incluir la configuración de reservas
declare global {
  interface Window {
    reservationConfig?: ReservationConfig;
  }
}

// Configurar moment para español
moment.locale('es');

// Funciones para obtener las horas de inicio y fin desde la configuración
const getMinTime = (): string => {
  if (window.reservationConfig && window.reservationConfig.allowed_start_time) {
    return window.reservationConfig.allowed_start_time;
  }
  return '08:00:00'; // 8:00 AM por defecto
};

const getMaxTime = (): string => {
  if (window.reservationConfig && window.reservationConfig.allowed_end_time) {
    // Extraer la hora de la configuración
    const configEndTime = window.reservationConfig.allowed_end_time;
    
    // Incrementar en 1 hora para que la hora configurada se muestre como última franja
    // Por ejemplo, si allowed_end_time es "22:00:00", devolver "23:00:00"
    const [hour, minute, second] = configEndTime.split(':').map(Number);
    let adjustedHour = hour + 1;
    
    // Ajustar si supera las 24 horas
    if (adjustedHour >= 24) {
      adjustedHour = 24;
    }
    
    return `${String(adjustedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }
  
  return '23:00:00'; // 11:00 PM por defecto (para mostrar hasta las 10:00 PM)
};

interface CalendarProps {
  reservations: Reservation[];
  tables: Table[];
  onSelectSlot: (tableId: number, start: Date, end: Date) => void;
  onCancelReservation: (id: number) => Promise<void>;
}

// Evento personalizado para FullCalendar
interface CustomCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: {
    tableId: number;
    userId: number;
    status: 'active' | 'cancelled' | 'completed';
    resource?: Table;
    isUserReservation: boolean;
  };
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  classNames?: string[];
}

interface TableSelectionPopoverProps {
  tables: Table[];
  start: Date;
  end: Date;
  onSelectTable: (tableId: number, start: Date, end: Date) => void;
  onClose: () => void;
  position: { top: number; left: number };
  reservations: Reservation[]; // Añadimos la lista de reservaciones
}

// Función auxiliar para verificar si el horario seleccionado coincide con inicio o fin de otra reserva
// o si no hay suficiente tiempo entre reservas
const checkForConsecutiveReservations = (
  tableId: number, 
  start: Date, 
  end: Date,
  allReservations: Reservation[] // Parámetro requerido
): { isConsecutive: boolean, existingReservation?: Reservation, isTooClose?: boolean, minutesBetween?: number, notAllowedConsecutive?: boolean } => {
  // Formatear horas para comparación (formato "HH:MM")
  const formatTimeForComparison = (date: Date): string => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  const selectedStartTime = formatTimeForComparison(start);
  const selectedEndTime = formatTimeForComparison(end);
  const selectedDateStr = start.toDateString(); // Para comparar solo fecha sin hora
  
  console.log(`Verificando reserva en mesa ${tableId}:`, {
    selectedStartTime,
    selectedEndTime,
    selectedDate: selectedDateStr
  });
  
  // Buscar reservas del mismo día para esa mesa
  const sameTableReservations = allReservations.filter((reservation: Reservation) => {
    const resStart = new Date(reservation.start_time);
    return (
      reservation.status === 'active' && 
      reservation.table_id === tableId &&
      resStart.toDateString() === selectedDateStr
    );
  });
  
  console.log(`Encontradas ${sameTableReservations.length} reservas activas para ese día y mesa`);
  
  // Obtener configuración del tiempo mínimo entre reservas y consecutivas
  // Usamos el operador ?? para proporcionar un valor por defecto si la configuración es undefined
  const allowConsecutive = window.reservationConfig?.allow_consecutive_reservations ?? true;
  const minTimeBetweeenReservations = window.reservationConfig?.min_time_between_reservations ?? 0;
  
  // Registrar para diagnóstico
  console.log('Configuración de reservas:', { 
    allowConsecutive,
    minTimeBetweeenReservations,
    configCompleta: window.reservationConfig
  });
  
  // Verificar si alguna reserva comienza o termina exactamente a la misma hora que la selección
  for (const reservation of sameTableReservations) {
    const resStart = new Date(reservation.start_time);
    const resEnd = new Date(reservation.end_time);
    
    const reservationStartTime = formatTimeForComparison(resStart);
    const reservationEndTime = formatTimeForComparison(resEnd);
    
    console.log(`Comparando con reserva #${reservation.id}:`, {
      reservationStartTime,
      reservationEndTime,
      selectedStartTime,
      selectedEndTime
    });
    
    // Comprobar si el inicio o fin coincide con inicio o fin de alguna reserva existente
    const isConsecutiveReservation = 
      selectedStartTime === reservationEndTime ||
      selectedEndTime === reservationStartTime;
    
    console.log(`¿Reservas consecutivas?`, {
      isConsecutiveReservation,
      selectedStartEqualsResEnd: selectedStartTime === reservationEndTime,
      selectedEndEqualsResStart: selectedEndTime === reservationStartTime,
      allowConsecutive
    });
    
    // Si son consecutivas y no está permitido, retornar error específico
    if (isConsecutiveReservation && !allowConsecutive) {
      console.log('Reservas consecutivas no permitidas. Config:', { allowConsecutive });
      return { 
        isConsecutive: true, 
        existingReservation: reservation,
        notAllowedConsecutive: true 
      };
    } else if (isConsecutiveReservation && allowConsecutive) {
      // Si son consecutivas y están permitidas, permitimos la reserva inmediatamente
      // sin aplicar la restricción de tiempo mínimo entre reservas
      console.log('Reservas consecutivas permitidas. Saltando validación de tiempo mínimo.');
      // Continuamos con la comprobación de coincidencia exacta de horario pero NO
      // aplicaremos la validación de tiempo mínimo entre reservas
    }
    
    // Comprobar si coincide exactamente (mismo inicio o mismo fin)
    if (
      selectedStartTime === reservationStartTime ||
      selectedEndTime === reservationEndTime
    ) {
      console.log('Conflicto: mismo horario de inicio o fin');
      return { isConsecutive: true, existingReservation: reservation };
    }
    
    // Si hay un tiempo mínimo entre reservas, verificamos también el tiempo entre ellas
    if (minTimeBetweeenReservations > 0) {
      // Calcular diferencia de tiempo en minutos entre reservas
      let minutesBetween = 0;
      let isTooClose = false;
      
      // Caso 1: La reserva nueva comienza después de una existente
      if (start >= resEnd) {
        minutesBetween = Math.floor((start.getTime() - resEnd.getTime()) / (1000 * 60));
        isTooClose = minutesBetween < minTimeBetweeenReservations;
        console.log('Nueva reserva después de existente:', { minutesBetween, isTooClose, minRequired: minTimeBetweeenReservations });
      }
      // Caso 2: La reserva existente comienza después de la nueva
      else if (end <= resStart) {
        minutesBetween = Math.floor((resStart.getTime() - end.getTime()) / (1000 * 60));
        isTooClose = minutesBetween < minTimeBetweeenReservations;
        console.log('Nueva reserva antes de existente:', { minutesBetween, isTooClose, minRequired: minTimeBetweeenReservations });
      }
      
      if (isTooClose) {
        console.log('Tiempo insuficiente entre reservas');
        return { 
          isConsecutive: false, 
          isTooClose: true, 
          minutesBetween, 
          existingReservation: reservation 
        };
      }
    }
  }
  
  console.log('No se encontraron conflictos, reserva permitida');
  return { isConsecutive: false, isTooClose: false };
};

// Componente para seleccionar mesa
const TableSelectionPopover: React.FC<TableSelectionPopoverProps> = ({ 
  tables, 
  start,
  end,
  onSelectTable,
  onClose,
  position,
  reservations
}) => {
  return (
    <div 
      className="table-selection-popover fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5" 
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
        <div className="font-semibold text-gray-800 dark:text-gray-100">Seleccionar mesa</div>
        <button 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="mb-4 px-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded text-center">
        <div className="text-xs text-indigo-800 dark:text-indigo-200">
          {start.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
        </div>
        <div className="font-medium text-indigo-900 dark:text-indigo-100">
          {start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto py-1 mb-2">
        {tables.map(table => (
          <div 
            key={table.id}
            className="p-2.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
            onClick={() => {
              // Primero verificamos si hay reservas consecutivas para la mesa seleccionada
              console.log('Verificando reserva en mesa:', table.id, 'Inicio:', start, 'Fin:', end);
              console.log('Configuración actual:', window.reservationConfig);
              
              const { isConsecutive, isTooClose, minutesBetween, notAllowedConsecutive } = checkForConsecutiveReservations(table.id, start, end, reservations);
              
              console.log('Resultado de la verificación:', { isConsecutive, notAllowedConsecutive, isTooClose, minutesBetween });
              
              if (isConsecutive) {
                if (notAllowedConsecutive) {
                  console.log('Mostrando error: Reservas consecutivas no permitidas');
                  showError(
                    'Reservas consecutivas no permitidas', 
                    `No se permiten reservas consecutivas según la configuración actual del sistema. No puedes reservar justo al terminar o antes de comenzar otra reserva.`
                  );
                } else {
                  console.log('Mostrando error: Horario no disponible (conflicto de horario)');
                  showError(
                    'Horario no disponible', 
                    `No es posible realizar la reserva porque ya existe una reserva que comienza o termina exactamente a la misma hora en ${table.name}.`
                  );
                }
                onClose();
                return;
              }
              
              if (isTooClose) {
                // Si no hay suficiente tiempo entre reservas
                const minTimeBetween = window.reservationConfig?.min_time_between_reservations || 0;
                showError(
                  'Tiempo insuficiente entre reservas', 
                  `Debe haber al menos ${minTimeBetween} minutos entre reservas en ${table.name}. Actualmente hay ${minutesBetween} minutos de diferencia.`
                );
                onClose();
                return;
              }
              
              // Si no hay problemas, continuar con la reserva
              onSelectTable(table.id, start, end);
              onClose();
            }}
          >
            <div className="font-medium text-gray-800 dark:text-gray-100">{table.name}</div>
            {table.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{table.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Calendar7Days: React.FC<CalendarProps> = ({
  reservations,
  tables,
  onSelectSlot,
  onCancelReservation
}) => {
  const { user } = useAuth();
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [selectedTimeInfo, setSelectedTimeInfo] = useState<{ start: Date, end: Date } | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const calendarRef = useRef<FullCalendar>(null);
  
  // Estados para las horas de inicio y fin del calendario
  const [minTime, setMinTime] = useState<string>(getMinTime());
  const [maxTime, setMaxTime] = useState<string>(getMaxTime());
  const [initialDate, setInitialDate] = useState<Date>(new Date());
  const setCurrentViewType = useState<string>('timeGridWeek')[1];
  
  // Actualizar las horas de inicio y fin cuando cambie la configuración
  useEffect(() => {
    const updateCalendarTimes = () => {
      const minT = getMinTime();
      const maxT = getMaxTime();
      setMinTime(minT);
      setMaxTime(maxT);
      
      console.log('Horas del calendario configuradas:', { 
        allowedStartTime: window.reservationConfig?.allowed_start_time || '08:00',
        allowedEndTime: window.reservationConfig?.allowed_end_time || '22:00',
        minTimeHours: minT,
        maxTimeHours: maxT
      });
    };
    
    updateCalendarTimes();
  }, []);
  // Función para obtener el rango de fechas válido - ya no limitamos para permitir ver historial
  const getValidRange = () => {
    return {}; // No establecemos límites para permitir navegación completa
  };
  
  // Configurar la vista inicial para mostrar la semana comenzando desde hoy
  useEffect(() => {
    if (calendarRef.current) {
      const today = new Date();
      setInitialDate(today);
      
      // Asegurar que estamos en la vista semanal
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(today); // Ir a la fecha actual
      calendarApi.changeView('timeGridWeek'); // Establecer vista semanal
      
      // Configurar la vista para que comience en el día actual
      const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, etc.
      // Cuando la vista se inicialice, usar este día como primer día de la semana
      calendarApi.setOption('firstDay', currentDay);
      
      console.log('Vista de semana configurada para comenzar hoy:', today);
      console.log('Día actual de la semana:', currentDay);
      
      // Registrar en consola la configuración de horas
      console.log('Configuración del calendario cargada:', {
        minTime,
        maxTime,
        date: today,
        dayOfWeek: today.getDay()
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar el componente
    // Convertir reservas al formato de eventos de FullCalendar y filtrar las canceladas
  const events: EventSourceInput = reservations
    .filter(reservation => reservation.status !== 'cancelled') // Filtrar reservas canceladas
    .map(reservation => {
      // Determinar si la reserva pertenece al usuario actual
      const isUserReservation = user && reservation.user_id === user.id;
      
      // Establecer colores según el estado y propietario de la reserva
      let backgroundColor = '#4f46e5'; // Indigo 600 por defecto
      let borderColor = '#4338ca'; // Indigo 700 por defecto
      const classNames: string[] = [];
      
      if (reservation.status === 'completed') {
        backgroundColor = '#3b82f6'; // Azul para completadas
        borderColor = '#2563eb';
        classNames.push('reservation-completed');
      } else if (isUserReservation) {
        backgroundColor = '#eab308'; // Amarillo para reservas del usuario actual
        borderColor = '#ca8a04';
        classNames.push('reservation-own');
      }
      
      return {
        id: reservation.id.toString(),
        title: `${reservation.user_name || 'Usuario'} - ${tables.find(t => t.id === reservation.table_id)?.name || 'Mesa'}`,
        start: reservation.start_time,
        end: reservation.end_time,
        allDay: reservation.all_day,
        extendedProps: {
          tableId: reservation.table_id,
          userId: reservation.user_id,
          status: reservation.status,
          isUserReservation
        },
        backgroundColor,
        borderColor,
        textColor: '#ffffff',
        classNames
      } as CustomCalendarEvent;
    });
  
  // Función auxiliar para verificar si el horario seleccionado coincide con inicio o fin de otra reserva
  // o si no hay suficiente tiempo entre reservas
  const checkForConsecutiveReservations = (
    tableId: number, 
    start: Date, 
    end: Date,
    allReservations: Reservation[] = reservations // Parámetro opcional con valor predeterminado
  ): { isConsecutive: boolean, existingReservation?: Reservation, isTooClose?: boolean, minutesBetween?: number, notAllowedConsecutive?: boolean } => {
    // Formatear horas para comparación (formato "HH:MM")
    const formatTimeForComparison = (date: Date): string => {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };
    
    const selectedStartTime = formatTimeForComparison(start);
    const selectedEndTime = formatTimeForComparison(end);
    const selectedDateStr = start.toDateString(); // Para comparar solo fecha sin hora
    
    console.log(`Verificando reserva en mesa ${tableId}:`, {
      selectedStartTime,
      selectedEndTime,
      selectedDate: selectedDateStr
    });
    
    // Buscar reservas del mismo día para esa mesa
    const sameTableReservations = allReservations.filter((reservation: Reservation) => {
      const resStart = new Date(reservation.start_time);
      return (
        reservation.status === 'active' && 
        reservation.table_id === tableId &&
        resStart.toDateString() === selectedDateStr
      );
    });
    
    console.log(`Encontradas ${sameTableReservations.length} reservas activas para ese día y mesa`);
    
    // Obtener configuración del tiempo mínimo entre reservas
    const allowConsecutive = window.reservationConfig?.allow_consecutive_reservations ?? true;
    const minTimeBetweeenReservations = window.reservationConfig?.min_time_between_reservations ?? 0;
    
    // Verificar si alguna reserva comienza o termina exactamente a la misma hora que la selección
    for (const reservation of sameTableReservations) {
      const resStart = new Date(reservation.start_time);
      const resEnd = new Date(reservation.end_time);
      
      const reservationStartTime = formatTimeForComparison(resStart);
      const reservationEndTime = formatTimeForComparison(resEnd);
      
      console.log(`Comparando con reserva #${reservation.id}:`, {
        reservationStartTime,
        reservationEndTime,
        selectedStartTime,
        selectedEndTime
      });
      
      // Comprobar si el inicio o fin coincide con inicio o fin de alguna reserva existente
      const isConsecutiveReservation = 
        selectedStartTime === reservationEndTime ||
        selectedEndTime === reservationStartTime;
      
      console.log(`¿Reservas consecutivas?`, {
        isConsecutiveReservation,
        selectedStartEqualsResEnd: selectedStartTime === reservationEndTime,
        selectedEndEqualsResStart: selectedEndTime === reservationStartTime,
        allowConsecutive
      });
      
      // Comprobar si coincide exactamente (mismo inicio o mismo fin)
      if (
        selectedStartTime === reservationStartTime ||
        selectedEndTime === reservationEndTime
      ) {
        console.log('Conflicto: mismo horario de inicio o fin');
        return { isConsecutive: true, existingReservation: reservation };
      }
      
      // Si son consecutivas y no está permitido, retornar error específico
      if (isConsecutiveReservation && !allowConsecutive) {
        console.log('Reservas consecutivas no permitidas. Config:', { allowConsecutive });
        return { 
          isConsecutive: true, 
          existingReservation: reservation,
          notAllowedConsecutive: true 
        };
      }
      
      // Si son consecutivas y están permitidas, no verificamos el tiempo mínimo entre reservas
      if (isConsecutiveReservation && allowConsecutive) {
        console.log('Reservas consecutivas permitidas. Se omite verificación de tiempo mínimo.');
        continue; // Saltamos a la siguiente reserva sin verificar tiempo mínimo
      }
      
      // Si hay un tiempo mínimo entre reservas y no son consecutivas, verificamos el tiempo
      if (minTimeBetweeenReservations > 0) {
        // Calcular diferencia de tiempo en minutos entre reservas
        let minutesBetween = 0;
        let isTooClose = false;
        
        // Caso 1: La reserva nueva comienza después de una existente
        if (start >= resEnd) {
          minutesBetween = Math.floor((start.getTime() - resEnd.getTime()) / (1000 * 60));
          isTooClose = minutesBetween < minTimeBetweeenReservations;
          console.log('Nueva reserva después de existente:', { minutesBetween, isTooClose, minRequired: minTimeBetweeenReservations });
        }
        // Caso 2: La reserva existente comienza después de la nueva
        else if (end <= resStart) {
          minutesBetween = Math.floor((resStart.getTime() - end.getTime()) / (1000 * 60));
          isTooClose = minutesBetween < minTimeBetweeenReservations;
          console.log('Nueva reserva antes de existente:', { minutesBetween, isTooClose, minRequired: minTimeBetweeenReservations });
        }
        
        if (isTooClose) {
          console.log('Tiempo insuficiente entre reservas');
          return { 
            isConsecutive: false, 
            isTooClose: true, 
            minutesBetween, 
            existingReservation: reservation 
          };
        }
      }
    }
    
    return { isConsecutive: false, isTooClose: false };
  };
  
  // Manejar la selección de un slot en el calendario
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    
    const now = new Date();
    const selectedStart = new Date(selectInfo.start);
    const selectedEnd = new Date(selectInfo.end);
    
    // No permitir reservas en el pasado
    if (selectedStart < now) {
      showError('Fecha no válida', 'No se pueden realizar reservas en fechas u horas pasadas');
      return;
    }
    
    // Verificar la duración de la reserva
    const maxHours = window.reservationConfig?.max_hours_per_reservation || 4;
    const reservationDuration = (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60);
    
    if (reservationDuration > maxHours) {
      showError('Duración excedida', `La reserva no puede durar más de ${maxHours} horas`);
      return;
    }
    
    // Si estamos en la vista de mes, cambiar a la vista de día
    if (selectInfo.view.type === 'dayGridMonth') {
      const calendarApi = selectInfo.view.calendar;
      calendarApi.changeView('timeGridDay', selectedStart);
      setCurrentViewType('timeGridDay');
      return;
    }
    
    // Si hay más de una mesa, mostrar el selector
    if (tables.length > 1) {
      setSelectedTimeInfo({
        start: selectedStart,
        end: selectedEnd
      });
      
      // Calcular posición para el popover
      const x = window.innerWidth / 2 - 140;
      const y = window.innerHeight / 2 - 200;
      
      setPopoverPosition({
        left: Math.min(x, window.innerWidth - 280),
        top: Math.min(y, window.innerHeight - 400)
      });
      
      setShowTableSelector(true);
    } else if (tables.length === 1) {
      // Si solo hay una mesa, verificar primero si hay reservas consecutivas
      const tableId = tables[0].id;
      console.log('Verificando reserva en mesa única:', tableId, 'Inicio:', selectedStart, 'Fin:', selectedEnd);
      console.log('Configuración actual:', window.reservationConfig);
      
      const { isConsecutive, isTooClose, minutesBetween, notAllowedConsecutive } = checkForConsecutiveReservations(tableId, selectedStart, selectedEnd, reservations);
      
      console.log('Resultado de la verificación:', { isConsecutive, notAllowedConsecutive, isTooClose, minutesBetween });
      
      if (isConsecutive) {
        // Si encontramos una reserva consecutiva, mostrar error y no permitir la reserva
        const existingTable = tables.find(t => t.id === tableId)?.name || 'la mesa seleccionada';
        
        if (notAllowedConsecutive) {
          console.log('Mostrando error: Reservas consecutivas no permitidas');
          showError(
            'Reservas consecutivas no permitidas', 
            `No se permiten reservas consecutivas según la configuración actual del sistema. No puedes reservar justo al terminar o antes de comenzar otra reserva.`
          );
        } else {
          console.log('Mostrando error: Horario no disponible (conflicto de horario)');
          showError(
            'Horario no disponible', 
            `No es posible realizar la reserva porque ya existe una reserva que comienza o termina exactamente a la misma hora en ${existingTable}.`
          );
        }
        return;
      }
      
      if (isTooClose) {
        // Si no hay suficiente tiempo entre reservas
        const existingTable = tables.find(t => t.id === tableId)?.name || 'la mesa seleccionada';
        const minTimeBetween = window.reservationConfig?.min_time_between_reservations || 0;
        showError(
          'Tiempo insuficiente entre reservas', 
          `Debe haber al menos ${minTimeBetween} minutos entre reservas en ${existingTable}. Actualmente hay ${minutesBetween} minutos de diferencia.`
        );
        return;
      }
      
      // Si no hay problemas, continuar con la reserva
      onSelectSlot(tableId, selectedStart, selectedEnd);
    }
  };
  // Manejar clic en un evento (reserva)
  const handleEventClick = async (clickInfo: EventClickArg) => {
    const extendedProps = clickInfo.event.extendedProps as { 
      status: string, 
      isUserReservation: boolean,
      userId: number
    };
    
    // Solo permitir cancelar reservas propias y activas
    if (extendedProps.isUserReservation && extendedProps.status === 'active') {
      // Mostrar diálogo de confirmación antes de cancelar
      const isConfirmed = await showConfirm(
        '¿Cancelar reserva?',
        '¿Estás seguro de que deseas cancelar esta reserva?',
        'Cancelar reserva',
        'Volver'
      );
      
      if (isConfirmed) {
        onCancelReservation(parseInt(clickInfo.event.id));
      }
    }
  };
  
  // Renderizar contenido personalizado para los eventos
  const renderEventContent = (eventInfo: EventContentArg) => {
    const { event } = eventInfo;
    const extendedProps = event.extendedProps as { status: string, isUserReservation: boolean };
    const { status, isUserReservation } = extendedProps;
    
    // Formatear horas con padding de ceros
    const formatHour = (date: Date | null) => {
      if (!date) return "00:00";
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    const startTime = formatHour(event.start);
    const endTime = formatHour(event.end);
    
    return (
      <div className="fc-event-main-content p-1">
        <div className="font-medium text-white" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
          {event.title}
        </div>
        <div className="text-xs mt-1 text-white font-medium" style={{ opacity: 0.9 }}>
          {startTime} - {endTime} h
        </div>
        <div className="text-xs mt-1 font-medium">
          {status === 'cancelled' && (
            <span className="text-red-200">Cancelada</span>
          )}
          {status === 'completed' && (
            <span className="text-blue-200">Completada</span>
          )}
          {isUserReservation && status === 'active' && (
            <span className="text-yellow-200 animate-pulse">Toca para cancelar</span>
          )}
        </div>
      </div>
    );
  };
  // Gestionar cambios en la vista del calendario
  const handleViewChange = (viewInfo: ViewMountArg) => {
    const newViewType = viewInfo.view.type;
    setCurrentViewType(newViewType);
    console.log(`Vista cambiada a: ${newViewType}`);
  };
    // Configurar la vista para mostrar exactamente una semana a partir del día actual
    return (
    <div className="calendar-container">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin, momentPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}        initialDate={initialDate}
        // La vista debe comenzar en el día actual
        duration={{ days: 7 }}
        validRange={getValidRange()}
        navLinks={true}
        slotMinTime={minTime}
        slotMaxTime={maxTime}
        allDaySlot={false}
        slotDuration="01:00:00"
        slotLabelInterval="01:00"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        locale="es"
        timeZone="local"
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        nowIndicator={true}
        events={events}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        select={handleDateSelect}
        viewDidMount={handleViewChange}
        height="auto"
        expandRows={true}
        stickyHeaderDates={true}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        dayHeaderFormat={{
          weekday: 'long',
          day: 'numeric',
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          list: 'Lista'
        }}
        views={{
          timeGridWeek: {
            titleFormat: { 
              day: 'numeric', 
              month: 'long'
            },
            dayHeaderFormat: {
              weekday: 'short',
              day: 'numeric',
              month: 'numeric'
            }
          },
          timeGridDay: {
            titleFormat: {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }
          },
          dayGridMonth: {
            titleFormat: {
              month: 'long',
              year: 'numeric'
            }
          }
        }}
      />
      
      {showTableSelector && selectedTimeInfo && (
        <TableSelectionPopover
          tables={tables}
          start={selectedTimeInfo.start}
          end={selectedTimeInfo.end}
          onSelectTable={onSelectSlot}
          onClose={() => setShowTableSelector(false)}
          position={popoverPosition}
          reservations={reservations}
        />
      )}
    </div>
  );
};

export default Calendar7Days;
export { Calendar7Days };
