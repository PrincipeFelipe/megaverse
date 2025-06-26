import { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { ConsumptionPayment, consumptionPaymentsService } from '../../../services/consumptionPaymentsService';
import { showError, showLoading, closeLoading, showSuccess, showConfirm } from '../../../utils/alerts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number | null;
  onPaymentUpdated: () => void;
}

export function PaymentModal({ isOpen, onClose, paymentId, onPaymentUpdated }: PaymentModalProps) {
  const [payment, setPayment] = useState<ConsumptionPayment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) return;
      
      try {
        setLoading(true);
        showLoading('Cargando detalles del pago...');
        const paymentData = await consumptionPaymentsService.getPaymentDetails(paymentId);
        setPayment(paymentData);
      } catch (error) {
        console.error('Error al cargar el pago:', error);
        showError('No se pudieron cargar los detalles del pago');
      } finally {
        closeLoading();
        setLoading(false);
      }
    };
    
    if (isOpen && paymentId) {
      fetchPayment();
    } else {
      setPayment(null);
      setRejectionReason('');
    }
  }, [isOpen, paymentId]);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es });
    } catch {
      return dateString || '-';
    }
  };
  
  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia',
      'bizum': 'Bizum'
    };
    
    return methods[method] || method;
  };
  
  const formatStatus = (status?: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      'aprobado': { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
      'rechazado': { label: 'Rechazado', color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = status ? statusMap[status] : { label: 'Desconocido', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };
  
  const handleApprove = async () => {
    try {
      if (!payment) return;
      
      const confirmed = await showConfirm(
        'Aprobar Pago',
        '¿Estás seguro de que deseas aprobar este pago? Esta acción actualizará el saldo del usuario.',
        'Sí, aprobar',
        'Cancelar'
      );
      
      if (!confirmed) return;
      
      showLoading('Aprobando pago...');
      await consumptionPaymentsService.approvePayment(payment.id);
      showSuccess('Pago aprobado correctamente');
      onPaymentUpdated();
      onClose();    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al aprobar el pago');
    } finally {
      closeLoading();
    }
  };
  
  const handleReject = async () => {
    try {
      if (!payment) return;
      
      if (!rejectionReason.trim()) {
        showError('Debes indicar una razón para rechazar el pago');
        return;
      }
      
      const confirmed = await showConfirm(
        'Rechazar Pago',
        '¿Estás seguro de que deseas rechazar este pago?',
        'Sí, rechazar',
        'Cancelar'
      );
      
      if (!confirmed) return;
      
      showLoading('Rechazando pago...');
      await consumptionPaymentsService.rejectPayment(payment.id, rejectionReason);
      showSuccess('Pago rechazado correctamente');
      onPaymentUpdated();
      onClose();    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al rechazar el pago');
    } finally {
      closeLoading();
    }
  };
  
  return (    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Detalles del Pago de Consumición"
    >
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : payment ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                #{payment.id} - {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(payment.amount)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fecha: {formatDate(payment.payment_date)}
              </p>
            </div>
            <div>{formatStatus(payment.status)}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuario</h4>
              <p>{payment.user_name || payment.user_username || `ID: ${payment.user_id}`}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Método de Pago</h4>
              <p>{formatPaymentMethod(payment.payment_method)}</p>
            </div>
            
            {payment.reference_number && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Referencia</h4>
                <p>{payment.reference_number}</p>
              </div>
            )}
            
            {payment.notes && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</h4>
                <p>{payment.notes}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Registrado por</h4>
              <p>{payment.created_by_name || `ID: ${payment.created_by}`}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Registrado el</h4>
              <p>{formatDate(payment.created_at)}</p>
            </div>
            
            {payment.approved_by && (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {payment.status === 'aprobado' ? 'Aprobado por' : 'Rechazado por'}
                  </h4>
                  <p>{payment.approved_by_name || `ID: ${payment.approved_by}`}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {payment.status === 'aprobado' ? 'Aprobado el' : 'Rechazado el'}
                  </h4>
                  <p>{formatDate(payment.approved_at)}</p>
                </div>
              </>
            )}
            
            {payment.rejection_reason && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Razón del rechazo</h4>
                <p className="text-red-600 dark:text-red-400">{payment.rejection_reason}</p>
              </div>
            )}
          </div>
          
          {payment.status === 'pendiente' && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Acciones
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Button 
                      onClick={handleApprove} 
                      variant="primary" 
                      className="w-full mb-2"
                    >
                      Aprobar Pago
                    </Button>
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="rejection-reason" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Razón del Rechazo
                    </label>
                    <textarea
                      id="rejection-reason"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:border-dark-600"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Indica la razón por la que rechazas este pago..."
                    />
                    <Button 
                      onClick={handleReject} 
                      variant="secondary" 
                      className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Rechazar Pago
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="pt-4 flex justify-end">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          No se encontró información del pago
        </div>
      )}
    </Modal>
  );
}
