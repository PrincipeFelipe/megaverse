/**
 * Servicios para gestionar los pagos de consumiciones
 */

import { fetchWithAuth } from './api';
import { createModuleLogger } from '../utils/loggerExampleUsage';

// Crear logger para el servicio de pagos de consumo
const consumptionPaymentsLogger = createModuleLogger('CONSUMPTION_PAYMENTS');

// Tipos para los pagos de consumiciones
export interface ConsumptionPayment {
  id: number;
  user_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'efectivo' | 'transferencia' | 'bizum';
  reference_number?: string;
  notes?: string;
  status?: 'pendiente' | 'aprobado' | 'rechazado';
  rejection_reason?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  user_name?: string;
  user_username?: string;
  created_by_name?: string;
  consumption_ids?: number[]; // Añadimos esta propiedad para los nuevos pagos
}

// Interfaz para el consumo
export interface Consumption {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  created_at: string;
  product_name: string;
  paid: number; // 0: not paid, 1: pending approval, 2: paid
}

// Interfaz para la respuesta de consumos no pagados
export interface UnpaidConsumptionsResponse {
  consumptions: Consumption[];
  totals: {
    unpaid: number;
    processing: number;
    total: number;
  };
}

export interface DebtTotals {
  unpaid: number;
  pendingApproval: number;
  total: number;
}

export interface DebtInfoResponse {
  balance?: number | string;
  currentDebt: number | string | DebtTotals;
  paymentHistory: ConsumptionPayment[];
}

export interface DebtInfo {
  currentDebt: number;
  paymentHistory: ConsumptionPayment[];
}

export interface PaymentFilters {
  userId?: number;
  startDate?: string;
  endDate?: string;
  status?: 'pendiente' | 'aprobado' | 'rechazado' | '';
  limit?: number;
  offset?: number;
}

export interface PaymentResponse {
  message: string;
  payment: ConsumptionPayment;
  newBalance: number;
  remainingDebt: number;
}

export interface PaymentHistoryResponse {
  payments: ConsumptionPayment[];
  total: number;
  limit: number;
  offset: number;
}

export interface UpdatePaymentResponse {
  message: string;
  payment: ConsumptionPayment;
}

export const consumptionPaymentsService = {  // Obtener la deuda actual del usuario
  getUserDebt: async (userId?: number): Promise<DebtInfo> => {
    const url = userId 
      ? `/consumption-payments/debt/${userId}`
      : `/consumption-payments/debt`;
      
    const response = await fetchWithAuth(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener la deuda del usuario');
    }
    
    const data = await response.json() as DebtInfoResponse;
    consumptionPaymentsLogger.debug('Respuesta de API de deuda (servicio)', { 
      hasData: !!data,
      hasCurrentDebt: !!data.currentDebt 
    });
    
    // Normalizar la estructura de la respuesta
    let currentDebt = 0;
    
    if (typeof data.currentDebt === 'number') {
      currentDebt = data.currentDebt;
    } else if (typeof data.currentDebt === 'string' && !isNaN(parseFloat(data.currentDebt))) {
      currentDebt = parseFloat(data.currentDebt);
    } else if (data.currentDebt && typeof data.currentDebt === 'object' && 'total' in data.currentDebt) {
      // Si es un objeto como {unpaid: X, pendingApproval: Y, total: Z}
      currentDebt = typeof data.currentDebt.total === 'number' ? 
        data.currentDebt.total : 
        parseFloat(String(data.currentDebt.total) || '0');
    }
    
    const normalizedData: DebtInfo = {
      currentDebt: currentDebt,
      paymentHistory: data.paymentHistory || []
    };
    
    consumptionPaymentsLogger.debug('Datos de deuda normalizados', { 
      currentDebt,
      paymentHistoryCount: normalizedData.paymentHistory.length 
    });
    return normalizedData;
  },
    // Registrar un nuevo pago de consumiciones
  createPayment: async (paymentData: {
    userId?: number;
    amount: number;
    paymentMethod: 'efectivo' | 'transferencia' | 'bizum';
    referenceNumber?: string;
    notes?: string;
    isRetry?: boolean;
  }): Promise<PaymentResponse> => {
    const response = await fetchWithAuth('/consumption-payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)    });
      if (!response.ok) {
        // Para errores del servidor, mostrar un mensaje genérico
        if (response.status >= 500) {
          throw new Error('Error del servidor al registrar el pago');
        }
        
        // Para otros errores, intentar obtener el mensaje específico
        try {
          const error = await response.json();
          throw new Error(error.error || 'Error al registrar el pago');
        } catch {
          // Si falla el parsing del JSON, mostrar un mensaje genérico
          throw new Error('Error desconocido al registrar el pago');
      }
    }
    
    return response.json();
  },
  
  // Obtener historial de pagos
  getPaymentHistory: async (filters: PaymentFilters = {}): Promise<PaymentHistoryResponse> => {
    const { userId, startDate, endDate, status, limit, offset } = filters;
    
    // Construir query string
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId.toString());
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    
    const queryString = queryParams.toString();
    const url = `/consumption-payments${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithAuth(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener historial de pagos');
    }
    
    return response.json();
  },
  
  // Obtener consumos no pagados de un usuario
  getUnpaidConsumptions: async (userId: number): Promise<UnpaidConsumptionsResponse> => {
    const response = await fetchWithAuth(`/consumptions/unpaid/${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ruta no encontrada');
    }
    
    return response.json();
  },
  
  // Crear un nuevo pago con detalle de consumos
  createConsumptionPayment: async (paymentData: {
    user_id: number;
    amount: number;
    payment_method: string;
    reference: string;
    consumption_ids: number[];
  }): Promise<PaymentResponse> => {
    // Adaptar los nombres de las propiedades para que coincidan con lo que espera el backend
    const adaptedData = {
      userId: paymentData.user_id,
      amount: paymentData.amount,
      paymentMethod: paymentData.payment_method,
      referenceNumber: paymentData.reference,
      consumptionIds: paymentData.consumption_ids
    };
    
    console.log('Enviando datos adaptados al backend:', adaptedData);
    
    const response = await fetchWithAuth('/consumption-payments', {
      method: 'POST',
      body: JSON.stringify(adaptedData)
    });
    
    console.log('Respuesta del servidor:', response.status, response.statusText);
    
    if (!response.ok) {
      // Para errores del servidor, mostrar un mensaje genérico
      if (response.status >= 500) {
        throw new Error('Error del servidor al registrar el pago');
      }
      
      // Para otros errores, intentar obtener el mensaje específico
      try {
        const error = await response.json();
        throw new Error(error.error || 'Error al registrar el pago');
      } catch {
        // Si falla el parsing del JSON, mostrar un mensaje genérico
        throw new Error('Error desconocido al registrar el pago');
      }
    }
    
    return response.json();
  },
  
  // Aprobar un pago pendiente
  approvePayment: async (paymentId: number): Promise<PaymentResponse> => {
    const response = await fetchWithAuth(`/consumption-payments/${paymentId}/approve`, {
      method: 'PUT'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aprobar el pago');
    }
    
    return response.json();
  },
  
  // Rechazar un pago pendiente
  rejectPayment: async (paymentId: number, reason: string): Promise<PaymentResponse> => {
    const response = await fetchWithAuth(`/consumption-payments/${paymentId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason: reason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al rechazar el pago');
    }
    
    return response.json();
  },
  
  // Obtener todos los consumos no pagados (solo admin)
  getAllUnpaidConsumptions: async (): Promise<UnpaidConsumptionsResponse | Consumption[]> => {
    const response = await fetchWithAuth('/consumptions/all-unpaid');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener todos los consumos no pagados');
    }
    
    return response.json();
  },

  // Obtener pagos pendientes (para administradores)
  getPendingPayments: async (): Promise<ConsumptionPayment[]> => {
    consumptionPaymentsLogger.debug('Llamando a /consumption-payments/pending');
    const response = await fetchWithAuth('/consumption-payments/pending');
    
    consumptionPaymentsLogger.debug('Respuesta del servidor', { 
      status: response.status,
      statusText: response.statusText 
    });
    
    if (!response.ok) {
      const error = await response.json();
      consumptionPaymentsLogger.error('Error del servidor', { error });
      throw new Error(error.error || 'Pago no encontrado');
    }
    
    const data = await response.json();
    consumptionPaymentsLogger.debug('Datos recibidos del servidor', { 
      isArray: Array.isArray(data),
      dataType: typeof data,
      count: Array.isArray(data) ? data.length : 'N/A'
    });
    
    // La API puede devolver directamente un array o un objeto con propiedad 'payments'
    if (Array.isArray(data)) {
      consumptionPaymentsLogger.debug('Datos son array, devolviendo directamente');
      return data;
    } else if (data && Array.isArray(data.payments)) {
      console.log('Datos tienen propiedad payments, devolviendo data.payments');
      return data.payments;
    } else {
      console.warn('Formato de respuesta inesperado en getPendingPayments:', data);
      return [];
    }
  },
  
  // Obtener detalles de un pago específico
  getPaymentDetails: async (paymentId: number): Promise<{
    payment: ConsumptionPayment;
    consumptions: Consumption[];
  }> => {
    const response = await fetchWithAuth(`/consumption-payments/${paymentId}/details`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener detalles del pago');
    }
    
    return response.json();
  },
  
  // Reintentar un pago rechazado
  retryPayment: async (paymentId: number, paymentData: {
    paymentMethod: 'efectivo' | 'transferencia' | 'bizum';
    referenceNumber?: string;
    notes?: string;
  }): Promise<PaymentResponse> => {
    const response = await fetchWithAuth(`/consumption-payments/${paymentId}/retry`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      // Para errores del servidor, mostrar un mensaje genérico
      if (response.status >= 500) {
        throw new Error('Error del servidor al reintentar el pago');
      }
      
      // Para otros errores, intentar obtener el mensaje específico
      try {
        const error = await response.json();
        throw new Error(error.error || 'Error al reintentar el pago');
      } catch {
        // Si falla el parsing del JSON, mostrar un mensaje genérico
        throw new Error('Error desconocido al reintentar el pago');
      }
    }
    
    return response.json();
  }
};
