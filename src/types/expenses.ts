// Tipos para el sistema de gastos (pagos realizados por la asociación)

export interface AssociationExpense {
  id: number;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  concept: string;
  category: string | null;
  payment_method: string;
  recipient: string | null;
  reference: string | null;
  attachment_url: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  
  // Campos adicionales que se obtienen de la API
  created_by_name?: string;
}

export interface ExpenseFormData {
  amount: number;
  expense_date: string;
  concept: string;
  category?: string;
  payment_method: string;
  recipient?: string;
  reference?: string;
  attachment_url?: string;
  notes?: string;
}

export interface ExpensesResponse {
  expenses: AssociationExpense[];
  total: number;
  limit: number;
  offset: number;
}

// Tipo para los filtros de gastos
export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseReportResponse {
  expenses: AssociationExpense[];
  totals: {
    count: number;
    total: number;
    category: string;
  }[];
  period: {
    startDate: string;
    endDate: string;
  };
}

// Categorías predefinidas de gastos
export const ExpenseCategories = [
  'Alquiler',
  'Suministros',
  'Mantenimiento',
  'Material',
  'Eventos',
  'Impuestos',
  'Personal',
  'Marketing',
  'Administrativo',
  'Otros'
];
