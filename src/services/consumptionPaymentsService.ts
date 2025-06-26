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
  
  // Aprobar un pago de consumiciones
  approvePayment: async (id: number): Promise<UpdatePaymentResponse> => {
    const response = await fetchWithAuth(`/consumption-payments/${id}/approve`, {
      method: 'PUT'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aprobar el pago');
    }
    
    return response.json();
  },
  
  // Rechazar un pago de consumiciones
  rejectPayment: async (id: number, rejectionReason: string): Promise<UpdatePaymentResponse> => {
    const response = await fetchWithAuth(`/consumption-payments/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al rechazar el pago');
    }
    
    return response.json();
  },
    // Obtener detalles de un pago específico
  getPaymentDetails: async (id: number): Promise<ConsumptionPayment> => {
    const response = await fetchWithAuth(`/consumption-payments/${id}`);
    
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
