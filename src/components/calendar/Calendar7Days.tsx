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
import { createModuleLogger } from '../../utils/loggerExampleUsage';
import './calendar-styles.css'; // Estilos personalizados existentes
import './fullcalendar-styles.css'; // Estilos para FullCalendar
import './fullcalendar-responsive.css'; // Nuevos estilos responsive para móviles y tablets

const calendarLogger = createModuleLogger('CALENDAR');

// Hook personalizado para detectar el tamaño de la ventana
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    // Handler para llamar en resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Añadir event listener
    window.addEventListener("resize", handleResize);
    
    // Llamar al handler para establecer el tamaño inicial
    handleResize();
    
    // Limpiar event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Array vacío significa que esto se ejecutará una vez
  
  return windowSize;
};

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
    isAllDayApproved?: boolean;
    originalReservationId?: number;
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
  checkForConsecutiveReservations: (tableId: number, start: Date, end: Date) => boolean;
}

// Componente para seleccionar mesa
const TableSelectionPopover: React.FC<TableSelectionPopoverProps> = ({ 
  tables, 
  start,
  end,
  onSelectTable,
  onClose,
  position,
  checkForConsecutiveReservations
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
              if (checkForConsecutiveReservations(table.id, start, end)) {
                onSelectTable(table.id, start, end);
                onClose();
              }
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

export const Calendar7Days: React.FC<CalendarProps> = ({
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
  const [currentView, setCurrentView] = useState<string>('timeGridWeek');
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  
  // Estados para las horas de inicio y fin del calendario
  const [minTime, setMinTime] = useState<string>(getMinTime());
  const [maxTime, setMaxTime] = useState<string>(getMaxTime());
  const [initialDate, setInitialDate] = useState<Date>(new Date());
  
  // Función para detectar si estamos en una vista móvil
  const checkIfMobile = (): boolean => {
    return window.innerWidth < 768; // Consideramos móvil por debajo de 768px
  };
  
  // Actualiza la vista basada en el tamaño de la pantalla
  const updateCalendarView = () => {
    const isMobile = checkIfMobile();
    setIsMobileView(isMobile);
    
    if (isMobile && calendarRef.current) {
      // En móvil por defecto mostramos la vista de día o lista
      if (currentView === 'timeGridWeek' || currentView === 'dayGridMonth') {
        calendarRef.current.getApi().changeView('timeGridDay');
        setCurrentView('timeGridDay');
      }
    }
  };
  
  // Efecto para detectar cambios en el tamaño de la ventana
  useEffect(() => {
    // Detectar el tamaño inicial
    updateCalendarView();
    
    // Agregar listener para redimensionamiento
    const handleResize = () => {
      updateCalendarView();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
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
      
      calendarLogger.debug('Vista de semana configurada', { 
        today: today.toISOString(),
        currentDay: currentDay 
      });
      
      // Registrar en consola la configuración de horas
      calendarLogger.debug('Configuración del calendario cargada', {
        minTime,
        maxTime,
        date: today.toISOString(),
        dayOfWeek: today.getDay()
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar el componente
    // Convertir reservas al formato de eventos de FullCalendar y filtrar las canceladas
  const events: EventSourceInput = reservations
    .filter(reservation => reservation.status !== 'cancelled') // Filtrar reservas canceladas
    .flatMap(reservation => {
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

      // Para reservas de todo el día aprobadas, crear un solo evento que abarque todo el rango
      if (reservation.all_day && reservation.approved) {
        calendarLogger.debug('Procesando reserva de todo el día aprobada', {
          reservationId: reservation.id,
          user: reservation.user_name,
          table: tables.find(t => t.id === reservation.table_id)?.name,
          start: reservation.start_time,
          end: reservation.end_time
        });
        
        return [{
          id: reservation.id.toString(),
          title: `${reservation.user_name || 'Usuario'} - ${tables.find(t => t.id === reservation.table_id)?.name || 'Mesa'} (Todo el día - APROBADA)`,
          start: reservation.start_time,
          end: reservation.end_time,
          allDay: false, // Mostrar en la vista de tiempo para que abarque las horas
          extendedProps: {
            tableId: reservation.table_id,
            userId: reservation.user_id,
            status: reservation.status,
            isUserReservation,
            isAllDayApproved: true,
            originalReservationId: reservation.id
          },
          backgroundColor: '#9333ea', // Purple para reservas de todo el día aprobadas
          borderColor: '#7c3aed',
          textColor: '#ffffff',
          classNames: [...classNames, 'reservation-all-day-approved']
        } as CustomCalendarEvent];
      }
      
      // Para reservas normales o de todo el día no aprobadas, mostrar como antes
      return [{
        id: reservation.id.toString(),
        title: `${reservation.user_name || 'Usuario'} - ${tables.find(t => t.id === reservation.table_id)?.name || 'Mesa'}${reservation.all_day && !reservation.approved ? ' (Pendiente aprobación)' : ''}`,
        start: reservation.start_time,
        end: reservation.end_time,
        allDay: reservation.all_day && !reservation.approved, // Solo mostrar como allDay si no está aprobada
        extendedProps: {
          tableId: reservation.table_id,
          userId: reservation.user_id,
          status: reservation.status,
          isUserReservation,
          isAllDayApproved: false,
          originalReservationId: reservation.id
        },
        backgroundColor,
        borderColor,
        textColor: '#ffffff',
        classNames
      } as CustomCalendarEvent];
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
    
    // Si estamos en la vista de mes, cambiar a la vista de día del día seleccionado
    if (selectInfo.view.type === 'dayGridMonth') {
      const calendarApi = selectInfo.view.calendar;
      calendarApi.changeView('timeGridDay', selectedStart);
      setCurrentView('timeGridDay');
      return;
    }
    
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
      // Si solo hay una mesa, verificar si hay conflictos y seleccionarla si está disponible
      const tableId = tables[0].id;
      if (checkForConsecutiveReservations(tableId, selectedStart, selectedEnd)) {
        onSelectSlot(tableId, selectedStart, selectedEnd);
      }
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
  // Manejador para cambios de vista
  const handleViewChange = (arg: ViewMountArg) => {
    setCurrentView(arg.view.type);
  };
    // Verificar si hay alguna reserva consecutiva o si no hay suficiente tiempo entre reservas
  const checkForConsecutiveReservations = (tableId: number, start: Date, end: Date) => {
    // Verificación 1: Comprobar si la mesa está disponible
    const tableReservations = reservations.filter(r => 
      r.table_id === tableId && 
      r.status === 'active' && 
      (!user || r.user_id !== user.id) // Ignorar reservas propias del usuario en la mesa
    );
    
    const table = tables.find(t => t.id === tableId);
    const tableName = table ? table.name : `Mesa ${tableId}`;
    
    // Obtener configuración de reservas consecutivas y tiempo mínimo entre reservas
    const allowConsecutive = window.reservationConfig?.allow_consecutive_reservations ?? true;
    const minTimeBetween = window.reservationConfig?.min_time_between_reservations ?? 0;
    
    calendarLogger.debug('Verificando disponibilidad de reserva', {
      tableId,
      tableName,
      start: start.toISOString(),
      end: end.toISOString()
    });
    calendarLogger.debug('Configuración de reservas consecutivas', {
      allowConsecutive,
      minTimeBetween
    });
    
    // Primero verificar si la mesa está disponible
    for (const reservation of tableReservations) {
      const resStart = new Date(reservation.start_time);
      const resEnd = new Date(reservation.end_time);
      
      // Convertir las fechas a timestamp para comparación
      const selectedStartTime = start.getTime();
      const selectedEndTime = end.getTime();
      const reservationStartTime = resStart.getTime();
      const reservationEndTime = resEnd.getTime();
      
      // Si hay superposición, no permitir la reserva
      if (
        (selectedStartTime < reservationEndTime && selectedEndTime > reservationStartTime) ||
        selectedStartTime === reservationStartTime ||
        selectedEndTime === reservationEndTime
      ) {
        showError(
          'Horario no disponible',
          `La mesa ${tableName} ya está reservada en ese horario (${resStart.toLocaleTimeString()} a ${resEnd.toLocaleTimeString()}).`
        );
        return false;
      }
    }
    
    // Verificación 2: Comprobar si el usuario tiene reservas consecutivas o demasiado cercanas
    if (user) {
      // Filtrar las reservas activas del usuario actual para el mismo día
      const userReservations = reservations.filter(r => 
        r.user_id === user.id && 
        r.status === 'active' &&
        new Date(r.start_time).toDateString() === start.toDateString()
      );
      
      for (const reservation of userReservations) {
        const resStart = new Date(reservation.start_time);
        const resEnd = new Date(reservation.end_time);
        
        // Convertir las fechas a timestamp para comparación
        const selectedStartTime = start.getTime();
        const selectedEndTime = end.getTime();
        const reservationStartTime = resStart.getTime();
        const reservationEndTime = resEnd.getTime();
        
        // Comprobar si el inicio o fin coincide con fin o inicio de alguna reserva existente (consecutivas)
        const isConsecutiveReservation = 
          selectedStartTime === reservationEndTime ||
          selectedEndTime === reservationStartTime;
          
        // Si son consecutivas y no está permitido, mostrar error específico
        if (isConsecutiveReservation && !allowConsecutive) {
          const otherTable = tables.find(t => t.id === reservation.table_id)?.name || 'otra mesa';
          showError(
            'Reservas consecutivas no permitidas',
            `No se permiten reservas consecutivas según la configuración actual del sistema. Ya tienes una reserva en ${otherTable} de ${resStart.toLocaleTimeString()} a ${resEnd.toLocaleTimeString()}.`
          );
          calendarLogger.warn('Reservas consecutivas no permitidas', { allowConsecutive });
          return false;
        }
        
        // Si son consecutivas y están permitidas, no verificamos el tiempo mínimo entre reservas
        if (isConsecutiveReservation && allowConsecutive) {
          calendarLogger.debug('Reservas consecutivas permitidas, omitiendo verificación de tiempo mínimo');
          continue; // Saltamos a la siguiente reserva sin verificar tiempo mínimo
        }
        
        // Verificar el tiempo mínimo entre reservas no consecutivas
        let minutesBetween = 0;
        let isTooClose = false;
        
        // Caso 1: La reserva nueva comienza después de una existente
        if (selectedStartTime > reservationEndTime) {
          minutesBetween = Math.floor((selectedStartTime - reservationEndTime) / (1000 * 60));
          isTooClose = minutesBetween < minTimeBetween;
        }
        // Caso 2: La reserva existente comienza después de la nueva
        else if (selectedEndTime < reservationStartTime) {
          minutesBetween = Math.floor((reservationStartTime - selectedEndTime) / (1000 * 60));
          isTooClose = minutesBetween < minTimeBetween;
        }
        
        // Si no hay suficiente tiempo entre reservas, mostrar error
        if (isTooClose) {
          const otherTable = tables.find(t => t.id === reservation.table_id)?.name || 'otra mesa';
          showError(
            'Tiempo insuficiente entre reservas',
            `Debe haber al menos ${minTimeBetween} minutos entre tus reservas. Tienes otra reserva en ${otherTable} de ${resStart.toLocaleTimeString()} a ${resEnd.toLocaleTimeString()}, con solo ${minutesBetween} minutos de diferencia.`
          );
          calendarLogger.warn('Tiempo insuficiente entre reservas del usuario', { 
            minTimeBetween, 
            minutesBetween, 
            newReservation: {
              start: start.toISOString(), 
              end: end.toISOString()
            },
            existingReservation: {
              start: resStart.toISOString(),
              end: resEnd.toISOString()
            }
          });
          return false;
        }
      }
    }
    
    return true;
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
          checkForConsecutiveReservations={checkForConsecutiveReservations}
        />
      )}
    </div>
  );
};

export default Calendar7Days;

