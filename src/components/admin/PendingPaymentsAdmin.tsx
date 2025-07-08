import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { consumptionPaymentsService, ConsumptionPayment, Consumption } from '../../services/consumptionPaymentsService';
import { showSuccess, showError, showConfirm } from '../../utils/alerts';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface PaymentDetailsModalProps {
  paymentId: number;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

// Componente modal para ver los detalles del pago
const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ paymentId, onClose, onPaymentUpdated }) => {
  const [payment, setPayment] = useState<ConsumptionPayment | null>(null);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { user } = useAuth();
  
  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        setLoading(true);
        const details = await consumptionPaymentsService.getPaymentDetails(paymentId);
        setPayment(details.payment);
        setConsumptions(details.consumptions);
      } catch (error) {
        console.error('Error al cargar detalles del pago:', error);
        showError('Error', 'No se pudieron cargar los detalles del pago');
      } finally {
        setLoading(false);
      }
    };
    
    loadPaymentDetails();
  }, [paymentId]);
  
  const handleApprovePayment = async () => {
    if (!user || user.role !== 'admin') return;
    
    const confirmed = await showConfirm(
      'Aprobar pago', 
      '¿Confirmas que has recibido este pago y quieres aprobarlo?',
      'Aprobar',
      'Cancelar'
    );
    
    if (confirmed) {
      try {
        await consumptionPaymentsService.approvePayment(paymentId);
        showSuccess('Pago aprobado', 'El pago ha sido aprobado correctamente');
        onPaymentUpdated();
        onClose();
      } catch (error) {
        console.error('Error al aprobar pago:', error);
        showError('Error', 'No se pudo aprobar el pago');
      }
    }
  };
  
  const handleRejectPayment = async () => {
    if (!user || user.role !== 'admin') return;
    setShowRejectModal(true);
  };

  const confirmRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      showError('Error', 'Debe proporcionar una razón para rechazar el pago');
      return;
    }

    try {
      await consumptionPaymentsService.rejectPayment(paymentId, rejectionReason);
      showSuccess('Pago rechazado', 'El pago ha sido rechazado correctamente');
      setShowRejectModal(false);
      setRejectionReason('');
      onPaymentUpdated();
      onClose();
    } catch (error) {
      console.error('Error al rechazar pago:', error);
      showError('Error', 'No se pudo rechazar el pago');
    }
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!payment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">No se encontraron detalles para este pago.</p>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const total = consumptions.reduce((sum, item) => sum + item.total_price, 0);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Detalles del Pago #{payment.id}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Usuario</h3>
              <p className="font-medium text-gray-800 dark:text-gray-200">{payment.user_name || 'Usuario'}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha</h3>
              <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(payment.created_at, true)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Método</h3>
              <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">{payment.payment_method}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Referencia</h3>
              <p className="font-medium text-gray-800 dark:text-gray-200">{payment.reference_number || '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Importe</h3>
              <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</h3>
              <p className={`font-medium ${
                payment.status === 'aprobado' ? 'text-green-600 dark:text-green-400' : 
                payment.status === 'pendiente' ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-red-600 dark:text-red-400'
              } capitalize`}>
                {payment.status}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
            Consumos incluidos
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md mb-3 flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-300">Total consumos:</span>
              <span className="ml-2 text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-300">Cantidad consumos:</span>
              <span className="ml-2 text-lg font-bold text-blue-600 dark:text-blue-400">{consumptions.length}</span>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {consumptions.map(item => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
              >
                <div>
                  <div className="font-medium">{item.product_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.quantity} x {formatCurrency(item.price_per_unit)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(item.created_at.split('T')[0])}
                  </div>
                </div>
                <div className="font-medium">{formatCurrency(item.total_price)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {payment.status === 'pendiente' && user && user.role === 'admin' && (
          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button 
              onClick={handleRejectPayment}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Rechazar
            </button>
            <button 
              onClick={handleApprovePayment}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Aprobar
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de rechazo de pago */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Rechazar Pago
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Por favor, proporciona una razón para rechazar este pago:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none"
              rows={4}
              placeholder="Escribe la razón del rechazo..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRejectPayment}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Rechazar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PendingPaymentsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<ConsumptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  
  // Usar useCallback para evitar recrear la función en cada renderizado
  const loadPendingPayments = React.useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setLoading(true);
      console.log('Cargando pagos pendientes...');
      const payments = await consumptionPaymentsService.getPendingPayments();
      console.log('Pagos pendientes recibidos:', payments);
      setPendingPayments(payments);
    } catch (error) {
      console.error('Error al cargar pagos pendientes:', error);
      showError('Error', 'No se pudieron cargar los pagos pendientes');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    loadPendingPayments();
  }, [loadPendingPayments]);
  
  const handleViewDetails = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
  };
  
  const handleCloseDetails = () => {
    setSelectedPaymentId(null);
  };
  
  // Si el usuario no es administrador, no mostramos nada
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No tienes permisos para ver esta sección
      </div>
    );
  }
  
  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : pendingPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay pagos pendientes de aprobación
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Importe
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {pendingPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100">#{payment.id}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {payment.user_name || 'Usuario'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(payment.created_at.split('T')[0])}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize">
                    {payment.payment_method}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {payment.reference_number || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleViewDetails(payment.id)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal de detalles de pago */}
      {selectedPaymentId !== null && (
        <PaymentDetailsModal
          paymentId={selectedPaymentId}
          onClose={handleCloseDetails}
          onPaymentUpdated={loadPendingPayments}
        />
      )}
    </div>
  );
};

export default PendingPaymentsAdmin;
