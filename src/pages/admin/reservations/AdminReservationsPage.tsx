import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminTable } from '../../../components/admin/AdminTable';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Card } from '../../../components/ui/Card';
import { AdminForm } from '../../../components/admin/AdminForm';
import { Reservation, User, Table } from '../../../types';
import { adminReservationService, adminUserService, tableService } from '../../../services/api';
import { Pencil, Trash2, Plus as PlusIcon, Eye, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { showDangerConfirm, showSuccess, showError, showLoading, closeLoading } from '../../../utils/alerts';
import { preserveLocalTime, extractLocalTime } from '../../../utils/dateUtils';

export const AdminReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filterPendingApproval, setFilterPendingApproval] = useState(false);
  const [filterCancelled, setFilterCancelled] = useState(false);
  
  // Modal de detalles de reserva
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsReservation, setDetailsReservation] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Nuevos filtros
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTableId, setFilterTableId] = useState<string>('all');
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [formValues, setFormValues] = useState({
    userId: '',
    tableId: '',
    startDate: '',
    startTime: '',
    duration: '2',
    status: 'active'
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsData, usersData, tablesData] = await Promise.all([
        adminReservationService.getAllReservations(),
        adminUserService.getAllUsers(),
        tableService.getAllTables()
      ]);
      
      setReservations(reservationsData);
      setUsers(usersData);
      setTables(tablesData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (reservation: Reservation | null = null) => {
    if (reservation) {
      setIsEditMode(true);
      setSelectedReservation(reservation);
        // Parse dates from the reservation, preservando la hora local
      const startDate = extractLocalTime(reservation.start_time);
      const endDate = extractLocalTime(reservation.end_time);
      
      // Calcular duración en horas
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = Math.round(durationMs / 3600000);
      
      setFormValues({
        userId: String(reservation.user_id),
        tableId: String(reservation.table_id),
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        duration: String(durationHours),
        status: reservation.status
      });
    } else {
      setIsEditMode(false);
      setSelectedReservation(null);
      
      // Set default values for new reservation
      const now = new Date();
      setFormValues({
        userId: users.length > 0 ? String(users[0].id) : '',
        tableId: tables.length > 0 ? String(tables[0].id) : '',
        startDate: format(now, 'yyyy-MM-dd'),
        startTime: format(now, 'HH:mm'),
        duration: '2',
        status: 'active'
      });
    }
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (name: string, value: string | number | boolean | File | null) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      showLoading(isEditMode ? 'Actualizando reserva...' : 'Creando reserva...');
      
      // Create date objects from form values      // Crear la fecha local a partir de los valores del formulario
      const [year, month, day] = formValues.startDate.split('-').map(Number);
      const [hours, minutes] = formValues.startTime.split(':').map(Number);
      
      // Crear fecha inicial manteniendo la zona horaria
      const startDate = new Date(year, month - 1, day, hours, minutes);
      
      // Calcular fecha final 
      const endDate = new Date(startDate);
      const durationHours = parseInt(formValues.duration);
      
      // Si es una reserva de 14 horas (todo el día), aplicar lógica especial
      if (durationHours === 14) {
        // Para reservas de todo el día, usar la configuración del sistema
        // Obtener configuración de window o usar valores por defecto
        const config = window.reservationConfig || {
          allowed_start_time: "06:00",
          allowed_end_time: "23:00"
        };
        
        const [startHours, startMinutes] = config.allowed_start_time.split(':').map(Number);
        const [endHours] = config.allowed_end_time.split(':').map(Number);
        
        // Establecer hora de inicio según configuración
        startDate.setHours(startHours, startMinutes, 0, 0);
        
        // La hora de fin debe ser hasta el final de la última hora permitida
        let finalEndHour = endHours + 1;
        let nextDay = false;
        
        if (finalEndHour >= 24) {
          finalEndHour = 0;
          nextDay = true;
        }
        
        if (nextDay) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        endDate.setHours(finalEndHour, 0, 0, 0);
      } else {
        // Para reservas normales, sumar la duración normalmente
        endDate.setHours(endDate.getHours() + durationHours);
      }
      
      console.log(`Fecha local inicio: ${startDate.toLocaleDateString()} ${startDate.getHours()}:${startDate.getMinutes()}`);
      console.log(`Fecha local fin: ${endDate.toLocaleDateString()} ${endDate.getHours()}:${endDate.getMinutes()}`);
      
      // Preservamos la hora local al convertir a ISO
      const startTime = preserveLocalTime(startDate);
      const endTime = preserveLocalTime(endDate);
      
      // Prepare data for API
      const reservationData = {
        user_id: parseInt(formValues.userId),
        table_id: parseInt(formValues.tableId),
        start_time: startTime,
        end_time: endTime,
        status: formValues.status as 'active' | 'cancelled' | 'completed',
        duration_hours: durationHours,
        num_members: 1,
        num_guests: 0,
        all_day: durationHours === 14 // Marcar como todo el día si son 14 horas
      };
      
      // Encontrar los nombres del usuario y la mesa para el mensaje de confirmación
      const userName = users.find(u => u.id === parseInt(formValues.userId))?.name || 'Usuario';
      const tableName = tables.find(t => t.id === parseInt(formValues.tableId))?.name || 'Mesa';
      
      if (isEditMode && selectedReservation) {
        // Update existing reservation
        await adminReservationService.updateReservation(selectedReservation.id, reservationData);
        closeLoading();
        showSuccess(
          'Reserva actualizada', 
          `La reserva para ${userName} en ${tableName} ha sido actualizada correctamente`
        );
      } else {
        // Create new reservation
        await adminReservationService.createReservation(reservationData);
        closeLoading();
        showSuccess(
          'Reserva creada', 
          `La reserva para ${userName} en ${tableName} ha sido creada correctamente`
        );
      }
      
      // Reload the list
      fetchData();
      handleCloseModal();
    } catch (err) {
      closeLoading();
      showError('Error', (err as Error).message);
      setFormError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteReservation = async (reservationId: number) => {
    const isConfirmed = await showDangerConfirm(
      'Eliminar reserva', 
      '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.',
      'Eliminar',
      'Cancelar'
    );
    
    if (isConfirmed) {
      try {
        showLoading('Eliminando reserva...');
        await adminReservationService.deleteReservation(reservationId);
        closeLoading();
        showSuccess('Reserva eliminada', 'La reserva ha sido eliminada correctamente');
        fetchData(); // Reload list after deletion
      } catch (err) {
        closeLoading();
        showError('Error', 'Error al eliminar reserva: ' + (err as Error).message);
        setError('Error al eliminar reserva: ' + (err as Error).message);
      }
    }
  };

  const handleApproveReservation = async (reservationId: number) => {
    const isConfirmed = await showDangerConfirm(
      'Aprobar reserva', 
      '¿Estás seguro de que deseas aprobar esta reserva de todo el día?',
      'Aprobar',
      'Cancelar'
    );
    
    if (isConfirmed) {
      try {
        showLoading('Aprobando reserva...');
        await adminReservationService.approveReservation(reservationId);
        closeLoading();
        showSuccess('Reserva aprobada', 'La reserva de todo el día ha sido aprobada correctamente');
        handleCloseDetailsModal(); // Cerrar modal de detalles si está abierto
        fetchData(); // Reload list after approval
      } catch (err) {
        closeLoading();
        showError('Error', 'Error al aprobar reserva: ' + (err as Error).message);
        setError('Error al aprobar reserva: ' + (err as Error).message);
      }
    }
  };

  const handleOpenDetailsModal = (reservation: Reservation) => {
    setDetailsReservation(reservation);
    setIsDetailsModalOpen(true);
    setRejectionReason('');
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setDetailsReservation(null);
    setRejectionReason('');
  };

  const handleRejectReservation = async () => {
    if (!detailsReservation || !rejectionReason.trim()) {
      showError('Error', 'Debe proporcionar un motivo para la denegación');
      return;
    }

    try {
      showLoading('Denegando reserva...');
      await adminReservationService.rejectReservation(detailsReservation.id, rejectionReason.trim());
      closeLoading();
      showSuccess('Reserva denegada', 'La reserva ha sido denegada correctamente');
      handleCloseDetailsModal();
      fetchData(); // Reload list after rejection
    } catch (err) {
      closeLoading();
      showError('Error', 'Error al denegar reserva: ' + (err as Error).message);
    }
  };

  const formFields = [
    {      name: 'userId', 
      label: 'Usuario', 
      type: 'select' as const, 
      required: true,
      options: users.map(user => ({ value: String(user.id), label: `${user.name} (${user.username || ''})` }))
    },
    { 
      name: 'tableId', 
      label: 'Mesa', 
      type: 'select' as const, 
      required: true,
      options: tables.map(table => ({ value: String(table.id), label: table.name }))
    },
    { 
      name: 'startDate', 
      label: 'Fecha', 
      type: 'text' as const, // Using text as date inputs might need specific handling
      required: true,
      placeholder: 'YYYY-MM-DD' 
    },
    { 
      name: 'startTime', 
      label: 'Hora de inicio', 
      type: 'text' as const, 
      required: true,
      placeholder: 'HH:MM' 
    },    { 
      name: 'duration', 
      label: 'Duración (horas)', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: '1', label: '1 hora' },
        { value: '2', label: '2 horas' },
        { value: '3', label: '3 horas' },
        { value: '4', label: '4 horas' },
        { value: '5', label: '5 horas' },
        { value: '6', label: '6 horas' },
        { value: '8', label: '8 horas' },
        { value: '10', label: '10 horas' },
        { value: '12', label: '12 horas' },
        { value: '14', label: '14 horas (todo el día)' }
      ] 
    },
    { 
      name: 'status', 
      label: 'Estado', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'active', label: 'Activa' },
        { value: 'cancelled', label: 'Cancelada' },
        { value: 'completed', label: 'Completada' }
      ] 
    }
  ];  const columns = [
    { 
      header: 'ID', 
      accessor: 'id' as keyof Reservation,
      className: 'w-12 hidden md:table-cell' 
    },
    { 
      header: 'Usuario', 
      accessor: (reservation: Reservation) => reservation.user_name,
      className: 'w-1/4'
    },
    { 
      header: 'Mesa', 
      accessor: (reservation: Reservation) => reservation.table_name,
      className: 'w-1/6 hidden sm:table-cell'
    },    {
      header: 'Fecha',
      accessor: (reservation: Reservation) => 
        format(extractLocalTime(reservation.start_time), "EEE, d MMM", { locale: es }),
      className: 'w-1/6'
    },{      header: 'Horario',
      accessor: (reservation: Reservation) => 
        `${format(extractLocalTime(reservation.start_time), "HH:mm")} - ${format(extractLocalTime(reservation.end_time), "HH:mm")}`,
      className: 'w-1/6 whitespace-nowrap text-center'
    },{ 
      header: 'Estado', 
      accessor: (reservation: Reservation) => {
        let bgColor, textColor;
        switch (reservation.status) {
          case 'active':
            bgColor = 'bg-green-100 dark:bg-green-900/40';
            textColor = 'text-green-800 dark:text-green-200';
            break;
          case 'cancelled':
            bgColor = 'bg-red-100 dark:bg-red-900/40';
            textColor = 'text-red-800 dark:text-red-200';
            break;
          case 'completed':
            bgColor = 'bg-blue-100 dark:bg-blue-900/40';
            textColor = 'text-blue-800 dark:text-blue-200';
            break;
        }
        
        return (
          <span className={`inline-flex justify-center items-center px-2.5 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor} w-full max-w-[100px]`}>
            {reservation.status === 'active' && 'Activa'}
            {reservation.status === 'cancelled' && 'Cancelada'}
            {reservation.status === 'completed' && 'Completada'}
          </span>
        );
      },
      className: 'w-1/6 text-center'
    },
    {
      header: 'Tipo',
      accessor: (reservation: Reservation) => {
        if (reservation.all_day) {
          // Si la reserva está cancelada, no mostrar badge de tipo
          if (reservation.status === 'cancelled') {
            return null;
          }
          
          const isApproved = reservation.approved;
          const bgColor = isApproved 
            ? 'bg-purple-100 dark:bg-purple-900/40' 
            : 'bg-yellow-100 dark:bg-yellow-900/40';
          const textColor = isApproved 
            ? 'text-purple-800 dark:text-purple-200' 
            : 'text-yellow-800 dark:text-yellow-200';
          
          return (
            <span className={`inline-flex justify-center items-center px-2.5 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor} w-full max-w-[100px]`}>
              {isApproved ? 'Todo el día' : 'Pendiente'}
            </span>
          );
        }
        return null;
      },
      className: 'w-1/6 text-center'
    }
  ];  // Filtrar las reservas según los criterios seleccionados
  let filteredReservations = [...reservations];
  
  // Si el filtro de pendientes está activo, solo mostrar reservas pendientes de aprobación
  if (filterPendingApproval) {
    filteredReservations = filteredReservations.filter(r => r.all_day && r.status === 'active' && !r.approved);
  }
  
  // Si el filtro de canceladas está activo, solo mostrar reservas canceladas
  if (filterCancelled) {
    filteredReservations = filteredReservations.filter(r => r.status === 'cancelled');
  }
  
  // Filtrar por estado
  if (filterStatus !== 'all') {
    filteredReservations = filteredReservations.filter(r => r.status === filterStatus);
  }
  
  // Filtrar por mesa
  if (filterTableId !== 'all') {
    filteredReservations = filteredReservations.filter(r => r.table_id === parseInt(filterTableId));
  }
  
  // Filtrar por usuario
  if (filterUserId !== 'all') {
    filteredReservations = filteredReservations.filter(r => r.user_id === parseInt(filterUserId));
  }
  
  // Filtrar por fecha
  if (filterDate) {
    filteredReservations = filteredReservations.filter(r => {
      const reservationDate = new Date(r.start_time).toISOString().split('T')[0];
      return reservationDate === filterDate;
    });
  }
  
  const pendingCount = reservations.filter(r => r.all_day && r.status === 'active' && !r.approved).length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  const renderActions = (reservation: Reservation) => (
    <div className="flex justify-end items-center gap-1">
      {reservation.all_day && !reservation.approved && reservation.status === 'active' && (
        <Button 
          variant="ghost" 
          size="xs"
          onClick={() => handleOpenDetailsModal(reservation)}
          className="p-1"
          title="Ver detalles y gestionar reserva"
        >
          <Eye className="w-4 h-4 text-blue-500" />
        </Button>
      )}
      <Button 
        variant="ghost" 
        size="xs"
        onClick={() => handleOpenModal(reservation)}
        className="p-1"
        title="Editar reserva"
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="xs"
        onClick={() => handleDeleteReservation(reservation.id)}
        className="p-1"
        title="Eliminar reserva"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <AdminLayout title="Administrar Reservas">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona las reservas de las mesas
          </p>          <div className="mt-2 flex items-center space-x-4">
            {pendingCount > 0 && (
              <div className="flex items-center">
                <div className={`mr-2 ${filterPendingApproval ? 'bg-yellow-500' : 'bg-yellow-400'} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
                  {pendingCount}
                </div>
                <button 
                  onClick={() => {
                    setFilterPendingApproval(!filterPendingApproval);
                    if (!filterPendingApproval) setFilterCancelled(false);
                  }}
                  className={`text-sm ${filterPendingApproval ? 'text-yellow-600 font-medium' : 'text-gray-500'} hover:underline`}
                >
                  {filterPendingApproval ? 'Mostrando reservas pendientes' : 'Reservas pendientes de aprobación'}
                </button>
              </div>
            )}
            
            {cancelledCount > 0 && (
              <div className="flex items-center">
                <div className={`mr-2 ${filterCancelled ? 'bg-red-500' : 'bg-red-400'} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
                  {cancelledCount}
                </div>
                <button 
                  onClick={() => {
                    setFilterCancelled(!filterCancelled);
                    if (!filterCancelled) setFilterPendingApproval(false);
                  }}
                  className={`text-sm ${filterCancelled ? 'text-red-600 font-medium' : 'text-gray-500'} hover:underline`}
                >
                  {filterCancelled ? 'Mostrando reservas canceladas' : 'Reservas canceladas'}
                </button>
              </div>
            )}
          </div>
        </div>        <div className="flex items-center gap-2">
          {(filterPendingApproval || filterCancelled || filterStatus !== 'all' || filterTableId !== 'all' || 
            filterUserId !== 'all' || filterDate !== '') && (
            <Button 
              variant="outline"
              onClick={() => {
                setFilterPendingApproval(false);
                setFilterCancelled(false);
                setFilterStatus('all');
                setFilterTableId('all');
                setFilterUserId('all');
                setFilterDate('');
              }}
            >
              Mostrar todas
            </Button>
          )}
          <Button 
            onClick={() => handleOpenModal()}
            className="flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            Nueva Reserva
          </Button>
        </div>
      </div>      {/* Se ha eliminado la vista de calendario según los requisitos */}      <h2 className="text-xl font-semibold mb-2">Lista de Reservas</h2>
        {/* Panel de filtros */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)} 
          >
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'} 
          </Button>
          
          {/* Indicadores de filtros activos */}
          {filterStatus !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-xs">
              Estado: {filterStatus === 'active' ? 'Activas' : filterStatus === 'cancelled' ? 'Canceladas' : 'Completadas'}
            </span>
          )}
          
          {filterTableId !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-md text-xs">
              Mesa: {tables.find(t => t.id === parseInt(filterTableId))?.name || filterTableId}
            </span>
          )}
          
          {filterUserId !== 'all' && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 rounded-md text-xs">
              Usuario: {users.find(u => u.id === parseInt(filterUserId))?.name || filterUserId}
            </span>
          )}
          
          {filterDate && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-md text-xs">
              Fecha: {filterDate}
            </span>
          )}
        </div>
        
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>

              {/* Filtro por mesa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mesa
                </label>
                <select
                  value={filterTableId}
                  onChange={(e) => setFilterTableId(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="all">Todas las mesas</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>{table.name}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usuario
                </label>
                <select
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="all">Todos los usuarios</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha (yyyy-mm-dd)
                </label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setFilterStatus('all');
                  setFilterTableId('all');
                  setFilterUserId('all');
                  setFilterDate('');
                }}
                className="mr-2"
              >
                Limpiar filtros
              </Button>
            </div>
          </Card>
        )}
      </div>
      
      <AdminTable
        columns={columns}
        data={filteredReservations}
        actions={renderActions}
        keyExtractor={(reservation) => reservation.id}
        loading={loading}
        error={error}
        emptyMessage={filterPendingApproval ? "No hay reservas pendientes de aprobación" : "No hay reservas registradas"}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Editar Reserva" : "Crear Reserva"}
      >
        <AdminForm
          fields={formFields}
          values={formValues}
          onChange={handleInputChange}
          onSubmit={handleSubmitForm}
          submitText={isEditMode ? "Guardar Cambios" : "Crear Reserva"}
          loading={loading}
          error={formError}
        />
      </Modal>

      {/* Modal de detalles y rechazo de reservas */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title="Detalles de Reserva"
      >
        {detailsReservation && (
          <div>
            <div className="mb-4">
              <strong>ID de Reserva:</strong> {detailsReservation.id}
            </div>
            <div className="mb-4">
              <strong>Usuario:</strong> {detailsReservation.user_name}
            </div>
            <div className="mb-4">
              <strong>Mesa:</strong> {detailsReservation.table_name}
            </div>
            <div className="mb-4">
              <strong>Fecha y Hora:</strong> {format(extractLocalTime(detailsReservation.start_time), "EEE, d MMM yyyy HH:mm", { locale: es })}
            </div>
            <div className="mb-4">
              <strong>Duración:</strong> {detailsReservation.duration_hours} horas
            </div>
            <div className="mb-4">
              <strong>Estado:</strong> 
              <span className={`inline-flex justify-center items-center px-2.5 py-1 rounded-md text-xs font-medium 
                ${detailsReservation.status === 'active' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' : ''}
                ${detailsReservation.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200' : ''}
                ${detailsReservation.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200' : ''}
              `}>
                {detailsReservation.status === 'active' && 'Activa'}
                {detailsReservation.status === 'cancelled' && 'Cancelada'}
                {detailsReservation.status === 'completed' && 'Completada'}
              </span>
            </div>
            
            {detailsReservation.all_day && (
              <div className="mb-4">
                <strong>Tipo:</strong> 
                <span className={`inline-flex justify-center items-center px-2.5 py-1 rounded-md text-xs font-medium 
                  ${detailsReservation.approved ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200'}
                `}>
                  {detailsReservation.approved ? 'Todo el día' : 'Pendiente'}
                </span>
              </div>
            )}

            {detailsReservation.reason && (
              <div className="mb-4">
                <strong>Motivo de la reserva:</strong>
                <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                  {detailsReservation.reason}
                </div>
              </div>
            )}

            {detailsReservation.rejection_reason && (
              <div className="mb-4">
                <strong>Motivo de denegación:</strong>
                <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  {detailsReservation.rejection_reason}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Motivo de denegación */}
        {detailsReservation && !detailsReservation.approved && detailsReservation.status === 'active' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo de denegación
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
              rows={3}
              placeholder="Ingrese el motivo de la denegación"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          {detailsReservation && !detailsReservation.approved && detailsReservation.status === 'active' && (
            <>
              <Button 
                onClick={() => handleApproveReservation(detailsReservation.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                Aprobar Reserva
              </Button>
              <Button 
                onClick={handleRejectReservation}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4 mr-1" />
                Denegar Reserva
              </Button>
            </>
          )}
          <Button 
            onClick={handleCloseDetailsModal}
            variant="outline"
          >
            Cerrar
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
};


