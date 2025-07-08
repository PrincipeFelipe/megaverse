// Tipos para el sistema de cuotas (pagos realizados por los usuarios)
// Mantenemos el nombre 'Payment' para compatibilidad con el código existente
// pero estos representan "Cuotas" en el nuevo contexto

export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_type: 'normal' | 'maintenance' | 'entrance';
  month: number;
  year: number;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  
  // Campos adicionales que se obtienen de la API
  user_name?: string;
  user_username?: string;
  created_by_name?: string;
}

export interface PaymentFormData {
  user_id: number;
  amount: number;
  payment_date: string;
  payment_type: 'normal' | 'maintenance' | 'entrance';
  month: number;
  year: number;
  payment_method: string;
  reference?: string;
  notes?: string;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaymentStatsResponse {
  monthlyStats: {
    month: number;
    payment_type: string;
    count: number;
    total: number;
  }[];
  yearlyTotal: {
    total: number;
    count: number;
  };
  pendingPayments: {
    id: number;
    name: string;
    username: string;
    pending_months: string;
  }[];
  year: number;
}

// Tipo para los filtros de pagos
export interface PaymentFilters {
  userId?: number;
  month?: number;
  year?: number;
  paymentType?: 'normal' | 'maintenance' | 'all';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaymentReportResponse {
  payments: Payment[];
  totals: {
    count: number;
    total: number;
    payment_type: string;
    users_count: number;
  }[];
  period: {
    startDate: string;
    endDate: string;
  };
}
