/**
 * Servicios para gestionar los pagos de consumiciones
 */

import { fetchWithAuth } from './api';

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
    
    const data = await response.json();
    console.log('Respuesta de API de deuda (servicio):', data);
    return data;
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
    console.log('Llamando a /consumption-payments/pending');
    const response = await fetchWithAuth('/consumption-payments/pending');
    
    console.log('Respuesta del servidor:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error del servidor:', error);
      throw new Error(error.error || 'Pago no encontrado');
    }
    
    const data = await response.json();
    console.log('Datos recibidos del servidor:', data);
    
    // La API puede devolver directamente un array o un objeto con propiedad 'payments'
    if (Array.isArray(data)) {
      console.log('Datos son array, devolviendo directamente');
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
