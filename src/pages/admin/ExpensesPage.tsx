import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssociationExpense, ExpenseFilters, ExpenseCategories } from '../../types/expenses';
import { expensesService } from '../../services/expensesService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { showError, showLoading, closeLoading, showConfirm } from '../../utils/alerts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ExpenseModal } from '../../components/admin/expenses/ExpenseModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ExpensesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<AssociationExpense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  
  // Estado para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('create');
  const [selectedExpense, setSelectedExpense] = useState<AssociationExpense | undefined>(undefined);
  
  // Filtros para la tabla
  const [filters, setFilters] = useState<ExpenseFilters>({
    startDate: '',
    endDate: '',
    category: '',
    page: 1,
    limit: 50
  });
  
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      showLoading('Cargando gastos...');
      
      const response = await expensesService.getExpenses(filters);
      setExpenses(response.expenses);
      setTotalExpenses(response.total);
    } catch (error) {
      console.error('Error al obtener los gastos:', error);
      showError('No se pudieron cargar los gastos');
    } finally {
      closeLoading();
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return dateString || 'Fecha desconocida';
    }
  };
  
  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      'transferencia': 'Transferencia',
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'domiciliacion': 'Domiciliación'
    };
    
    return methods[method] || method;
  };
  
  const handleDeleteExpense = async (id: number) => {
    const confirmed = await showConfirm(
      'Eliminar Gasto',
      '¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
      try {
        showLoading('Eliminando gasto...');
        await expensesService.deleteExpense(id);
        closeLoading();
        showError('Gasto eliminado correctamente');
        fetchExpenses();
      } catch (error) {
        closeLoading();
        showError('Error al eliminar el gasto');
        console.error(error);
      }
    }
  };

  return (
    <>
      <AdminLayout title="Gestión de Gastos">
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Administra los pagos realizados por la asociación
          </p>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Button 
              onClick={() => {
                setSelectedExpense(undefined);
                setModalMode('create');
                setIsModalOpen(true);
              }} 
            >
              Nuevo Gasto
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/expenses/report')}
            >
              Ver Informe
            </Button>
          </div>
        
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Filtrar Gastos
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
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <select
                    id="category"
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:border-dark-600"
                  >
                    <option value="">Todas</option>
                    {ExpenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={() => fetchExpenses()} className="mr-2">
                    Filtrar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setFilters({
                      startDate: '',
                      endDate: '',
                      category: '',
                      page: 1,
                      limit: 50
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
                Lista de Gastos
              </h2>
              
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  No se encontraron gastos. Intenta ajustar los filtros o agrega un nuevo gasto.
                </div>
              ) : (
                <>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Fecha</Table.HeaderCell>
                        <Table.HeaderCell>Concepto</Table.HeaderCell>
                        <Table.HeaderCell>Cantidad</Table.HeaderCell>
                        <Table.HeaderCell>Categoría</Table.HeaderCell>
                        <Table.HeaderCell>Método</Table.HeaderCell>
                        <Table.HeaderCell>Acciones</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {expenses.map(expense => (
                        <Table.Row key={expense.id}>
                          <Table.Cell>{formatDate(expense.expense_date)}</Table.Cell>
                          <Table.Cell>{expense.concept}</Table.Cell>
                          <Table.Cell>
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(expense.amount)}
                          </Table.Cell>
                          <Table.Cell>{expense.category || 'Sin categoría'}</Table.Cell>
                          <Table.Cell>{formatPaymentMethod(expense.payment_method)}</Table.Cell>
                          <Table.Cell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setModalMode('view');
                                  setIsModalOpen(true);
                                }}
                              >
                                Ver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setModalMode('edit');
                                  setIsModalOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                  
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Mostrando {expenses.length} de {totalExpenses} gastos
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={filters.page !== undefined && filters.page <= 1}
                        onClick={() => setFilters({...filters, page: (filters.page || 1) - 1})}
                      >
                        Anterior
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={filters.limit !== undefined && expenses.length < filters.limit}
                        onClick={() => setFilters({...filters, page: (filters.page || 1) + 1})}
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
      </AdminLayout>
      
      {/* Modal para crear, editar o ver gastos */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (modalMode === 'create') {
            setSelectedExpense(undefined);
          }
        }}
        mode={modalMode}
        expense={selectedExpense}
        onSuccess={() => {
          // Si estamos en modo vista y hacemos clic en editar
          if (modalMode === 'view' && selectedExpense) {
            setModalMode('edit');
            setIsModalOpen(true);
          } else {
            fetchExpenses();
            setIsModalOpen(false);
            // Limpiar el gasto seleccionado si estamos en modo crear
            if (modalMode === 'create') {
              setSelectedExpense(undefined);
            }
          }
        }}
      />
    </>
  );
}
