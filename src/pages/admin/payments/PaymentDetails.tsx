import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { paymentsService } from '../../../services/api';
import { Payment } from '../../../types';
import { showError, showConfirm, showLoading, closeLoading, showSuccess } from '../../../utils/alerts';
import { EditIcon, DeleteIcon } from '../../../utils/icons';

// Función para formatear montos monetarios
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Función para formatear fechas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES').format(date);
};

// Función para obtener el nombre del mes
const getMonthName = (month: number): string => {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2000, month - 1, 1));
};

const PaymentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  
  // Cargar detalles del pago
  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        setLoading(true);
        
        const result = await paymentsService.getPaymentById(Number(id));
        setPayment(result.payment);
      } catch (error: any) {
        showError('Error', error.message || 'Error al cargar los detalles del pago');
        navigate('/admin/payments');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadPaymentDetails();
    }
  }, [id, navigate]);
  
  // Eliminar pago
  const handleDelete = async () => {
    if (!payment) return;
    
    const confirmed = await showConfirm(
      'Eliminar pago', 
      '¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
      try {
        showLoading('Eliminando pago...');
        
        await paymentsService.deletePayment(payment.id);
        
        closeLoading();
        showSuccess('Éxito', 'El pago ha sido eliminado correctamente');
        
        // Redirigir a la lista de pagos
        navigate('/admin/payments');
      } catch (error: any) {
        closeLoading();
        showError('Error', error.message || 'Error al eliminar el pago');
      }
    }
  };
  
  // Si está cargando, mostrar un indicador de carga
  if (loading) {
    return (
      <AdminLayout title="Detalles del Pago">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  // Si no se encontró el pago
  if (!payment) {
    return (
      <AdminLayout title="Detalles del Pago">
        <Card>
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">Pago no encontrado</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                El pago solicitado no existe o ha sido eliminado.
              </p>
            </div>
            <div className="mt-5">
              <Button onClick={() => navigate('/admin/payments')}>
                Volver a la lista de pagos
              </Button>
            </div>
          </div>
        </Card>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Gestión de Pagos">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <div className="p-6">
            {/* Header con título y acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Pago #{payment.id}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Detalles completos del pago
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => navigate(`/admin/payments/${payment.id}/edit`)}
                >
                  <EditIcon className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  onClick={handleDelete}
                >
                  <DeleteIcon className="w-4 h-4" />
                  Eliminar
                </Button>
              </div>
            </div>
            
            {/* Información principal */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  Información del pago
                </h3>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                  <dl>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-semibold">#{payment.id}</dd>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuario</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-medium">{payment.user_name}</dd>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Importe</dt>
                      <dd className="text-lg font-bold text-gray-900 dark:text-white col-span-2">
                        {formatCurrency(payment.amount)}
                      </dd>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de cuota</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          payment.payment_type === 'normal' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                            : payment.payment_type === 'maintenance'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : payment.payment_type === 'entrance'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {payment.payment_type === 'normal' ? 'Normal' : 
                           payment.payment_type === 'maintenance' ? 'Mantenimiento' :
                           payment.payment_type === 'entrance' ? 'Entrada' :
                           payment.payment_type}
                        </span>
                      </dd>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Período</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-medium">
                        {payment.month && payment.year ? 
                          `${getMonthName(payment.month)} ${payment.year}` : 
                          <span className="italic text-gray-600 dark:text-gray-400">No aplica (cuota de entrada)</span>}
                      </dd>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de pago</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-medium">{formatDate(payment.payment_date)}</dd>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Método de pago</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-medium capitalize">{payment.payment_method}</dd>
                    </div>
                    {payment.reference && (
                      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Referencia</dt>
                        <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">{payment.reference}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              {payment.notes && (
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-3">
                    Notas
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line leading-relaxed">{payment.notes}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-3">
                  Información del registro
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                  <dl>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Registrado por</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-medium">{payment.created_by_name || 'Sistema'}</dd>
                    </div>
                    <div className="px-6 py-4 grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-700">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de registro</dt>
                      <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-medium">{formatDate(payment.created_at)}</dd>
                    </div>
                    {payment.created_at !== payment.updated_at && (
                      <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Última actualización</dt>
                        <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-medium">{formatDate(payment.updated_at)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Tip:</span> Puedes editar este pago usando el botón "Editar" arriba.
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/payments')}
                  className="flex items-center gap-2"
                >
                  ← Volver a la lista de pagos
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PaymentDetails;
