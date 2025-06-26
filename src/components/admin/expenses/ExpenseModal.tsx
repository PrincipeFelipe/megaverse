import { useState, useEffect } from 'react';
import { AssociationExpense, ExpenseFormData, ExpenseCategories } from '../../../types/expenses';
import { expensesService } from '../../../services/expensesService';
import { Button } from '../../../components/ui/Button';
import { showError, showLoading, closeLoading, showSuccess } from '../../../utils/alerts';
import { format } from 'date-fns';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  expense?: AssociationExpense;
  onSuccess?: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  expense, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    concept: '',
    category: ExpenseCategories[0],
    payment_method: 'transferencia',
    recipient: '',
    reference: '',
    attachment_url: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  
  // Inicializar el formulario con los datos del gasto si estamos en modo edit o view  // Función para formatear correctamente la fecha en formato YYYY-MM-DD
  const formatExpenseDate = (dateString: string): string => {
    try {
      // Si la fecha ya tiene el formato correcto, la devolvemos tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Si no, convertimos la fecha a formato YYYY-MM-DD
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (e) {
      console.error('Error al formatear la fecha:', e);
      return format(new Date(), 'yyyy-MM-dd'); // Fecha actual como fallback
    }
  };

  useEffect(() => {
    if (expense && (mode === 'edit' || mode === 'view')) {
      setFormData({
        amount: expense.amount,
        expense_date: formatExpenseDate(expense.expense_date),
        concept: expense.concept,
        category: expense.category || undefined,
        payment_method: expense.payment_method,
        recipient: expense.recipient || undefined,
        reference: expense.reference || undefined,
        attachment_url: expense.attachment_url || undefined,
        notes: expense.notes || undefined
      });
    } else {
      // Reiniciar el formulario para el modo create
      setFormData({
        amount: 0,
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        concept: '',
        category: ExpenseCategories[0],
        payment_method: 'transferencia',
        recipient: '',
        reference: '',
        attachment_url: '',
        notes: ''
      });
    }
  }, [expense, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      showLoading(mode === 'edit' ? 'Actualizando gasto...' : 'Creando gasto...');
      
      if (mode === 'edit' && expense) {
        await expensesService.updateExpense(expense.id, formData);
        showSuccess('Gasto actualizado correctamente');
      } else if (mode === 'create') {
        await expensesService.createExpense(formData);
        showSuccess('Gasto creado correctamente');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      showError('Ha ocurrido un error');
    } finally {
      closeLoading();
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  const isViewMode = mode === 'view';
  const modalTitle = {
    'view': 'Detalles del Gasto',
    'create': 'Nuevo Gasto',
    'edit': 'Editar Gasto'
  }[mode];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {modalTitle}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="concept" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Concepto *
                </label>
                <input
                  type="text"
                  id="concept"
                  name="concept"
                  value={formData.concept}
                  onChange={handleChange}
                  disabled={isViewMode}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Importe (€) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  disabled={isViewMode}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              
              <div>
                <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha del Gasto *
                </label>
                <input
                  type="date"
                  id="expense_date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  disabled={isViewMode}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {ExpenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Método de Pago *
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  disabled={isViewMode}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="domiciliacion">Domiciliación</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Destinatario
                </label>
                <input
                  type="text"
                  id="recipient"
                  name="recipient"
                  value={formData.recipient || ''}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              
              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Referencia
                </label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  value={formData.reference || ''}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="attachment_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL de Adjunto
                </label>
                <input
                  type="text"
                  id="attachment_url"
                  name="attachment_url"
                  value={formData.attachment_url || ''}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                  placeholder="http://ejemplo.com/archivo.pdf"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes || ''}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:border-dark-600 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                {isViewMode ? 'Cerrar' : 'Cancelar'}
              </Button>
              
              {!isViewMode && (
                <Button 
                  type="submit" 
                  disabled={loading}
                >
                  {mode === 'edit' ? 'Actualizar' : 'Guardar'}
                </Button>
              )}              {isViewMode && expense && (
                <Button 
                  type="button" 
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    // No cerramos el modal aquí, porque el componente padre
                    // cambiará el modo a 'edit' y mantendrá el modal abierto
                  }}
                >
                  Editar
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
