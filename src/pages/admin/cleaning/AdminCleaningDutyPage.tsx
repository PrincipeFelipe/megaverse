import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { cleaningDutyService, CleaningConfig, CleaningAssignment, CleaningExemption } from '../../../services/cleaningDutyService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { useNotifications } from '../../../hooks/useNotifications';
import { UserSelector } from '../../../components/admin/UserSelector';
import { Pencil } from '../../../utils/icons';

interface User {
  id: number;
  name: string;
}

const AdminCleaningDutyPage: React.FC = () => {
  const [config, setConfig] = useState<CleaningConfig | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<CleaningAssignment[]>([]);
  const [history, setHistory] = useState<CleaningAssignment[]>([]);
  const [exemptions, setExemptions] = useState<CleaningExemption[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usersPerWeek, setUsersPerWeek] = useState<number>(2);
  const [showUserSelector, setShowUserSelector] = useState<boolean>(false);
  const [showAddExemptionModal, setShowAddExemptionModal] = useState<boolean>(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [newExemption, setNewExemption] = useState({
    userId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    reason: '',
    isPermanent: false
  });
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchData();
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener todos los datos necesarios en paralelo
      const [configData, currentData, historyData, exemptionsData] = await Promise.all([
        cleaningDutyService.getConfig(),
        cleaningDutyService.getCurrentAssignments(),
        cleaningDutyService.getHistory(),
        cleaningDutyService.getExemptions(),
        fetchUsers()
      ]);
      
      setConfig(configData);
      setUsersPerWeek(configData.users_per_week);
      setCurrentAssignments(currentData);
      setHistory(historyData);
      setExemptions(exemptionsData);
    } catch (error) {
      console.error('Error al cargar datos del sistema de limpieza:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar datos del sistema de limpieza'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      // Importar dinámicamente fetchWithAuth para evitar problemas de importación circular
      const { fetchWithAuth } = await import('../../../services/api');
      
      // Obtener usuarios desde la API usando fetchWithAuth para incluir el token de autenticación
      const response = await fetchWithAuth('/users/list-for-selection');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Ordenar usuarios por nombre
        const sortedUsers = data.sort((a: User, b: User) => a.name.localeCompare(b.name));
        setUsers(sortedUsers);
        return sortedUsers;
      }
      
      return [];
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      return [];
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await cleaningDutyService.updateConfig({ usersPerWeek });
      addNotification({
        type: 'info',
        title: 'Éxito',
        message: 'Configuración actualizada correctamente'
      });
      fetchData();
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al actualizar configuración'
      });
    }
  };

  const handleAssignCleaningDuty = async () => {
    try {
      await cleaningDutyService.assignCleaningDuty();
      addNotification({
        type: 'info',
        title: 'Éxito',
        message: 'Asignaciones de limpieza generadas correctamente'
      });
      fetchData();
    } catch (error: unknown) {
      console.error('Error al generar asignaciones de limpieza:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al generar asignaciones de limpieza';
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };

  const handleUpdateStatus = async (assignmentId: number, status: 'pending' | 'completed' | 'missed') => {
    try {
      await cleaningDutyService.updateStatus(assignmentId, { status });
      addNotification({
        type: 'info',
        title: 'Éxito',
        message: 'Estado actualizado correctamente'
      });
      fetchData();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al actualizar estado'
      });
    }
  };

  const handleEditAssignment = (assignmentId: number) => {
    setEditingAssignmentId(assignmentId);
    setShowUserSelector(true);
  };

  const handleUserSelected = async (newUserId: number) => {
    if (editingAssignmentId === null) return;

    try {
      await cleaningDutyService.updateAssignedUser(editingAssignmentId, newUserId);
      addNotification({
        type: 'info',
        title: 'Éxito',
        message: 'Usuario asignado actualizado correctamente'
      });
      setShowUserSelector(false);
      fetchData();
    } catch (err) {
      console.error('Error al actualizar usuario asignado:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al actualizar usuario asignado'
      });
    }
  };

  const handleDeleteExemption = async (exemptionId: number) => {
    // Importar dinámicamente showDangerConfirm para evitar problemas de importación circular
    const { showDangerConfirm } = await import('../../../utils/alerts');
    
    // Encontrar la exención para mostrar detalles en el mensaje de confirmación
    const exemptionToDelete = exemptions.find(e => e.id === exemptionId);
    
    if (!exemptionToDelete) return;
    
    const title = exemptionToDelete.is_permanent 
      ? 'Eliminar exención permanente'
      : 'Eliminar exención temporal';
      
    const message = exemptionToDelete.is_permanent 
      ? `¿Estás seguro de eliminar la exención permanente para ${exemptionToDelete.name}? El usuario volverá a ser elegible para turnos de limpieza.`
      : `¿Estás seguro de eliminar la exención temporal para ${exemptionToDelete.name}?`;
      
    const confirmed = await showDangerConfirm(title, message, 'Eliminar', 'Cancelar');
    
    if (confirmed) {
      try {
        await cleaningDutyService.deleteExemption(exemptionId);
        addNotification({
          type: 'info',
          title: 'Éxito',
          message: `Exención para ${exemptionToDelete.name} eliminada correctamente`
        });
        fetchData();
      } catch (err) {
        console.error('Error al eliminar exención:', err);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Error al eliminar exención'
        });
      }
    }
  };

  const handleAddExemption = async () => {
    try {
      if (!newExemption.userId) {
        addNotification({
          type: 'warning',
          title: 'Advertencia',
          message: 'Por favor selecciona un usuario'
        });
        return;
      }

      if (!newExemption.reason) {
        addNotification({
          type: 'warning',
          title: 'Advertencia',
          message: 'Por favor ingresa un motivo para la exención'
        });
        return;
      }

      const exemptionData = {
        userId: Number(newExemption.userId),
        startDate: newExemption.startDate,
        endDate: newExemption.isPermanent ? undefined : newExemption.endDate || undefined,
        reason: newExemption.reason,
        isPermanent: newExemption.isPermanent
      };

      await cleaningDutyService.addExemption(exemptionData);
      
      // Encontrar el nombre del usuario para el mensaje
      const userName = users.find(u => Number(u.id) === Number(newExemption.userId))?.name || 'Usuario';
      const exType = newExemption.isPermanent ? 'permanente' : 'temporal';
      
      addNotification({
        type: 'info',
        title: 'Éxito',
        message: `Exención ${exType} añadida correctamente para ${userName}`
      });
      
      setShowAddExemptionModal(false);
      setNewExemption({
        userId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        reason: '',
        isPermanent: false
      });
      
      fetchData();
    } catch (err) {
      console.error('Error al añadir exención:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al añadir exención'
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      // Ignoramos el error y devolvemos la fecha sin formatear
      return dateString;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'missed':
        return 'No realizada';
      default:
        return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Sistema de Limpieza">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sistema de Limpieza">
      <div className="mb-6">
        <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                En esta sección puedes gestionar los turnos de limpieza, establecer la configuración y revisar el historial de asignaciones.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {showUserSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-lg w-full mx-4 md:mx-0 animate-scale-in">
            <UserSelector 
              onUserSelected={handleUserSelected}
              onCancel={() => setShowUserSelector(false)}
              title="Cambiar usuario asignado"
              currentUserId={
                currentAssignments.find(a => a.id === editingAssignmentId)?.user_id
              }
            />
          </div>
        </div>
      )}

      {showAddExemptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-lg w-full mx-4 md:mx-0 animate-scale-in p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400">Añadir exención de limpieza</h2>
              <button 
                onClick={() => setShowAddExemptionModal(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Usuario</label>
              <Select
                value={newExemption.userId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewExemption({...newExemption, userId: e.target.value})}
                required
              >
                <option value="">Selecciona un usuario</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                {users.length} usuarios disponibles para exención
                {newExemption.isPermanent && (
                  <div className="text-amber-600 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Las exenciones permanentes excluyen al usuario de todas las asignaciones futuras
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de exención</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-primary-600"
                    checked={!newExemption.isPermanent}
                    onChange={() => setNewExemption({...newExemption, isPermanent: false})}
                  />
                  <span className="ml-2">Temporal</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-primary-600"
                    checked={newExemption.isPermanent}
                    onChange={() => setNewExemption({...newExemption, isPermanent: true})}
                  />
                  <span className="ml-2">Permanente</span>
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Fecha de inicio</label>
              <input
                type="date"
                className="block w-full border border-gray-300 rounded p-2 dark:bg-dark-800 dark:border-dark-600 dark:text-white"
                value={newExemption.startDate}
                onChange={(e) => setNewExemption({...newExemption, startDate: e.target.value})}
              />
            </div>
            
            {!newExemption.isPermanent && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Fecha de fin (opcional)</label>
                <input
                  type="date"
                  className="block w-full border border-gray-300 rounded p-2 dark:bg-dark-800 dark:border-dark-600 dark:text-white"
                  value={newExemption.endDate}
                  onChange={(e) => setNewExemption({...newExemption, endDate: e.target.value})}
                />
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Motivo</label>
              <textarea
                className="block w-full border border-gray-300 rounded p-2 dark:bg-dark-800 dark:border-dark-600 dark:text-white"
                rows={3}
                value={newExemption.reason}
                onChange={(e) => setNewExemption({...newExemption, reason: e.target.value})}
                placeholder="Explica el motivo de la exención..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                onClick={() => setShowAddExemptionModal(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button onClick={handleAddExemption} color="primary">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400">Configuración</h2>
            <div className="text-sm bg-gray-100 dark:bg-dark-700 px-3 py-1 rounded-full">
              <span className="font-medium">{usersPerWeek}</span> personas/semana
            </div>
          </div>
          
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4"></div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Personas por semana</label>
            <div className="flex items-center">
              <input
                type="number"
                className="block border border-gray-300 dark:border-gray-600 rounded p-2 w-24 mr-3 text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:text-white"
                min="1"
                max="10"
                value={usersPerWeek}
                onChange={(e) => setUsersPerWeek(Number(e.target.value))}
              />
              <Button onClick={handleUpdateConfig} size="sm" color="secondary">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar
                </span>
              </Button>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Última asignación</h3>
            <div className="bg-gray-100 dark:bg-dark-700 rounded-md p-3 inline-block">
              <p className="text-sm font-semibold">{config ? formatDate(config.last_assignment_date) : 'Nunca'}</p>
            </div>
          </div>
          
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Al generar asignaciones, el sistema excluye automáticamente a los usuarios con exenciones activas (temporales o permanentes).
                </p>
              </div>
            </div>
          </div>
          <Button 
            color="primary" 
            onClick={handleAssignCleaningDuty}
            className="w-full justify-center py-3"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Asignar turnos para la próxima semana
            </span>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400">Asignaciones actuales</h2>
            <div className="text-sm bg-gray-100 dark:bg-dark-700 px-3 py-1 rounded-full">
              <span className="font-medium">{currentAssignments.length}</span> turnos activos
            </div>
          </div>
          
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4"></div>
          
          {currentAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-dark-900 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 dark:bg-dark-700">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Usuario</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Semana</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="font-medium">{assignment.name}</span>
                          <button 
                            onClick={() => handleEditAssignment(assignment.id)}
                            className="ml-2 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors duration-150"
                            title="Cambiar usuario asignado"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span>{formatDate(assignment.week_start_date)}</span>
                          <span className="text-xs text-gray-500">hasta {formatDate(assignment.week_end_date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(assignment.id, 'completed')}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-md transition-colors duration-150 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Completada
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(assignment.id, 'missed')}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-md transition-colors duration-150 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            No realizada
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-dark-800 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">No hay asignaciones actuales</p>
              <p className="text-gray-400 text-sm mt-1">Utiliza el botón "Asignar turnos" para crear nuevas asignaciones</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400">Historial de Limpieza</h2>
            <div className="text-sm bg-gray-100 dark:bg-dark-700 px-3 py-1 rounded-full">
              <span className="font-medium">{history.length}</span> turnos en total
            </div>
          </div>
          
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4"></div>
          
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-dark-900 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 dark:bg-dark-700">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Usuario</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Semana</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors duration-150">
                      <td className="px-4 py-3 font-medium">{assignment.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span>{formatDate(assignment.week_start_date)}</span>
                          <span className="text-xs text-gray-500">hasta {formatDate(assignment.week_end_date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {assignment.feedback ? (
                          <div className="max-w-xs overflow-hidden text-ellipsis">{assignment.feedback}</div>
                        ) : (
                          <span className="text-gray-400 italic">Sin comentarios</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length > 20 && (
                <div className="mt-5 text-center bg-gray-50 dark:bg-dark-800 py-2 rounded-md">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mostrando las 20 entradas más recientes de {history.length} en total
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 dark:bg-dark-800 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-gray-500">No hay historial de limpieza</p>
              <p className="text-gray-400 text-sm mt-1">El historial aparecerá una vez haya turnos completados</p>
            </div>
          )}
        </Card>

        <Card className="p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400">Exenciones de Limpieza</h2>
            <div className="flex space-x-2">
              <div className="text-sm bg-gray-100 dark:bg-dark-700 px-3 py-1 rounded-full">
                <span className="font-medium">{exemptions.length}</span> exenciones activas
              </div>
              <div className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full">
                <span className="font-medium">{users.length}</span> usuarios disponibles
              </div>
              <Button 
                size="sm" 
                color="primary"
                onClick={() => setShowAddExemptionModal(true)}
              >
                <span className="flex items-center text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Añadir exención
                </span>
              </Button>
            </div>
          </div>
          
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4"></div>
          
          {exemptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-dark-900 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 dark:bg-dark-700">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Usuario</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Desde</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Hasta</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Motivo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {exemptions.map((exemption) => (
                    <tr key={exemption.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors duration-150">
                      <td className="px-4 py-3 font-medium">{exemption.name}</td>
                      <td className="px-4 py-3">{formatDate(exemption.start_date)}</td>
                      <td className="px-4 py-3">
                        {exemption.end_date ? 
                          formatDate(exemption.end_date) : 
                          <span className="text-gray-500 italic">Indefinido</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs overflow-hidden text-ellipsis">{exemption.reason}</div>
                      </td>
                      <td className="px-4 py-3">
                        {exemption.is_permanent ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Permanente
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Temporal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteExemption(exemption.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-md transition-colors duration-150 flex items-center"
                          title="Eliminar exención"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 dark:bg-dark-800 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-gray-500">No hay exenciones de limpieza</p>
              <p className="text-gray-400 text-sm mt-1">Utiliza el botón "Añadir exención" para crear exenciones</p>
              <Button 
                size="sm" 
                color="primary"
                onClick={() => setShowAddExemptionModal(true)}
                className="mt-4"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Añadir exención
                </span>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCleaningDutyPage;
