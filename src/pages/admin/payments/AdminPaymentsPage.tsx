import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { paymentsService, adminUserService } from '../../../services/api';
import { Payment, PaymentFilters, User } from '../../../types';
import { showError, showSuccess, showLoading, closeLoading, showConfirm } from '../../../utils/alerts';
import { useNavigate } from 'react-router-dom';
import { FiltersIcon, CloseIcon, RefreshIcon, EyeIcon, EditIcon, DeleteIcon, ChartIcon, FileTextIcon } from '../../../utils/icons';

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

const AdminPaymentsPage: React.FC = () => {
  // Estado para los datos y paginación
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPayments, setTotalPayments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Estado para los filtros
  const [filters, setFilters] = useState<PaymentFilters>({
    month: 0,
    year: new Date().getFullYear(),
    paymentType: 'all',
    userId: undefined
  });
  
  // Estado para mostrar/ocultar el panel de filtros
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para la lista de usuarios (para el filtro)
  const [users, setUsers] = useState<User[]>([]);
  
  const navigate = useNavigate();

  // Función para cargar la lista de usuarios (para el filtro)
  const loadUsers = async () => {
    try {
      const usersData = await adminUserService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error al cargar la lista de usuarios:', error);
    }
  };
  
  // Función para cargar los pagos con los filtros actuales
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      const result = await paymentsService.getPayments({
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      });
      
      setPayments(result.payments);
      setTotalPayments(result.total);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los pagos';
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);
  
  // Efecto para cargar los pagos iniciales
  useEffect(() => {
    loadPayments();
    loadUsers();
  }, [loadPayments]);

  // Efecto para recargar pagos cuando cambian los filtros o la página
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);
  
  // Función para aplicar los filtros
  const applyFilters = () => {
    setCurrentPage(1); // Reiniciar a la primera página al filtrar
    loadPayments();
  };
  
  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setFilters({
      month: 0,
      year: new Date().getFullYear(),
      paymentType: 'all',
      userId: undefined,
      startDate: undefined,
      endDate: undefined
    });
    setCurrentPage(1);
  };
  
  // Función para manejar la eliminación de un pago
  const handleDeletePayment = async (id: number) => {
    const confirmed = await showConfirm(
      'Eliminar pago', 
      '¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
      try {
        showLoading('Eliminando pago...');
        
        await paymentsService.deletePayment(id);
        
        closeLoading();
        showSuccess('Éxito', 'El pago ha sido eliminado correctamente');
        
        // Recargar los pagos
        loadPayments();
      } catch (error: unknown) {
        closeLoading();
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el pago';
        showError('Error', errorMessage);
      }
    }
  };
  
  // Determinar si hay filtros activos
  const hasActiveFilters = filters.month !== 0 || 
    filters.userId !== undefined || 
    filters.paymentType !== 'all' ||
    filters.startDate || 
    filters.endDate;
    return (
    <AdminLayout title="Gestión de Cuotas">
      <div className="space-y-6">        {/* Panel de acciones */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => navigate('/admin/payments/new')} 
              variant="primary"
            >
              Registrar nueva cuota
            </Button>
            
            <Button
              onClick={() => navigate('/admin/payments/stats')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChartIcon className="w-4 h-4" />
              Estadísticas
            </Button>
              <Button
              onClick={() => navigate('/admin/payments/reports')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileTextIcon className="w-4 h-4" />
              Informes de cuotas
            </Button>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={hasActiveFilters ? "secondary" : "outline"}
              className={`flex items-center gap-2 ${hasActiveFilters ? 'border-warning-500 text-warning-700' : ''}`}
            >
              <FiltersIcon className="w-4 h-4" />
              {hasActiveFilters ? 'Filtros activos' : 'Filtros'}
              {hasActiveFilters && <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning-500 text-white text-xs font-semibold">!</span>}
            </Button>
            
            <Button
              onClick={loadPayments}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshIcon className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
          
          <Button 
            onClick={() => navigate('/admin/payments/stats')} 
            variant="outline"
          >
            Ver estadísticas
          </Button>
        </div>
        
        {/* Panel de filtros */}
        {showFilters && (
          <Card className="bg-gray-50 dark:bg-dark-800 p-4 border border-gray-200 dark:border-dark-600">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Filtros</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Usuario</label>
                <SearchableSelect
                  options={[
                    { value: '', label: 'Todos los usuarios' },
                    ...users.map(user => ({ value: user.id, label: user.name }))
                  ]}
                  value={filters.userId?.toString() || ''}
                  onChange={(value) => setFilters({...filters, userId: value ? Number(value) : undefined})}
                  placeholder="Buscar usuario..."
                  searchPlaceholder="Buscar por nombre..."
                  emptyText="No se encontraron usuarios"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mes</label>
                <Select 
                  value={(filters.month || 0).toString()} 
                  onChange={(e) => setFilters({...filters, month: Number(e.target.value)})}
                  className="w-full"
                >
                  <option value="0">Todos los meses</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Año</label>
                <Select 
                  value={filters.year?.toString() || ''} 
                  onChange={(e) => setFilters({...filters, year: Number(e.target.value)})}
                  className="w-full"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de cuota</label>
                <Select 
                  value={filters.paymentType || 'all'} 
                  onChange={(e) => setFilters({...filters, paymentType: e.target.value as 'normal' | 'maintenance' | 'all'})}
                  className="w-full"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="normal">Cuota normal</option>
                  <option value="maintenance">Cuota de mantenimiento</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Desde fecha</label>
                <Input 
                  type="date" 
                  value={filters.startDate || ''} 
                  onChange={(e) => setFilters({...filters, startDate: e.target.value || undefined})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Hasta fecha</label>
                <Input 
                  type="date" 
                  value={filters.endDate || ''} 
                  onChange={(e) => setFilters({...filters, endDate: e.target.value || undefined})}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4 gap-3">
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
              <Button onClick={applyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </Card>
        )}
        
        {/* Tabla de pagos */}
        <Card>
          <div className="p-1">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Usuario</Table.HeaderCell>
                  <Table.HeaderCell>Fecha</Table.HeaderCell>
                  <Table.HeaderCell>Período</Table.HeaderCell>
                  <Table.HeaderCell>Tipo</Table.HeaderCell>
                  <Table.HeaderCell>Importe</Table.HeaderCell>
                  <Table.HeaderCell>Método</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Acciones</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              
              <Table.Body>
                {loading ? (
                  <Table.Row>
                    <Table.Cell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : payments.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay cuotas registradas que coincidan con los criterios.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  payments.map((payment) => (
                    <Table.Row key={payment.id}>
                      <Table.Cell>{payment.user_name}</Table.Cell>
                      <Table.Cell>{formatDate(payment.payment_date)}</Table.Cell>
                      <Table.Cell>
                        {payment.month && payment.year ? 
                          `${getMonthName(payment.month)} ${payment.year}` : 
                          '-'}
                      </Table.Cell>
                      <Table.Cell>
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          payment.payment_type === 'normal' 
                            ? 'bg-blue-100 text-blue-800' 
                            : payment.payment_type === 'maintenance'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {payment.payment_type === 'normal' ? 'Normal' : 
                           payment.payment_type === 'maintenance' ? 'Mantenimiento' :
                           payment.payment_type === 'entrance' ? 'Entrada' :
                           payment.payment_type}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{formatCurrency(payment.amount)}</Table.Cell>
                      <Table.Cell>{payment.payment_method}</Table.Cell>
                      <Table.Cell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            className="p-1"
                            onClick={() => navigate(`/admin/payments/${payment.id}`)}
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="p-1"
                            onClick={() => navigate(`/admin/payments/${payment.id}/edit`)}
                            title="Editar"
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="p-1"
                            onClick={() => handleDeletePayment(payment.id)}
                            title="Eliminar"
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
            
            {/* Paginación */}
            {totalPayments > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalPayments)} - {Math.min(currentPage * itemsPerPage, totalPayments)} de {totalPayments} cuotas
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalPayments / itemsPerPage)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentsPage;
