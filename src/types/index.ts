export type { ReservationConfig, ConfigResponse } from './configuration';
export type { 
  Payment, 
  PaymentFormData,
  PaymentsResponse,
  PaymentStatsResponse,
  PaymentFilters,
  PaymentReportResponse
} from './payments';
export type {
  Document,
  DocumentCategory,
  DocumentFilters
} from './documents';

// Importar ReservationConfig para poder utilizarlo en la extensión de Window
import { ReservationConfig } from './configuration';

// Extender la interfaz de Window para incluir la configuración global
declare global {
  interface Window {
    reservationConfig?: ReservationConfig;
  }
}

// Definición y exportación explícita de la interfaz User
export interface User {
  id: number;
  name: string;
  username: string;
  email: string; // Mantenemos el email para compatibilidad pero ahora es opcional
  role: 'admin' | 'user';
  createdAt: string;
  membership_date?: string; // Fecha desde la que es miembro
  phone?: string; // Número de teléfono
  avatar_url?: string; // URL de la imagen de avatar
  balance: number; // Saldo del usuario
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface Consumption {
  id: number;
  user_id: number;
  product_id: number;
  product_name: string;
  user_name?: string;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface Table {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  user_name: string;
  table_id: number;
  table_name: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'cancelled' | 'completed';
  created_at?: string;
  updated_at?: string;
  duration_hours: number;
  num_members: number;
  num_guests: number;
  all_day: boolean;
  reason?: string;
  approved?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, username: string, email: string, phone: string, dni: string, password: string) => Promise<boolean>;
  loading: boolean;
  updateUserData: () => Promise<User>;
}