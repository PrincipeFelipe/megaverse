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
    <AdminLayout title={`Detalles del Pago #${payment.id}`}>
      <div className="max-w-3xl mx-auto">
        <Card>
          <div className="p-6">
            {/* Acciones */}
            <div className="flex justify-end gap-2 mb-6">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => navigate(`/admin/payments/${payment.id}/edit`)}
              >
                <EditIcon className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline-danger"
                className="flex items-center gap-2"
                onClick={handleDelete}
              >
                <DeleteIcon className="w-4 h-4" />
                Eliminar
              </Button>
            </div>
            
            {/* Información principal */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Información del pago
                </h3>
                
                <div className="border rounded-md overflow-hidden">
                  <dl>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4 bg-gray-50">
                      <dt className="text-sm font-medium text-gray-500">ID</dt>
                      <dd className="text-sm text-gray-900 col-span-2">#{payment.id}</dd>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Usuario</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{payment.user_name}</dd>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4 bg-gray-50">
                      <dt className="text-sm font-medium text-gray-500">Importe</dt>
                      <dd className="text-sm font-semibold text-gray-900 col-span-2">
                        {formatCurrency(payment.amount)}
                      </dd>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Tipo de cuota</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          payment.payment_type === 'normal' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {payment.payment_type === 'normal' ? 'Normal' : 'Mantenimiento'}
                        </span>
                      </dd>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4 bg-gray-50">
                      <dt className="text-sm font-medium text-gray-500">Periodo</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {getMonthName(payment.month)} {payment.year}
                      </dd>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Fecha de pago</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formatDate(payment.payment_date)}</dd>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4 bg-gray-50">
                      <dt className="text-sm font-medium text-gray-500">Método de pago</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{payment.payment_method}</dd>
                    </div>
                    {payment.reference && (
                      <div className="px-4 py-2 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Referencia</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{payment.reference}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              {payment.notes && (
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
                    Notas
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-line">{payment.notes}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
                  Información del registro
                </h3>
                <div className="border rounded-md overflow-hidden">
                  <dl>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4 bg-gray-50">
                      <dt className="text-sm font-medium text-gray-500">Registrado por</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{payment.created_by_name || 'Sistema'}</dd>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formatDate(payment.created_at)}</dd>
                    </div>
                    {payment.created_at !== payment.updated_at && (
                      <div className="px-4 py-2 grid grid-cols-3 gap-4 bg-gray-50">
                        <dt className="text-sm font-medium text-gray-500">Última actualización</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formatDate(payment.updated_at)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/payments')}
                >
                  Volver a la lista de pagos
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
