import { useState, useEffect, useCallback } from 'react';
import { 
  ConsumptionPayment, 
  PaymentFilters,
  consumptionPaymentsService 
} from '../../services/consumptionPaymentsService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { showError, showLoading, closeLoading, showSuccess, showConfirm } from '../../utils/alerts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PaymentModal } from '../../components/admin/payments/PaymentModal';

export function ConsumptionPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<ConsumptionPayment[]>([]);
  const [totalPayments, setTotalPayments] = useState<number>(0);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // Filtros para la tabla
  const [filters, setFilters] = useState<PaymentFilters>({
    startDate: '',
    endDate: '',
    status: '',
    limit: 50,
    offset: 0
  });
  
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      showLoading('Cargando pagos de consumiciones...');
      
      const response = await consumptionPaymentsService.getPaymentHistory(filters);
      setPayments(response.payments);
      setTotalPayments(response.total);
    } catch (error) {
      console.error('Error al obtener los pagos:', error);
      showError('No se pudieron cargar los pagos de consumiciones');
    } finally {
      closeLoading();
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString || 'Fecha desconocida';
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
  
  const handleOpenModal = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPaymentId(null);
  };
  
  const renderStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { label: string, color: string }> = {
      'pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      'aprobado': { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
      'rechazado': { label: 'Rechazado', color: 'bg-red-100 text-red-800' }
    };
    
    const config = status ? statusConfig[status] : { label: 'Desconocido', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };
  
  return (
    <AdminLayout title="Pagos de Consumiciones">
      <div className="space-y-6">
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona los pagos por consumiciones realizados por los usuarios
        </p>
        
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Filtrar Pagos
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:border-dark-600"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:border-dark-600"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value as '' | 'pendiente' | 'aprobado' | 'rechazado'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:border-dark-600"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobado">Aprobados</option>
                  <option value="rechazado">Rechazados</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={() => fetchPayments()} className="mr-2">
                  Filtrar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setFilters({
                    startDate: '',
                    endDate: '',
                    status: '',
                    limit: 50,
                    offset: 0
                  })}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lista de Pagos por Consumiciones
            </h2>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                No se encontraron pagos de consumiciones. Intenta ajustar los filtros.
              </div>
            ) : (
              <>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Fecha</Table.HeaderCell>
                      <Table.HeaderCell>Usuario</Table.HeaderCell>
                      <Table.HeaderCell>Cantidad</Table.HeaderCell>
                      <Table.HeaderCell>Método de Pago</Table.HeaderCell>
                      <Table.HeaderCell>Referencia</Table.HeaderCell>
                      <Table.HeaderCell>Registrado Por</Table.HeaderCell>
                      <Table.HeaderCell>Estado</Table.HeaderCell>
                      <Table.HeaderCell>Acciones</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>                    {payments.map(payment => (
                      <Table.Row 
                        key={payment.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700"
                      >
                        <Table.Cell>{formatDate(payment.payment_date)}</Table.Cell>
                        <Table.Cell>{payment.user_name || payment.user_username || `ID: ${payment.user_id}`}</Table.Cell>
                        <Table.Cell>
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(payment.amount)}
                        </Table.Cell>
                        <Table.Cell>{formatPaymentMethod(payment.payment_method)}</Table.Cell>
                        <Table.Cell>{payment.reference_number || '-'}</Table.Cell>
                        <Table.Cell>{payment.created_by_name || `ID: ${payment.created_by}`}</Table.Cell>
                        <Table.Cell>{renderStatusBadge(payment.status)}</Table.Cell>
                        <Table.Cell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(payment.id)}
                          >
                            Ver Detalles
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
                
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {payments.length} de {totalPayments} pagos
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={filters.offset === 0}
                      onClick={() => setFilters({
                        ...filters, 
                        offset: Math.max(0, (filters.offset || 0) - (filters.limit || 50))
                      })}
                    >
                      Anterior
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={payments.length < (filters.limit || 50)}
                      onClick={() => setFilters({
                        ...filters, 
                        offset: (filters.offset || 0) + (filters.limit || 50)
                      })}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
      
      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        paymentId={selectedPaymentId}
        onPaymentUpdated={fetchPayments}
      />
    </AdminLayout>
  );
}
