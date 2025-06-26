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
import { extractLocalTime } from '../../utils/dateUtils';
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
    return window.reservationConfig.allowed_end_time;
  }
  return '22:00:00'; // 10:00 PM por defecto
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
}

// Componente para seleccionar mesa
const TableSelectionPopover: React.FC<TableSelectionPopoverProps> = ({ 
  tables, 
  start,
  end,
  onSelectTable,
  onClose,
  position
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
  const [currentViewType, setCurrentViewType] = useState<string>('timeGridWeek');
  
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
  
  // Función para obtener el rango de fechas comenzando desde hoy
  const getValidRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear a las 00:00:00
    
    return {
      start: today // Solo establecemos la fecha de inicio, dejando el fin abierto
    };
  };
  
  // Configurar la vista inicial para mostrar la semana comenzando desde hoy
  useEffect(() => {
    if (calendarRef.current) {
      const today = new Date();
      setInitialDate(today);
      
      // Asegurar que estamos en la vista semanal
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(today);
      calendarApi.changeView('timeGridWeek');
      
      // Registrar en consola la configuración de horas
      console.log('Configuración del calendario cargada:', {
        minTime,
        maxTime,
        date: today,
        validRange: getValidRange()
      });
    }
  }, [minTime, maxTime]);
  
  // Convertir reservas al formato de eventos de FullCalendar
  const events: EventSourceInput = reservations
    .map(reservation => {
      // Determinar si la reserva pertenece al usuario actual
      const isUserReservation = user && reservation.user_id === user.id;
      
      // Establecer colores según el estado y propietario de la reserva
      let backgroundColor = '#4f46e5'; // Indigo 600 por defecto
      let borderColor = '#4338ca'; // Indigo 700 por defecto
      let classNames: string[] = [];
      
      if (reservation.status === 'cancelled') {
        backgroundColor = '#ef4444'; // Rojo para canceladas
        borderColor = '#dc2626';
        classNames.push('reservation-cancelled');
      } else if (reservation.status === 'completed') {
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
      // Si solo hay una mesa, seleccionarla directamente
      onSelectSlot(tables[0].id, selectedStart, selectedEnd);
    }
  };
  
  // Manejar clic en un evento (reserva)
  const handleEventClick = (clickInfo: EventClickArg) => {
    const extendedProps = clickInfo.event.extendedProps as { 
      status: string, 
      isUserReservation: boolean,
      userId: number
    };
    
    // Solo permitir cancelar reservas propias y activas
    if (extendedProps.isUserReservation && extendedProps.status === 'active') {
      // Mostrar diálogo de confirmación antes de cancelar
      showConfirm(
        '¿Cancelar reserva?',
        '¿Estás seguro de que deseas cancelar esta reserva?',
        () => {
          onCancelReservation(parseInt(clickInfo.event.id));
        }
      );
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
    setCurrentViewType(viewInfo.view.type);
  };
  
  // Determinar el primer día de la semana basado en el día actual
  const getFirstDayOfWeek = () => {
    // Si queremos que la semana comience en el día actual, devolvemos -1
    // FullCalendar tratará esto como "día actual"
    return -1;
  };
  
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
        }}
        initialDate={initialDate}
        firstDay={getFirstDayOfWeek()}
        validRange={getValidRange()}
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
        />
      )}
    </div>
  );
};

export default Calendar7Days;
export { Calendar7Days };
