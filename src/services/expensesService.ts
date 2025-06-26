import { 
  AssociationExpense, 
  ExpenseFormData, 
  ExpensesResponse,
  ExpenseReportResponse,
  ExpenseFilters
} from '../types/expenses';
import { fetchWithAuth } from './api';

/**
 * Servicio para la gestión de gastos (pagos realizados por la asociación)
 */
export const expensesService = {
  
  /**
   * Obtiene todos los gastos con opciones de filtrado y paginación
   */
  getExpenses: async (filters: ExpenseFilters = {}): Promise<ExpensesResponse> => {
    try {
      // Construir los parámetros de la URL
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Paginación
      const limit = filters.limit || 50;
      const page = filters.page || 1;
      const offset = (page - 1) * limit;
      
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const url = `/expenses?${params.toString()}`;
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener los gastos:', error);
      throw error;
    }
  },
  
  /**
   * Crea un nuevo gasto
   */
  createExpense: async (expenseData: ExpenseFormData): Promise<{ expense: AssociationExpense, message: string }> => {
    try {
      const url = '/expenses';
      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al crear el gasto:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza un gasto existente
   */
  updateExpense: async (id: number, expenseData: Partial<ExpenseFormData>): Promise<{ expense: AssociationExpense, message: string }> => {
    try {
      const url = `/expenses/${id}`;
      const response = await fetchWithAuth(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al actualizar el gasto:', error);
      throw error;
    }
  },
  
  /**
   * Elimina un gasto
   */
  deleteExpense: async (id: number): Promise<{ message: string }> => {
    try {
      const url = `/expenses/${id}`;
      const response = await fetchWithAuth(url, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al eliminar el gasto:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene un gasto específico por su ID
   */
  getExpenseById: async (id: number): Promise<AssociationExpense> => {
    try {
      const url = `/expenses/${id}`;
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener el gasto:', error);
      throw error;
    }
  },
  
  /**
   * Genera un informe de gastos
   */
  generateExpenseReport: async (filters: Partial<ExpenseFilters> = {}): Promise<ExpenseReportResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category) params.append('category', filters.category);
      
      const url = `/expenses/report?${params.toString()}`;
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al generar el informe de gastos:', error);
      throw error;
    }
  },
  /**
   * Obtiene el total de todos los gastos de la asociación
   */
  getTotalExpenses: async (): Promise<number> => {
    try {
      // Intentamos primero obtener el informe de gastos que podría contener totales
      try {
        const reportResponse = await expensesService.generateExpenseReport();
        if (reportResponse && reportResponse.totals && Array.isArray(reportResponse.totals)) {
          const total = reportResponse.totals.reduce(
            (sum: number, categoryTotal: { total: number }) => 
              sum + (typeof categoryTotal.total === 'number' ? categoryTotal.total : 0),
            0
          );
          if (total > 0) {
            console.log("Total obtenido del informe de gastos:", total);
            return total;
          }
        }
      } catch (reportError) {
        console.error("Error al obtener el informe de gastos:", reportError);
      }
      
      // Si lo anterior falló, obtenemos todos los gastos sin paginación
      const params = new URLSearchParams();
      params.append('limit', '1000'); // Un valor alto para obtener todos
      
      const url = `/expenses?${params.toString()}`;
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Datos de gastos obtenidos:", data);
      
      // Calcular el total sumando todos los gastos
      let total = 0;
      if (data && Array.isArray(data.expenses)) {
        total = data.expenses.reduce((sum: number, expense: { id: number; amount: number }) => {
          // Asegurarse de que amount es un número
          const amount = typeof expense.amount === 'number' 
            ? expense.amount 
            : parseFloat(String(expense.amount));
          
          // Registrar cada gasto para depuración
          console.log(`Gasto ID ${expense.id}: ${amount}`);
          
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      }
      
      console.log("Total calculado de la lista de gastos:", total);
      return total;
    } catch (error) {
      console.error('Error al obtener el total de gastos:', error);
      return 0; // Retornamos 0 en caso de error para evitar que falle la aplicación
    }
  },
};
