import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { consumptionPaymentsService } from '../services/consumptionPaymentsService';
import { paymentsService } from '../services/paymentsService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { showError, showLoading, closeLoading, showSuccess, showConfirm } from '../utils/alerts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PayConsumptionsModal } from '../components/ui/PayConsumptionsModal';
import { ConsumptionPayment } from '../services/consumptionPaymentsService';
import { Payment, PaymentFilters } from '../types/payments';
import { useNotifications } from '../hooks/useNotifications';
import { AlertTriangle } from 'lucide-react';

// Estilos específicos para la alineación de tablas
import '../styles/table-alignment-fix.css';

export function PaymentHistoryPage() {
  const { updateUserData } = useAuth();
  const { refreshRejectedPaymentsStatus } = useNotifications();
  const [debtInfo, setDebtInfo] = useState<{
    currentDebt: number;
    paymentHistory: ConsumptionPayment[];
  }>({
    currentDebt: 0,
    paymentHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rejectedPaymentToRetry, setRejectedPaymentToRetry] = useState<ConsumptionPayment | null>(null);
  const [activeTab, setActiveTab] = useState<'consumptions' | 'memberships'>('consumptions');
  const [membershipPayments, setMembershipPayments] = useState<Payment[]>([]);
  const [membershipError, setMembershipError] = useState<string | null>(null);  // El número total de pagos de cuota se guarda solo para referencia, no se muestra en la interfaz actualmente
  
  // Filtros para la tabla de consumiciones
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    status: ''
  });
  
  // Filtros para la tabla de cuotas
  const [membershipFilters, setMembershipFilters] = useState<PaymentFilters>({
    startDate: '',
    endDate: '',
    paymentType: 'all',
    limit: 100,
    page: 1
  });  // Función auxiliar para garantizar que la deuda siempre sea un número
  const ensureDebtIsNumber = (data: { 
    currentDebt?: number | string | null; 
    paymentHistory?: ConsumptionPayment[]; 
  } | null | undefined): { 
    currentDebt: number; 
    paymentHistory: ConsumptionPayment[];
  } => {
    if (!data) return { currentDebt: 0, paymentHistory: [] };
    
    return {
      currentDebt: typeof data.currentDebt === 'number' ? data.currentDebt : 
                  data.currentDebt ? Number(data.currentDebt) : 0,
      paymentHistory: Array.isArray(data.paymentHistory) ? data.paymentHistory : []
    };
  };

  const fetchDebtAndPayments = useCallback(async () => {
    try {
      setLoading(true);
      showLoading('Cargando información de deuda y pagos...');
      
      const data = await consumptionPaymentsService.getUserDebt();
      console.log('Datos de deuda recibidos:', data);
      
      // Asegurarnos de que currentDebt sea un número
      const normalizedData = ensureDebtIsNumber(data);
      console.log('Datos normalizados:', normalizedData);
      
      setDebtInfo(normalizedData);
      
      // Actualizar estado de notificaciones después de cargar pagos
      refreshRejectedPaymentsStatus();
    } catch (error) {
      console.error('Error al obtener información de deuda y pagos:', error);
      showError('No se pudo cargar la información de deuda y pagos');
    } finally {
      closeLoading();
      setLoading(false);
    }
  }, [refreshRejectedPaymentsStatus]);
  
  const fetchMembershipPayments = useCallback(async () => {
    try {
      setLoadingMemberships(true);
      setMembershipError(null);
      
      const response = await paymentsService.getUserPayments(membershipFilters);      // Solo guardamos los pagos que vamos a mostrar en la tabla
      setMembershipPayments(response.payments);
    } catch (error) {
      console.error('Error al obtener los pagos de cuotas:', error);
      setMembershipError(error instanceof Error ? error.message : 'Error al cargar los pagos de cuotas');
      setMembershipPayments([]);
    } finally {
      setLoadingMemberships(false);
    }
  }, [membershipFilters]);
  
  useEffect(() => {
    fetchDebtAndPayments();
  }, [fetchDebtAndPayments]);
  
  useEffect(() => {
    if (activeTab === 'memberships') {
      fetchMembershipPayments();
    }
  }, [activeTab, fetchMembershipPayments]);
  
  const handlePaymentComplete = () => {
    fetchDebtAndPayments();
    updateUserData();
    setShowPaymentModal(false);
    setRejectedPaymentToRetry(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
      return dateString || 'Fecha desconocida';
    }
  };
  
  const formatPaymentMethod = (method: string) => {
    const methods: {[key: string]: string} = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia',
      'bizum': 'Bizum'
    };
    return methods[method] || method;
  };
  
  const renderPaymentStatus = (status?: string) => {
    if (!status || status === 'pendiente') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Pendiente
        </span>
      );
    } else if (status === 'aprobado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Aprobado
        </span>
      );
    } else if (status === 'rechazado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Rechazado
        </span>
      );
    }
    return null;
  };
  
  const handleRetryRejectedPayment = (payment: ConsumptionPayment) => {
    setRejectedPaymentToRetry(payment);
    setShowPaymentModal(true);
  };
  
  // Aplicar filtros a los pagos
  const filteredPayments = debtInfo.paymentHistory.filter(payment => {
    const matchStartDate = filters.startDate 
      ? new Date(payment.payment_date) >= new Date(filters.startDate) 
      : true;
    
    const matchEndDate = filters.endDate 
      ? new Date(payment.payment_date) <= new Date(new Date(filters.endDate).setHours(23, 59, 59)) 
      : true;
    
    const matchMethod = filters.paymentMethod 
      ? payment.payment_method === filters.paymentMethod 
      : true;
      
    const matchStatus = filters.status 
      ? payment.status === filters.status 
      : true;
    
    return matchStartDate && matchEndDate && matchMethod && matchStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Historial de Pagos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualiza y gestiona todos tus pagos
          </p>
        </div>
        
        {activeTab === 'consumptions' && debtInfo.currentDebt > 0 && (
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setShowPaymentModal(true)}>
              Pagar Consumiciones
            </Button>
          </div>
        )}
      </div>
      
      {/* Pestañas */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === 'consumptions'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('consumptions')}
        >
          Consumiciones
        </button>
        <button
          className={`py-3 px-6 font-medium ${
            activeTab === 'memberships'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('memberships')}
        >
          Cuotas
        </button>
      </div>
      
      {activeTab === 'consumptions' ? (
        // Contenido de la pestaña de Consumiciones
        <>
          <Card className="mb-8 overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Deuda Actual de Consumiciones
                </h2>                <p className="text-3xl font-bold">
                  {debtInfo && typeof debtInfo.currentDebt === 'number' && debtInfo.currentDebt > 0 ? (
                    <span className="text-red-600">€{debtInfo.currentDebt.toFixed(2)}</span>
                  ) : (
                    <span className="text-green-600">€0.00</span>
                  )}
                </p>
              </div>
              <div>
                {debtInfo.currentDebt > 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">Tienes una deuda pendiente por consumiciones realizadas.</p>
                    <Button 
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Realizar Pago
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>No tienes deuda pendiente. ¡Todo al día!</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filtrar Pagos de Consumiciones
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="block w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="block w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    id="paymentMethod"
                    value={filters.paymentMethod}
                    onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
                    className="block w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="bizum">Bizum</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="block w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="rechazado">Rechazados</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setFilters({startDate: '', endDate: '', paymentMethod: '', status: ''})}
                  className="mr-2"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Cargando pagos de consumiciones...</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No hay pagos de consumiciones registrados.</p>
                </div>              ) : (
                <Table striped>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>ID</Table.HeaderCell>
                      <Table.HeaderCell>Fecha</Table.HeaderCell>
                      <Table.HeaderCell>Monto</Table.HeaderCell>
                      <Table.HeaderCell>Método de Pago</Table.HeaderCell>
                      <Table.HeaderCell>Referencia</Table.HeaderCell>
                      <Table.HeaderCell>Estado</Table.HeaderCell>
                      <Table.HeaderCell className="text-center">Acción</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredPayments.map((payment) => (
                      <Table.Row key={payment.id}>
                        <Table.Cell highlight>{payment.id}</Table.Cell>
                        <Table.Cell align="left">{formatDate(payment.payment_date)}</Table.Cell>
                        <Table.Cell className="font-semibold text-green-600 dark:text-green-400">€{parseFloat(payment.amount.toString()).toFixed(2)}</Table.Cell>
                        <Table.Cell>{formatPaymentMethod(payment.payment_method)}</Table.Cell>
                        <Table.Cell>{payment.reference_number || '-'}</Table.Cell>                        <Table.Cell>{renderPaymentStatus(payment.status)}</Table.Cell>                        <Table.Cell className="text-center">                          <div className="action-cell">
                            {payment.status === 'rechazado' && (
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full action-cell">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                                  onClick={() => handleRetryRejectedPayment(payment)}
                                >
                                  Reintentar Pago
                                </Button>
                                {payment.rejection_reason && (
                                  <div className="tooltip-rejection">
                                    <div className="rejection-reason-button flex items-center justify-center gap-1 text-red-500 cursor-help">
                                      <AlertTriangle className="w-4 h-4 alert-icon-pulse" />
                                      <span className="text-xs font-medium">Ver motivo</span>
                                    </div>
                                    <div className="tooltip-text">
                                      <h4 className="font-medium text-red-300 mb-1">Motivo del rechazo:</h4>
                                      <p className="text-sm">{payment.rejection_reason}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}                            {payment.status === 'pendiente' && (
                              <div className="action-cell">
                                <span className="text-xs text-gray-500">En revisión</span>
                              </div>
                            )}
                            {payment.status !== 'rechazado' && payment.rejection_reason && (
                              <div className="action-cell">
                                <div className="tooltip-rejection">
                                  <div className="rejection-reason-button flex items-center justify-center gap-1 text-red-500 cursor-help">
                                    <AlertTriangle className="w-4 h-4 alert-icon-pulse" />
                                    <span className="text-xs font-medium">Ver motivo</span>
                                  </div>
                                  <div className="tooltip-text">
                                    <h4 className="font-medium text-red-300 mb-1">Motivo del rechazo:</h4>
                                    <p className="text-sm">{payment.rejection_reason}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </div>
          </Card>
        </>
      ) : (        // Contenido de la pestaña de Cuotas
        <>
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filtrar Pagos de Cuotas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="membershipStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    id="membershipStartDate"
                    value={membershipFilters.startDate}
                    onChange={(e) => setMembershipFilters({...membershipFilters, startDate: e.target.value})}
                    className="block w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="membershipEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    id="membershipEndDate"
                    value={membershipFilters.endDate}
                    onChange={(e) => setMembershipFilters({...membershipFilters, endDate: e.target.value})}
                    className="block w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="membershipPaymentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Cuota
                  </label>
                  <select
                    id="membershipPaymentType"
                    value={membershipFilters.paymentType}
                    onChange={(e) => setMembershipFilters({...membershipFilters, paymentType: e.target.value as 'normal' | 'maintenance' | 'all'})}
                    className="block w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">Todos</option>
                    <option value="normal">Cuota Regular</option>
                    <option value="maintenance">Cuota de Mantenimiento</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setMembershipFilters({...membershipFilters, startDate: '', endDate: '', paymentType: 'all'})}
                  className="mr-2"
                >
                  Limpiar Filtros
                </Button>
                <Button onClick={fetchMembershipPayments}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="overflow-x-auto">
              {loadingMemberships ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Cargando pagos de cuotas...</p>
                </div>
              ) : membershipError ? (
                <div className="p-6 text-center">
                  <p className="text-red-500">{membershipError}</p>
                </div>
              ) : membershipPayments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No hay pagos de cuotas registrados.</p>
                </div>
              ) : (
                <Table striped>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>ID</Table.HeaderCell>
                      <Table.HeaderCell>Fecha</Table.HeaderCell>
                      <Table.HeaderCell>Monto</Table.HeaderCell>
                      <Table.HeaderCell>Tipo</Table.HeaderCell>
                      <Table.HeaderCell>Período</Table.HeaderCell>
                      <Table.HeaderCell>Método</Table.HeaderCell>
                      <Table.HeaderCell>Referencia</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {membershipPayments.map((payment) => (
                      <Table.Row key={payment.id}>
                        <Table.Cell highlight>{payment.id}</Table.Cell>
                        <Table.Cell>{formatDate(payment.payment_date)}</Table.Cell>
                        <Table.Cell className="font-semibold text-green-600 dark:text-green-400">
                          €{parseFloat(payment.amount.toString()).toFixed(2)}
                        </Table.Cell>
                        <Table.Cell>
                          {payment.payment_type === 'normal' ? 'Regular' : 'Mantenimiento'}
                        </Table.Cell>                        <Table.Cell>
                          {payment.month && payment.year ? (
                            <>
                              {new Date(payment.year, payment.month - 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                            </>
                          ) : '-'}
                        </Table.Cell>
                        <Table.Cell>{formatPaymentMethod(payment.payment_method)}</Table.Cell>
                        <Table.Cell>{payment.reference || '-'}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </div>
          </Card>
        </>
      )}
      
      {/* Modal para realizar pagos */}
      {showPaymentModal && (
        <PayConsumptionsModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setRejectedPaymentToRetry(null);
          }}
          onPaymentComplete={handlePaymentComplete}
          currentDebt={debtInfo.currentDebt}
          rejectedPayment={rejectedPaymentToRetry}
        />
      )}
    </div>
  );
}