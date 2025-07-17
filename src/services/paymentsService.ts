import { 
  Payment, 
  PaymentFormData, 
  PaymentsResponse,
  PaymentStatsResponse,
  PaymentFilters,
  PaymentReportResponse 
} from '../types';
import { fetchWithAuth } from './api';
import { createModuleLogger } from '../utils/loggerExampleUsage';

// Crear logger para el servicio de pagos
const paymentsLogger = createModuleLogger('PAYMENTS');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';
const API_PATH = '';

/**
 * Servicio para la gestión de pagos de cuotas
 */
export const paymentsService = {
  /**
   * Obtiene todos los pagos con opciones de filtrado y paginación
   */
  getPayments: async (filters: PaymentFilters = {}): Promise<PaymentsResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      // Construir los parámetros de la URL
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.month) params.append('month', filters.month.toString());
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.paymentType && filters.paymentType !== 'all') params.append('paymentType', filters.paymentType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Paginación
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const offset = (page - 1) * limit;
      
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const response = await fetch(`${API_URL}${API_PATH}/payments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as PaymentsResponse;
    } catch (error) {
      paymentsLogger.error('Error al obtener los pagos', error);
      throw error;
    }
  },
  
  /**
   * Crea un nuevo pago
   */
  createPayment: async (paymentData: PaymentFormData): Promise<{ payment: Payment, message: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}${API_PATH}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      paymentsLogger.error('Error al crear el pago', error);
      throw error;
    }
  },
  
  /**
   * Actualiza un pago existente
   */
  updatePayment: async (id: number, paymentData: Partial<PaymentFormData>): Promise<{ payment: Payment, message: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}${API_PATH}/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      paymentsLogger.error('Error al actualizar el pago', error);
      throw error;
    }
  },
  
  /**
   * Elimina un pago
   */
  deletePayment: async (id: number): Promise<{ id: number, message: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}${API_PATH}/payments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al eliminar el pago:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene las estadísticas de pagos
   */
  getPaymentStats: async (year?: number): Promise<PaymentStatsResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      
      const response = await fetch(`${API_URL}${API_PATH}/payments/stats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener las estadísticas de pagos:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene un pago específico por su ID
   */
  getPaymentById: async (id: number): Promise<{ payment: Payment }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}${API_PATH}/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener el pago:', error);
      throw error;
    }
  },
    /**
   * Genera un informe de pagos para un período específico
   */
  generatePaymentReport: async (startDate: string, endDate: string, paymentType?: 'normal' | 'maintenance' | 'entrance'): Promise<PaymentReportResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (paymentType) params.append('paymentType', paymentType);
      
      const response = await fetch(`${API_URL}${API_PATH}/payments/report?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al generar el informe de pagos:', error);
      throw error;
    }
  },

  /**
   * Obtiene un informe de pagos (método alternativo que acepta un objeto de filtros)
   */
  getPaymentReport: async (filters: { startDate?: string; endDate?: string; paymentType?: 'normal' | 'maintenance' | 'entrance' }): Promise<PaymentReportResponse> => {
    try {
      return await paymentsService.generatePaymentReport(
        filters.startDate || '', 
        filters.endDate || '', 
        filters.paymentType
      );
    } catch (error) {
      console.error('Error al obtener el informe de pagos:', error);
      throw error;
    }
  },

  /**
   * Obtiene los pagos de cuotas del usuario actual
   */
  getUserPayments: async (filters: Partial<PaymentFilters> = {}): Promise<PaymentsResponse> => {
    try {
      // Construir los parámetros de la URL
      const params = new URLSearchParams();
      params.append('currentUser', 'true'); // Indica al backend que queremos pagos del usuario actual
      if (filters.month) params.append('month', filters.month.toString());
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.paymentType && filters.paymentType !== 'all') params.append('paymentType', filters.paymentType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Paginación
      const limit = filters.limit || 100; // Mostrar más pagos por defecto para el usuario
      const page = filters.page || 1;
      const offset = (page - 1) * limit;
      
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const url = `/payments/user?${params.toString()}`;
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as PaymentsResponse;
    } catch (error) {
      console.error('Error al obtener los pagos del usuario:', error);
      throw error;
    }
  },
  /**
   * Obtiene el total de ingresos sumando tanto las cuotas como los pagos de consumiciones aprobados
   */
  getTotalIncome: async (): Promise<number> => {
    try {
      // Obtenemos las estadísticas de pagos de cuotas
      const paymentStats = await paymentsService.getPaymentStats();
      
      // Total de cuotas
      const feeTotal = paymentStats.yearlyTotal.total || 0;
      
      // Obtenemos todos los pagos de consumos aprobados
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      // Hacemos la petición con el token explícitamente para asegurar que funciona
      let consumptionTotal = 0;
      try {
        const response = await fetch(`${API_URL}${API_PATH}/consumption-payments?status=aprobado`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        });
        
        if (!response.ok) {
          console.error(`Error al obtener pagos de consumo: ${response.status} ${response.statusText}`);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        paymentsLogger.debug('Respuesta API pagos consumo', { 
          data,
          paymentsCount: data?.payments?.length || 0
        });
        
        // Verificamos que tengamos datos y que tengan la estructura esperada
        if (data && data.payments && Array.isArray(data.payments)) {
          // Sumamos los montos de todos los pagos aprobados
          data.payments.forEach((payment: { amount?: number | string; id?: number | string; user_name?: string }) => {
            if (payment && payment.amount) {
              const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount));
              if (!isNaN(amount)) {
                consumptionTotal += amount;
                paymentsLogger.debug('Pago procesado', { 
                  paymentId: payment.id || 'N/A',
                  amount,
                  userName: payment.user_name || 'N/A'
                });
              }
            }
          });
        } else {
          paymentsLogger.error('Estructura de datos inesperada', { 
            dataType: typeof data,
            isArray: Array.isArray(data) 
          });
        }
      } catch (error) {
        console.error('Error al obtener pagos de consumo:', error);
        // Continuamos con el cálculo aunque falle esta parte
      }      // Convertimos ambos valores a número para asegurarnos que sean sumados y no concatenados
      const feeTotalNum = typeof feeTotal === 'number' ? feeTotal : parseFloat(String(feeTotal));
      const consumptionTotalNum = typeof consumptionTotal === 'number' ? consumptionTotal : parseFloat(String(consumptionTotal));
      
      paymentsLogger.debug('Cálculo de ingresos totales', {
        feeTotalNum,
        consumptionTotalNum,
        totalCombined: feeTotalNum + consumptionTotalNum
      });
      
      // Devolvemos la suma de ambos ingresos como número
      return feeTotalNum + consumptionTotalNum;
    } catch (error) {
      console.error('Error al obtener el total de ingresos:', error);
      throw error;
    }
  },
};
