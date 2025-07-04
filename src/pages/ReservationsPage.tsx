import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, List } from '../utils/icons';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Table, Reservation } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { tableService, reservationService, configService } from '../services/api';
import { showSuccess, showError, showLoading, closeLoading } from '../utils/alerts';
import { preserveLocalTime } from '../utils/dateUtils';
import { Calendar7Days } from '../components/calendar/Calendar7Days';
import ReservationsList from '../components/calendar/ReservationsList';
import { testHoursVisualization } from '../utils/hourVisualizationTest';
import { hasReachedDailyLimit, hasMinimumAdvanceTime } from '../utils/reservationValidation';
import { UserLayout } from '../components/layout/UserLayout';

// Tipo para errores de API
type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
  error?: string;
};

export const ReservationsPage: React.FC = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    tableId: number;
    start: Date;
    end: Date;
  } | null>(null);
  const [numMembers, setNumMembers] = useState<number>(1);
  const [numGuests, setNumGuests] = useState<number>(0);
  const [allDayReservation, setAllDayReservation] = useState<boolean>(false);
  const [reservationReason, setReservationReason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar'); // Estado para el modo de vista  // Función para verificar y actualizar automáticamente el estado de las reservas pasadas
  const checkAndUpdateCompletedReservations = (reservationsData: Reservation[]) => {
    const now = new Date();
    const updatedReservations: Reservation[] = [];
    const updatePromises: Promise<unknown>[] = [];
    
    reservationsData.forEach(reservation => {
      const endTime = new Date(reservation.end_time);
      // Si la reserva es activa y ya pasó la fecha y hora de fin, cambiarla a completada
      if (reservation.status === 'active' && endTime < now) {
        updatePromises.push(
          reservationService.updateReservationStatus(reservation.id, 'completed')
            .then(() => console.log(`Reserva ${reservation.id} marcada como completada automáticamente`))
            .catch((err: Error) => console.error(`Error al actualizar reserva ${reservation.id}:`, err))
        );
        updatedReservations.push({ ...reservation, status: 'completed' as const });
      } else {
        updatedReservations.push(reservation);
      }
    });

    return { updatedReservations, updatePromises };
  };  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener mesas y reservas de la API
        const tablesData = await tableService.getAllTables();
        setTables(tablesData);
        
        const reservationsData = await reservationService.getAllReservations();
          // Obtener configuración de reservas
        try {
          const configData = await configService.getConfig();
          // Guardar la configuración en el objeto window para acceso global
          window.reservationConfig = configData;
          console.log("Configuración de reservas cargada:", configData);
        } catch (configError) {
          console.error("Error al cargar la configuración de reservas:", configError);
          // En caso de error, establecer valores predeterminados
          window.reservationConfig = {
            id: 1,
            max_hours_per_reservation: 4,
            max_reservations_per_user_per_day: 1,
            min_hours_in_advance: 0,
            allowed_start_time: '08:00',
            allowed_end_time: '22:00',
            requires_approval_for_all_day: true,
            normal_fee: 30,
            maintenance_fee: 5
          };
          console.log("Usando configuración predeterminada:", window.reservationConfig);
        }
        
        // Verificar y actualizar reservas pasadas
        const { updatedReservations, updatePromises } = checkAndUpdateCompletedReservations(reservationsData);
        
        // Establecer las reservas actualizadas
        setReservations(updatedReservations);
        
        // Esperar a que todas las actualizaciones de estado se completen en segundo plano
        Promise.all(updatePromises)
          .then(() => console.log("Todas las actualizaciones de estado de reservas se han completado"))
          .catch((err: Error) => console.error("Error al actualizar estados de reservas:", err));
        
        // Ejecutar prueba de visualización de horas
        console.log("Ejecutando prueba de visualización de horas:");
        const testResult = testHoursVisualization();
        console.log("Resultado final de la prueba:", testResult);
      } catch (error: unknown) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos de reservas. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  // Referencia para mantener las reservas actualizadas sin recrear el efecto
  const reservationsRef = useRef<Reservation[]>([]);

  // Actualizar la referencia cuando cambian las reservas
  useEffect(() => {
    reservationsRef.current = reservations;
  }, [reservations]);
  
  // Efecto separado para el intervalo de verificación
  useEffect(() => {
    // Función para verificar y actualizar periódicamente
    const checkForCompletedReservations = () => {
      // Solo verificamos las reservas completadas si hay reservas cargadas
      if (reservationsRef.current.length > 0) {
        const { updatedReservations, updatePromises } = checkAndUpdateCompletedReservations(reservationsRef.current);
        
        // Actualizar el estado solo si hay cambios
        if (updatePromises.length > 0) {
          setReservations(updatedReservations);
          Promise.all(updatePromises)
            .then(() => console.log("Actualizaciones periódicas de estado completadas"))
            .catch((err: Error) => console.error("Error en actualizaciones periódicas:", err));
        }
      }
    };
    
    // Configurar un intervalo para verificar periódicamente las reservas completadas
    const intervalId = setInterval(checkForCompletedReservations, 60000); // Verificar cada minuto

    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, []);

  const handleSelectSlot = (tableId: number, start: Date, end: Date) => {
    if (!user) {
      // Redireccionar a login si no hay usuario autenticado
      window.location.href = '/auth';
      return;
    }
    
    // Restablecer valores por defecto
    setNumMembers(1);
    setNumGuests(0);
    setAllDayReservation(false);
    setReservationReason('');
    
    setSelectedSlot({ tableId, start, end });
    setShowModal(true);
  };  const handleMakeReservation = async () => {
    if (!selectedSlot || !user) return;
    
    if (allDayReservation && !reservationReason) {
      showError('Error', 'Debes proporcionar una justificación para reservas de todo el día.');
      return;
    }
    
    try {
      setLoading(true);
      showLoading('Creando reserva...');
        // Usar funciones de validación importadas directamente
      
      // Usamos directamente las fechas de inicio y fin seleccionadas
      const startDate = new Date(selectedSlot.start);
      let endDate: Date;
      
      // Obtener los valores de configuración o usar valores predeterminados
      const config = window.reservationConfig || {
        max_hours_per_reservation: 4,
        max_reservations_per_user_per_day: 1,
        min_hours_in_advance: 0,
        allowed_start_time: "08:00",
        allowed_end_time: "22:00",
        requires_approval_for_all_day: true
      };
      
      // Verificar el tiempo mínimo de antelación
      if (!hasMinimumAdvanceTime(startDate, config.min_hours_in_advance)) {
        closeLoading();
        showError(
          'Antelación insuficiente', 
          `Las reservas deben hacerse con al menos ${config.min_hours_in_advance} horas de antelación.`
        );
        setLoading(false);
        return;      }      // Verificar límite diario de reservas solo si hay un límite configurado
      if (config.max_reservations_per_user_per_day > 0) {
        const { hasReached, currentCount } = hasReachedDailyLimit(user.id, startDate, reservations, config.max_reservations_per_user_per_day);
        
        if (hasReached) {
          closeLoading(); // Importante cerrar el modal de carga antes
          setLoading(false); // Desactivar el indicador de carga
          
          // En lugar de la implementación directa, usamos showError de alerts.ts que ya tiene el manejo mejorado
          showError(
            'Límite diario alcanzado',
            `Ya tienes ${currentCount} ${currentCount === 1 ? 'reserva' : 'reservas'} para este día. El límite configurado es de ${config.max_reservations_per_user_per_day} ${config.max_reservations_per_user_per_day === 1 ? 'reserva' : 'reservas'} diarias.`
          );
          
          return;
        }
      }
      
      if (allDayReservation) {
        // Si es todo el día, usar horarios de la configuración
        const startHour = config.allowed_start_time;
        const endHour = config.allowed_end_time;
        
        // Extraer horas y minutos
        const [startHours, startMinutes] = startHour.split(':').map(Number);
        const [endHours, endMinutes] = endHour.split(':').map(Number);
        
        startDate.setHours(startHours, startMinutes, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(endHours, endMinutes, 0, 0);
      } else {
        // Si no es todo el día, usar la fecha de fin seleccionada
        endDate = new Date(selectedSlot.end);
        
        // Verificar la duración máxima
        const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        
        if (durationHours > config.max_hours_per_reservation) {
          closeLoading();
          showError('Duración excedida', `La reserva no puede durar más de ${config.max_hours_per_reservation} horas.`);
          setLoading(false);
          return;
        }
      }
      
      // Registrar información de la reserva
      const startHour = startDate.getHours();
      const endHour = endDate.getHours();
      console.log(`Hora de inicio: ${startHour}:00, Hora de fin: ${endHour}:00`);
      console.log(`Duración: ${endHour - startHour} horas`);      
      console.log(`Fecha local inicio: ${startDate.toLocaleDateString()} ${startDate.getHours()}:${startDate.getMinutes()}`);
      console.log(`Fecha local fin: ${endDate.toLocaleDateString()} ${endDate.getHours()}:${endDate.getMinutes()}`);
      
      // Preservamos la hora local (visual) al convertir a ISO
      const startTime = preserveLocalTime(startDate);
      const endTime = preserveLocalTime(endDate);
      
      console.log(`Fecha ISO start: ${startTime}`);
      console.log(`Fecha ISO end: ${endTime}`);
      
      // Obtener nombre de la mesa para el mensaje de confirmación
      const tableName = tables.find(t => t.id === selectedSlot.tableId)?.name || 'Mesa';
      
      // Calculamos la duración real entre las horas reservadas
      const actualDuration = allDayReservation ? 14 : (endDate.getHours() - startDate.getHours());
      
      // Llamar a la API para crear la reserva
      const result = await reservationService.createReservation({
        tableId: selectedSlot.tableId,
        startTime,
        endTime,
        durationHours: actualDuration,
        numMembers,
        numGuests,
        allDay: allDayReservation,
        reason: allDayReservation ? reservationReason : undefined
      });
      
      // Actualizar la lista de reservas
      setReservations([...reservations, result.reservation]);
      
      // Mensaje personalizado según si requiere aprobación o no
      let message = '¡Reserva realizada!';      let details = `Has reservado ${tableName} para el ${format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
      
      if (allDayReservation && !result.reservation.approved) {
        message = 'Reserva enviada para aprobación';
        details = `Tu reserva para todo el día está pendiente de aprobación por un administrador`;
      } else if (allDayReservation) {
        details = `Has reservado ${tableName} para todo el día ${format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`;
      } else {
        details = `Has reservado ${tableName} para el ${format(startDate, "d 'de' MMMM 'de' yyyy", { locale: es })} de ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} a ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')} h`;
      }
      
      // Cerrar el modal y mostrar confirmación
      closeLoading();
      showSuccess(message, details);
      setShowModal(false);
      setSelectedSlot(null);
      
    } catch (error: unknown) {
      console.error('Error al crear reserva:', error);
      closeLoading();
      
      // Obtener mensaje de error específico de la API si está disponible
      let errorMessage = 'No se ha podido crear la reserva. Por favor, inténtalo de nuevo.';
        const apiError = error as ApiError;
      if (apiError?.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError?.message && typeof apiError.message === 'string') {
        errorMessage = apiError.message;
      } else if (typeof apiError === 'object' && apiError !== null && 'error' in apiError && apiError.error) {
        errorMessage = apiError.error;
      }
      
      // Mostrar mensaje de error detallado
      showError('Error en la reserva', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };  const handleCancelReservation = async (id: number) => {
    try {
      setLoading(true);
      showLoading('Cancelando reserva...');
      
      // Llamar a la API para cambiar el estado de la reserva a 'cancelled'
      await reservationService.updateReservationStatus(id, 'cancelled');
      
      // Actualizar lista de reservas cambiando el estado de la reserva cancelada
      setReservations(reservations.map(res => 
        res.id === id ? { ...res, status: 'cancelled' } : res
      ));
      
      closeLoading();
      showSuccess('Reserva cancelada', 'Tu reserva ha sido cancelada correctamente');
    } catch (error: unknown) {
      console.error('Error al cancelar reserva:', error);
      closeLoading();
      showError('Error', 'No se ha podido cancelar la reserva. Por favor, inténtalo de nuevo.');
      setError('Error al cancelar la reserva. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setIsEditMode(true);
    setReservationToEdit(reservation);
    setNumMembers(reservation.num_members);
    setNumGuests(reservation.num_guests);
    setAllDayReservation(reservation.all_day);
    setReservationReason(reservation.reason || '');
    
    // Establecer la mesa correspondiente a la reserva
    const reservationTable = tables.find(t => t.id === reservation.table_id) || null;
    setSelectedTable(reservationTable);
    
    // Establecer las fechas de inicio y fin en el slot seleccionado
    setSelectedSlot({
      tableId: reservation.table_id,
      start: new Date(reservation.start_time),
      end: new Date(reservation.end_time),
    });
    
    setShowModal(true);
  };

  const handleUpdateReservation = async () => {
    if (!reservationToEdit || !user) return;
    
    if (allDayReservation && !reservationReason) {
      showError('Error', 'Debes proporcionar una justificación para reservas de todo el día.');
      return;
    }
    
    try {      setLoading(true);
      showLoading('Actualizando reserva...');

      // Obtener los valores de configuración o usar valores predeterminados
      const config = window.reservationConfig || {
        max_hours_per_reservation: 4,
        max_reservations_per_user_per_day: 1,
        min_hours_in_advance: 0,
        allowed_start_time: "08:00",
        allowed_end_time: "22:00",
        requires_approval_for_all_day: true
      };
      
      // Usamos directamente las fechas de inicio y fin seleccionadas
      const startDate = new Date(selectedSlot!.start);
      let endDate: Date;
      
      if (allDayReservation) {
        // Si es todo el día, establecer el horario de 8:00 a 22:00
        startDate.setHours(8, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(22, 0, 0, 0);
      } else {      // Si no es todo el día, usar la fecha de fin seleccionada
        endDate = new Date(selectedSlot!.end);
      }
      
      // Verificar si la fecha ha cambiado respecto a la reserva original
      const originalStartDate = new Date(reservationToEdit.start_time);
      const originalDateOnly = new Date(originalStartDate);
      originalDateOnly.setHours(0, 0, 0, 0);
      
      const newDateOnly = new Date(startDate);
      newDateOnly.setHours(0, 0, 0, 0);
      
      // Si la fecha ha cambiado, verificar el límite diario de reservas
      if (newDateOnly.getTime() !== originalDateOnly.getTime() && config.max_reservations_per_user_per_day > 0) {
        // Filtrar las reservas, excluyendo la que estamos editando
        const otherReservations = reservations.filter(res => res.id !== reservationToEdit.id);
        
        const { hasReached, currentCount } = hasReachedDailyLimit(
          user.id, startDate, otherReservations, config.max_reservations_per_user_per_day
        );
        
        if (hasReached) {
          closeLoading();
          showError(
            'Límite diario alcanzado', 
            `Ya tienes ${currentCount} ${currentCount === 1 ? 'reserva' : 'reservas'} para este día. 
             El límite configurado es de ${config.max_reservations_per_user_per_day} 
             ${config.max_reservations_per_user_per_day === 1 ? 'reserva' : 'reservas'} diarias.`
          );
          setLoading(false);
          return;
        }
      }
      
      // Preservamos la hora local (visual) al convertir a ISO
      const startTime = preserveLocalTime(startDate);
      const endTime = preserveLocalTime(endDate);
      
      // Actualizar la reserva a través de la API
      await reservationService.updateReservation(reservationToEdit.id, {
        tableId: selectedSlot!.tableId,
        startTime,
        endTime,
        durationHours: allDayReservation ? 14 : (endDate.getHours() - startDate.getHours()),
        numMembers,
        numGuests,
        allDay: allDayReservation,
        reason: allDayReservation ? reservationReason : undefined
      });
      
      // Actualizar la lista de reservas
      setReservations(reservations.map(res => res.id === reservationToEdit.id ? {
        ...res,
        table_id: selectedSlot!.tableId,
        start_time: startTime,
        end_time: endTime,
        duration_hours: allDayReservation ? 14 : (endDate.getHours() - startDate.getHours()),
        num_members: numMembers,
        num_guests: numGuests,
        all_day: allDayReservation,
        reason: allDayReservation ? reservationReason : undefined
      } : res));
      
      closeLoading();
      showSuccess('Reserva actualizada', 'Tu reserva ha sido actualizada correctamente');
      setShowModal(false);
      setSelectedSlot(null);
      setReservationToEdit(null);
      setIsEditMode(false);
    } catch (error: unknown) {
      console.error('Error al actualizar reserva:', error);
      closeLoading();
      
      // Obtener mensaje de error específico de la API si está disponible
      let errorMessage = 'No se ha podido actualizar la reserva. Por favor, inténtalo de nuevo.';
        const apiError = error as ApiError;
      if (apiError?.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError?.message && typeof apiError.message === 'string') {
        errorMessage = apiError.message;
      } else if (typeof apiError === 'object' && apiError !== null && 'error' in apiError && apiError.error) {
        errorMessage = apiError.error;
      }
      
      // Mostrar mensaje de error detallado
      showError('Error en la reserva', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reserva de mesas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {viewMode === 'calendar' 
              ? 'Selecciona una mesa para ver su disponibilidad y realizar una reserva'
              : 'Gestiona tus reservas desde la vista de lista'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Menú de navegación entre vistas */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className="flex-1"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Ver en calendario
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
            className="flex-1"
          >
            <List className="w-5 h-5 mr-2" />
            Ver como lista
          </Button>
        </div>

        {/* Selector de mesa (solo visible en modo calendario) */}
        {viewMode === 'calendar' && (
          <div className="mb-6">
            <label htmlFor="tableSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecciona una mesa:
            </label>
            <select
              id="tableSelect"
              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              onChange={(e) => {
                const tableId = parseInt(e.target.value);
                const table = tables.find(t => t.id === tableId) || null;
                setSelectedTable(table);
              }}
              value={selectedTable?.id || ""}
            >
              <option value="">-- Selecciona una mesa --</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
        )}      {/* Información de la mesa seleccionada (solo en modo calendario) */}
        {viewMode === 'calendar' && selectedTable && (
          <div className="flex items-center mb-2 text-sm bg-white dark:bg-gray-800 rounded-md shadow-sm p-2 border-l-4 border-blue-500">
            <Users className="w-4 h-4 mr-2 text-blue-500" />
            <span className="font-medium mr-2">{selectedTable.name}</span>
            {selectedTable.description && (
              <span className="text-gray-500 dark:text-gray-400 overflow-hidden overflow-ellipsis whitespace-nowrap max-w-xl">
                - {selectedTable.description}
              </span>
            )}
          </div>
        )}

        {/* Vista de calendario o lista de reservas */}
        {viewMode === 'calendar' ? (
          selectedTable ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
              <Calendar7Days
                reservations={reservations.filter(res => res.table_id === selectedTable.id)}
                tables={[selectedTable]}
                onSelectSlot={handleSelectSlot}
                onCancelReservation={handleCancelReservation}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6 text-center mb-8">
              <p className="text-gray-600 dark:text-gray-400">Por favor, selecciona una mesa para ver el calendario de reservas.</p>
            </div>
          )
        ) : (        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
          <ReservationsList
            reservations={reservations}
            onEditReservation={handleEditReservation}
            onCancelReservation={handleCancelReservation}
            currentUser={user}
          />
        </div>
      )}

      {/* Modal de reserva */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditMode ? "Editar Reserva" : "Realizar Reserva"}
      >
        {selectedSlot && (
          <form onSubmit={(e) => { 
              e.preventDefault(); 
              if (isEditMode) {
                handleUpdateReservation();
              } else {
                handleMakeReservation();
              }
            }}>
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">
                {tables.find(t => t.id === selectedSlot.tableId)?.name || 'Mesa'}
              </h3>              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                <Calendar size={16} className="mr-1" />
                {format(selectedSlot.start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">                <Clock size={16} className="mr-1" />
                {allDayReservation 
                  ? `Todo el día (${window.reservationConfig?.allowed_start_time?.substring(0,5) || '08:00'} - ${window.reservationConfig?.allowed_end_time?.substring(0,5) || '22:00'} h)` 
                  : `${String(selectedSlot.start.getHours()).padStart(2, '0')}:${String(selectedSlot.start.getMinutes()).padStart(2, '0')} - ${String(selectedSlot.end.getHours()).padStart(2, '0')}:${String(selectedSlot.end.getMinutes()).padStart(2, '0')} h`
                }
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de socios
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    onClick={() => numMembers > 1 && setNumMembers(numMembers - 1)}
                  >
                    -
                  </button>
                  <span className="mx-2 text-gray-700 dark:text-gray-300 w-4 text-center">{numMembers}</span>
                  <button
                    type="button"
                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    onClick={() => setNumMembers(numMembers + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de invitados
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    onClick={() => numGuests > 0 && setNumGuests(numGuests - 1)}
                  >
                    -
                  </button>
                  <span className="mx-2 text-gray-700 dark:text-gray-300 w-4 text-center">{numGuests}</span>
                  <button
                    type="button"
                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    onClick={() => setNumGuests(numGuests + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="allDayReservation"
                  checked={allDayReservation}
                  onChange={(e) => setAllDayReservation(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />                <label htmlFor="allDayReservation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Reservar todo el día ({window.reservationConfig?.allowed_start_time?.substring(0,5) || '08:00'} - {window.reservationConfig?.allowed_end_time?.substring(0,5) || '22:00'})
                </label>
              </div>
              
              {allDayReservation && (
                <Input
                  id="reason"
                  label="Justificación (requerido para reservas de todo el día)"
                  type="text"
                  value={reservationReason}
                  onChange={(e) => setReservationReason(e.target.value)}
                  required={allDayReservation}
                  placeholder="Motivo de la reserva para todo el día"
                  className="mb-4"
                />
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-6 italic">
              Nota: Las reservas de todo el día requieren aprobación administrativa.
            </div>
              
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || (allDayReservation && !reservationReason)}
              >
                {isEditMode ? 'Actualizar Reserva' : 'Confirmar Reserva'}
              </Button>
            </div>
          </form>
        )}      </Modal>
      </motion.div>
    </UserLayout>
  );
};

export default ReservationsPage;
