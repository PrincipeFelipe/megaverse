import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService } from '../../services/api';
import CancelledReservationsList from '../../components/admin/CancelledReservationsList';
import { Reservation } from '../../types';
import { Card } from '../../components/ui/Card';
import { showLoading, closeLoading, showSuccess, showError, showConfirm } from '../../utils/alerts';

const AdminCancelledReservationsPage: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar todas las reservas al iniciar la página
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reservationService.getAllReservations();
        setReservations(data);
      } catch (err) {
        console.error('Error al cargar reservas:', err);
        setError('No se pudieron cargar las reservas. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Manejar la eliminación permanente de una reserva (cancelada)
  const handleDeleteReservation = async (id: number) => {
    const isConfirmed = await showConfirm(
      'Eliminar reserva',
      '¿Estás seguro de que deseas eliminar permanentemente esta reserva cancelada? Esta acción no se puede deshacer.',
      'Eliminar',
      'Cancelar'
    );

    if (!isConfirmed) return;

    try {
      showLoading('Eliminando reserva...');
      await reservationService.deleteReservation(id);
      
      // Actualizar la lista local de reservas
      setReservations(reservations.filter(r => r.id !== id));
      
      closeLoading();
      showSuccess('Reserva eliminada', 'La reserva ha sido eliminada permanentemente');
    } catch (err) {
      console.error('Error al eliminar reserva:', err);
      closeLoading();
      showError('Error', 'No se pudo eliminar la reserva. Por favor, inténtalo de nuevo.');
    }
  };

  // Verificar si el usuario es administrador
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card className="p-6">
          <h1 className="text-xl font-bold mb-4">Acceso denegado</h1>
          <p>No tienes permisos para ver esta página. Esta sección está reservada para administradores.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración - Reservas Canceladas</h1>
      
      {loading ? (
        <Card className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">Cargando reservas...</p>
        </Card>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      ) : (
        <CancelledReservationsList 
          reservations={reservations}
          onDeleteReservation={handleDeleteReservation}
        />
      )}
    </div>
  );
};

export default AdminCancelledReservationsPage;
