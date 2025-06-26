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
      className="table-selection-popover fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4" 
      style={{ top: position.top, left: position.left }}
    >
      <div className="font-medium mb-2">Selecciona una mesa:</div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {tables.map(table => (
          <div 
            key={table.id}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => {
              onSelectTable(table.id, start, end);
              onClose();
            }}
          >
            <div className="font-medium">{table.name}</div>
            {table.description && (
              <div className="text-xs text-gray-600 dark:text-gray-400">{table.description}</div>
            )}
          </div>
        ))}
      </div>
      <button 
        className="mt-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        onClick={onClose}
      >
        Cancelar
      </button>
    </div>
  );
};

const FullCalendarComponent: React.FC<CalendarProps> = ({
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
  
  // Función para obtener el rango de fechas comenzando desde hoy y durando 7 días
  const getValidRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear a las 00:00:00
    
    return {
      start: today
    };
  };
  
  // Configurar la vista inicial para mostrar 7 días desde hoy
  useEffect(() => {
    if (calendarRef.current) {
      const today = new Date();
      setInitialDate(today);
      
      // Asegurar que estamos en la vista semanal
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(today);
      calendarApi.changeView('timeGridWeek');
    }
  }, []);
  
  // Convertir reservas al formato de eventos de FullCalendar
  const events: EventSourceInput = reservations
    .filter(reservation => reservation.status !== 'cancelled')
    .map(reservation => {
      const start = extractLocalTime(reservation.start_time);
      const end = extractLocalTime(reservation.end_time);
      const table = tables.find(t => t.id === reservation.table_id);
      const isUserReservation = reservation.user_id === user?.id;
      const isAllDay = reservation.all_day;
      const status = reservation.status;
      
      // Establecer colores según estado y propietario
      let backgroundColor = isUserReservation 
        ? isAllDay ? '#9c27b0' : '#3788d8' 
        : isAllDay ? '#9c27b0' : '#e74c3c';
        
      // Ajustar color según el estado
      if (status === 'cancelled') {
        backgroundColor = '#8a8a8a'; // Gris para reservas canceladas
      } else if (status === 'completed') {
        backgroundColor = '#4caf50'; // Verde para reservas completadas
      }
      
      return {
        id: reservation.id.toString(),
        title: table ? `${table.name} ${isUserReservation ? '(Tu reserva)' : ''}` : 'Reserva',
        start: start.toISOString(),
        end: end.toISOString(),
        allDay: isAllDay,
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: '#ffffff',
        classNames: [
          status === 'active' ? 'opacity-90' : 'opacity-70',
          isUserReservation && status === 'active' ? 'user-reservation cursor-pointer' : ''
        ],
        extendedProps: {
          tableId: reservation.table_id,
          userId: reservation.user_id,
          status: reservation.status,
          resource: table,
          isUserReservation: isUserReservation
        }
      };
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
      const x = window.innerWidth / 2 - 125;
      const y = window.innerHeight / 2 - 150;
      
      setPopoverPosition({
        left: Math.min(x, window.innerWidth - 260),
        top: Math.min(y, window.innerHeight - 300)
      });
      
      setShowTableSelector(true);
    } else if (tables.length === 1) {
      // Si solo hay una mesa, seleccionarla directamente
      onSelectSlot(tables[0].id, selectedStart, selectedEnd);
    }
    
    // Limpiar selección
    selectInfo.view.calendar.unselect();
  };
  
  // Manejar la selección de mesa
  const handleTableSelect = (tableId: number, start: Date, end: Date) => {
    onSelectSlot(tableId, start, end);
  };
  
  // Función para manejar la cancelación de reserva
  const handleEventClick = async (clickInfo: EventClickArg) => {
    const { event } = clickInfo;
    const extendedProps = event.extendedProps as { userId: number, status: string };
    const { userId, status } = extendedProps;
    
    // Solo permitir cancelar reservas propias y activas
    if (userId !== user?.id || status !== 'active') return;
    
    const isConfirmed = await showConfirm(
      'Cancelar reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      'Cancelar reserva',
      'Volver'
    );
    
    if (isConfirmed) {
      onCancelReservation(parseInt(event.id));
    }
  };
  
  // Renderizar contenido personalizado para los eventos
  const renderEventContent = (eventInfo: EventContentArg) => {
    const { event } = eventInfo;
    const extendedProps = event.extendedProps as { status: string, isUserReservation: boolean };
    const { status, isUserReservation } = extendedProps;
    
    // Formatear horas con padding de ceros
    const formatHour = (dateStr: string | null) => {
      if (!dateStr) return "00:00";
      const date = new Date(dateStr);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    const startTime = formatHour(event.start ? event.start.toISOString() : null);
    const endTime = formatHour(event.end ? event.end.toISOString() : null);
    
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
  
  return (
    <div className="h-[600px] relative">
      <div className="text-center mb-2 font-medium">
        {currentViewType === 'timeGridWeek' && (
          <div className="text-lg">Próximos 7 días</div>
        )}
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, momentPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="timeGridWeek"
        initialDate={initialDate}
        validRange={getValidRange}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        editable={false}
        selectable={true}
        selectAllow={(selectInfo) => {
          // Solo permitir seleccionar desde hoy
          return selectInfo.start >= new Date();
        }}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        viewDidMount={handleViewChange}
        locale="es"
        firstDay={1} // Lunes como primer día de la semana
        slotMinTime={minTime}
        slotMaxTime={maxTime}
        allDayText="Todo el día"
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          list: 'Lista'
        }}
        slotDuration="01:00:00"
        timeZone="local"
        nowIndicator={true}
        height="100%"
        expandRows={true}
      />
      
      {showTableSelector && selectedTimeInfo && (
        <TableSelectionPopover
          tables={tables}
          start={selectedTimeInfo.start}
          end={selectedTimeInfo.end}
          onSelectTable={handleTableSelect}
          onClose={() => setShowTableSelector(false)}
          position={popoverPosition}
        />
      )}
    </div>
  );
};

export { FullCalendarComponent as FullCalendar7Days };
