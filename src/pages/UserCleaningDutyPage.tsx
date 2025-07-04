import React, { useState, useEffect, useCallback } from 'react';
import { cleaningDutyService, CleaningAssignment } from '../services/cleaningDutyService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { UserLayout } from '../components/layout/UserLayout';

const UserCleaningDutyPage: React.FC = () => {
  const [assignments, setAssignments] = useState<CleaningAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const fetchUserCleaningHistory = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const history = await cleaningDutyService.getUserHistory(user.id);
      setAssignments(history);
    } catch (err) {
      console.error('Error al cargar historial de limpieza:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar tu historial de limpieza'
      });
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    if (user) {
      fetchUserCleaningHistory();
    }
  }, [user, fetchUserCleaningHistory]);

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

  // Encontrar la asignación actual (si existe)
  const currentAssignment = Array.isArray(assignments) 
    ? assignments.find(
        assignment => 
          (assignment?.status === 'pending' || assignment?.status === 'completed') && 
          new Date(assignment?.week_end_date) >= new Date()
      )
    : undefined;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mis turnos de limpieza</h1>

        {currentAssignment && (
          <Card className={`mb-8 p-6 border-l-4 ${
            currentAssignment.status === 'completed' 
              ? 'border-green-500' 
              : 'border-yellow-500'
          }`}>
            <h2 className="text-lg font-semibold mb-3">
              Turno de limpieza {currentAssignment.status === 'completed' ? 'completado' : 'actual'}
            </h2>
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Período:</div>
              <div className="font-medium">
                {formatDate(currentAssignment.week_start_date)} - {formatDate(currentAssignment.week_end_date)}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estado:</div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusClass(currentAssignment.status)}`}>
                {getStatusText(currentAssignment.status)}
              </span>
            </div>
            <div>
              <p className="text-sm mb-4">
                {currentAssignment.status === 'completed' ? (
                  <>
                    Has completado tu turno de limpieza para la semana que finaliza el {formatDate(currentAssignment.week_end_date)}.
                    ¡Gracias por contribuir al mantenimiento de nuestras instalaciones!
                  </>
                ) : (
                  <>
                    Durante esta semana te corresponde realizar la limpieza de las instalaciones de la sociedad. 
                    Por favor, asegúrate de completar esta tarea antes del {formatDate(currentAssignment.week_end_date)}.
                  </>
                )}
              </p>
              <div className="p-3 bg-gray-100 dark:bg-dark-800 rounded-lg text-sm">
                <h3 className="font-semibold mb-2">Tareas a realizar:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Barrer y fregar el suelo de las zonas comunes</li>
                  <li>Limpiar los baños y asegurarse de que hay papel higiénico</li>
                  <li>Vaciar las papeleras y sacar la basura</li>
                  <li>Limpiar las mesas y superficies</li>
                  <li>Comprobar que todo queda ordenado</li>
                </ul>
              </div>
              
              {currentAssignment.status === 'pending' && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={async () => {
                      try {
                        await cleaningDutyService.updateStatus(currentAssignment.id, { status: 'completed' });
                        addNotification({
                          type: 'info',
                          title: 'Éxito',
                          message: 'Has marcado tu turno de limpieza como completado'
                        });
                        // Refrescar datos
                        fetchUserCleaningHistory();
                      } catch (error) {
                        console.error('Error al actualizar el estado del turno de limpieza:', error);
                        addNotification({
                          type: 'error',
                          title: 'Error',
                          message: 'No se pudo actualizar el estado del turno'
                        });
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm"
                  >
                    Marcar como completado
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de turnos</h2>
          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Período</th>
                    <th className="py-2 text-left">Estado</th>
                    <th className="py-2 text-left">Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50 dark:hover:bg-dark-800">
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
            </div>
          ) : (
            <p className="text-gray-500">Aún no has tenido ningún turno de limpieza asignado.</p>
          )}
        </Card>

        <Card className="p-6 mt-8">
          <h2 className="text-lg font-semibold mb-3">Información sobre el sistema de limpieza</h2>
          <p className="mb-4">
            Todos los miembros de la sociedad participan en el mantenimiento de nuestras instalaciones. 
            Cada semana, se asignan a diferentes personas la responsabilidad de mantener limpias las áreas comunes.
          </p>
          <div className="text-sm mb-4">
            <h3 className="font-semibold mb-2">¿Cómo funciona?</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Semanalmente se asignan dos personas para realizar la limpieza</li>
              <li>Un usuario no volverá a ser asignado hasta que todos los demás lo hayan sido</li>
              <li>Las tareas deben completarse antes del fin de la semana asignada</li>
            </ul>
          </div>
          <div className="text-sm">
            <h3 className="font-semibold mb-2">¿No puedes realizar tu turno?</h3>
            <p>
              Si por algún motivo no puedes realizar tu turno de limpieza, por favor contacta con la administración
              lo antes posible para poder encontrar una solución alternativa.
            </p>
          </div>
        </Card>
      </div>
    </UserLayout>
  );
};

export default UserCleaningDutyPage;
