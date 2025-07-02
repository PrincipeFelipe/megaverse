import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { cleaningDutyService, CleaningConfig, CleaningAssignment, CleaningExemption } from '../../../services/cleaningDutyService';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Table } from '../../../components/ui/Table';
import { useNotification } from '../../../contexts/NotificationContext';

const AdminCleaningDutyPage: React.FC = () => {
  const [config, setConfig] = useState<CleaningConfig | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<CleaningAssignment[]>([]);
  const [history, setHistory] = useState<CleaningAssignment[]>([]);
  const [exemptions, setExemptions] = useState<CleaningExemption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usersPerWeek, setUsersPerWeek] = useState<number>(2);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configData, currentData, historyData, exemptionsData] = await Promise.all([
        cleaningDutyService.getConfig(),
        cleaningDutyService.getCurrentAssignments(),
        cleaningDutyService.getHistory(),
        cleaningDutyService.getExemptions()
      ]);
      
      setConfig(configData);
      setUsersPerWeek(configData.users_per_week);
      setCurrentAssignments(currentData);
      setHistory(historyData);
      setExemptions(exemptionsData);
    } catch (error) {
      console.error('Error al cargar datos del sistema de limpieza:', error);
      showNotification('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await cleaningDutyService.updateConfig({ usersPerWeek });
      showNotification('Configuración actualizada correctamente', 'success');
      fetchData();
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      showNotification('Error al actualizar configuración', 'error');
    }
  };

  const handleAssignCleaningDuty = async () => {
    try {
      const result = await cleaningDutyService.assignCleaningDuty();
      showNotification('Asignaciones de limpieza generadas correctamente', 'success');
      fetchData();
    } catch (error: any) {
      console.error('Error al generar asignaciones de limpieza:', error);
      showNotification(
        error.response?.data?.message || 'Error al generar asignaciones de limpieza', 
        'error'
      );
    }
  };

  const handleUpdateStatus = async (assignmentId: number, status: 'pending' | 'completed' | 'missed') => {
    try {
      await cleaningDutyService.updateStatus(assignmentId, { status });
      showNotification('Estado actualizado correctamente', 'success');
      fetchData();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      showNotification('Error al actualizar estado', 'error');
    }
  };

  const handleDeleteExemption = async (exemptionId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta exención?')) {
      try {
        await cleaningDutyService.deleteExemption(exemptionId);
        showNotification('Exención eliminada correctamente', 'success');
        fetchData();
      } catch (error) {
        console.error('Error al eliminar exención:', error);
        showNotification('Error al eliminar exención', 'error');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy', { locale: es });
    } catch (error) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Configuración</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Personas por semana</label>
            <div className="flex items-center">
              <input
                type="number"
                className="input border rounded p-2 w-24 mr-2"
                min="1"
                max="10"
                value={usersPerWeek}
                onChange={(e) => setUsersPerWeek(Number(e.target.value))}
              />
              <Button onClick={handleUpdateConfig} size="sm">Guardar</Button>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm mb-1">Última asignación: {config ? formatDate(config.last_assignment_date) : 'Nunca'}</p>
          </div>
          <Button 
            color="primary" 
            onClick={handleAssignCleaningDuty}
          >
            Asignar turnos de limpieza para la próxima semana
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Asignaciones actuales</h2>
          {currentAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Usuario</th>
                    <th className="py-2 text-left">Semana</th>
                    <th className="py-2 text-left">Estado</th>
                    <th className="py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-800">
                      <td className="py-3">{assignment.name}</td>
                      <td className="py-3">
                        {formatDate(assignment.week_start_date)} - {formatDate(assignment.week_end_date)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </td>
                      <td className="py-3 flex space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(assignment.id, 'completed')}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
                        >
                          Completada
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(assignment.id, 'missed')}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                        >
                          No realizada
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No hay asignaciones actuales</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de Limpieza</h2>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Usuario</th>
                    <th className="py-2 text-left">Semana</th>
                    <th className="py-2 text-left">Estado</th>
                    <th className="py-2 text-left">Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-800">
                      <td className="py-3">{assignment.name}</td>
                      <td className="py-3">
                        {formatDate(assignment.week_start_date)} - {formatDate(assignment.week_end_date)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </td>
                      <td className="py-3">{assignment.feedback || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length > 20 && (
                <div className="mt-4 text-center">
                  <p className="text-gray-500">Mostrando las 20 entradas más recientes</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No hay historial de limpieza</p>
          )}
        </Card>

        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Exenciones de Limpieza</h2>
          {exemptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Usuario</th>
                    <th className="py-2 text-left">Desde</th>
                    <th className="py-2 text-left">Hasta</th>
                    <th className="py-2 text-left">Motivo</th>
                    <th className="py-2 text-left">Tipo</th>
                    <th className="py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {exemptions.map((exemption) => (
                    <tr key={exemption.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-800">
                      <td className="py-3">{exemption.name}</td>
                      <td className="py-3">{formatDate(exemption.start_date)}</td>
                      <td className="py-3">{exemption.end_date ? formatDate(exemption.end_date) : 'Indefinido'}</td>
                      <td className="py-3">{exemption.reason}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${exemption.is_permanent ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {exemption.is_permanent ? 'Permanente' : 'Temporal'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleDeleteExemption(exemption.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No hay exenciones de limpieza</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCleaningDutyPage;
