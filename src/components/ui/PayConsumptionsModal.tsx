import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { consumptionPaymentsService, ConsumptionPayment } from '../../services/consumptionPaymentsService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { showLoading, closeLoading, showSuccess, showError } from '../../utils/alerts';

interface PayConsumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: () => void;
  currentDebt?: number;
  rejectedPayment?: ConsumptionPayment | null;
}

export const PayConsumptionsModal: React.FC<PayConsumptionsModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  currentDebt: propCurrentDebt,
  rejectedPayment
}) => {
  const { user, updateUserData } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'bizum'>('efectivo');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [currentDebt, setCurrentDebt] = useState<number>(propCurrentDebt || 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRetryingPayment, setIsRetryingPayment] = useState<boolean>(false);
  
  // Definir fetchDebtInfo con useCallback para evitar problemas de dependencia
  const fetchDebtInfo = useCallback(async () => {
    if (isOpen && user && !rejectedPayment) {      try {
        setLoading(true);
        const debtInfo = await consumptionPaymentsService.getUserDebt();
        console.log('Información de deuda obtenida en modal:', debtInfo);
        
        // Asegurar que currentDebt sea un número
        const debt = typeof debtInfo.currentDebt === 'number' 
          ? debtInfo.currentDebt 
          : debtInfo.currentDebt 
            ? Number(debtInfo.currentDebt) 
            : 0;
        
        console.log('Deuda normalizada en modal:', debt);
        setCurrentDebt(debt);
        setAmount(debt); // Por defecto, establecer el monto completo
      } catch (error) {
        console.error('Error al obtener información de deuda:', error);
        showError('No se pudo obtener la información de tu deuda actual');
      } finally {
        setLoading(false);
      }
    }
  }, [isOpen, user, rejectedPayment]);

  useEffect(() => {
    // Si se está reintentando un pago rechazado, configurar los datos iniciales
    if (rejectedPayment) {
      setIsRetryingPayment(true);
      setAmount(parseFloat(rejectedPayment.amount.toString()));
      setPaymentMethod(rejectedPayment.payment_method);
      setReferenceNumber(rejectedPayment.reference_number || '');
      setNotes(rejectedPayment.notes || '');
      setLoading(false);
    } else {
      setIsRetryingPayment(false);
      // Si no es un reintento, cargar la deuda actual
      fetchDebtInfo();
    }
  }, [rejectedPayment, fetchDebtInfo]);
  
  // Actualizar currentDebt cuando cambia el prop
  useEffect(() => {
    if (propCurrentDebt !== undefined) {
      setCurrentDebt(propCurrentDebt);
    }
  }, [propCurrentDebt]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      showError('El monto debe ser mayor a cero');
      return;
    }

    // Si es un reintento de pago, verificamos que el monto no haya sido modificado
    if (rejectedPayment && parseFloat(rejectedPayment.amount.toString()) !== amount) {
      showError('No se permite modificar el monto al reintentar un pago rechazado');
      // Restaurar el monto original
      setAmount(parseFloat(rejectedPayment.amount.toString()));
      return;
    }

    if (!rejectedPayment && amount > currentDebt) {
      showError(`El monto no puede ser mayor a la deuda actual (€${currentDebt.toFixed(2)})`);
      return;
    }

    if (paymentMethod === 'transferencia' && !referenceNumber) {
      showError('Para pagos por transferencia, debes proporcionar un número de referencia');
      return;
    }    try {
      showLoading(rejectedPayment ? 'Reintentando pago...' : 'Procesando pago...');
      
      if (rejectedPayment) {
        // Si es un reintento de pago rechazado, actualizar el pago existente
        const paymentData = {
          paymentMethod,
          referenceNumber: paymentMethod === 'transferencia' ? referenceNumber : undefined,
          notes: notes || undefined
        };
        
        await consumptionPaymentsService.retryPayment(rejectedPayment.id, paymentData);
      } else {
        // Si es un nuevo pago, crear uno nuevo
        const paymentData = {
          amount,
          paymentMethod,
          referenceNumber: paymentMethod === 'transferencia' ? referenceNumber : undefined,
          notes: notes || undefined
        };
        
        await consumptionPaymentsService.createPayment(paymentData);
      }
      
      closeLoading();
      showSuccess(
        rejectedPayment ? 'Pago reintentado correctamente' : 'Pago registrado correctamente', 
        'Tu pago ha sido procesado exitosamente y está pendiente de revisión'
      );
      
      // Actualizar los datos del usuario para reflejar el nuevo saldo
      updateUserData();
      
      // Cerrar el modal y notificar que el pago se completó
      onClose();
      if (onPaymentComplete) onPaymentComplete();
      
    } catch (error) {
      closeLoading();
      console.error('Error al realizar el pago:', error);
      showError(error instanceof Error ? error.message : 'Error al procesar el pago');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {rejectedPayment ? 'Reintentar pago rechazado' : 'Pagar consumiciones'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            {rejectedPayment ? (              <div className="mb-4 p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-1">
                  Reintento de pago rechazado
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Este pago fue rechazado anteriormente. Puedes modificar el método de pago y la referencia, pero no el monto.
                </p>
                {rejectedPayment.rejection_reason && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Motivo del rechazo:</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {rejectedPayment.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                Deuda actual: <span className="font-bold text-red-600">€{currentDebt.toFixed(2)}</span>
              </p>
            )}
            </div>
            <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto a pagar (€)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              disabled={loading || isRetryingPayment} /* Deshabilitar cuando es un reintento */
              className="block w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
              required
            />
            {isRetryingPayment && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                El monto no puede ser modificado al reintentar un pago rechazado
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Método de pago
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'efectivo' | 'transferencia' | 'bizum')}
              disabled={loading}
              className="block w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="bizum">Bizum</option>
            </select>
          </div>
          
          {paymentMethod === 'transferencia' && (
            <div className="mb-4">
              <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de referencia
              </label>
              <input
                type="text"
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                disabled={loading}
                className="block w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                required={paymentMethod === 'transferencia'}
                placeholder="Ej: Últimos 4 dígitos de la cuenta o referencia de transferencia"
              />
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas adicionales
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="block w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Información adicional sobre el pago (opcional)"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (!amount || amount <= 0)}
            >
              {rejectedPayment ? 'Reintentar Pago' : 'Realizar Pago'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
