// Tipos para la configuración del sistema de reservas y cuotas
export interface ReservationConfig {
  id: number;
  
  // Configuración de reservas
  max_hours_per_reservation: number;
  max_reservations_per_user_per_day: number;
  min_hours_in_advance: number;
  allowed_start_time: string; // Formato HH:MM (ej: "08:00")
  allowed_end_time: string;   // Formato HH:MM (ej: "22:00")
  requires_approval_for_all_day: boolean;
  
  // Configuración de cuotas
  normal_fee: number;       // Cuota mensual normal (€)
  maintenance_fee: number;  // Cuota mensual de mantenimiento (€)
  
  created_at?: string;
  updated_at?: string;
}

// Tipo para la respuesta de la API al actualizar la configuración
export interface ConfigResponse {
  config: ReservationConfig;
  message: string;
}
