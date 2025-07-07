import { ReservationConfig, ConfigResponse } from '../types';
import { normalizeNumericValues } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';
const API_PATH = '';

// Configuración API

export const configService = {
  /**
   * Obtiene la configuración actual del sistema de reservas
   * @returns Configuración actual
   */  getConfig: async (): Promise<ReservationConfig> => {
    try {
      const response = await fetch(`${API_URL}${API_PATH}/config/reservation`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return normalizeNumericValues(data.config);
    } catch (error) {
      console.error('Error al obtener la configuración de reservas:', error);      // Devolver una configuración por defecto en caso de error
      return {
        id: 1,
        max_hours_per_reservation: 4,
        max_reservations_per_user_per_day: 1,
        min_hours_in_advance: 0,
        allowed_start_time: '08:00',
        allowed_end_time: '22:00',
        requires_approval_for_all_day: true,
        allow_consecutive_reservations: true,
        min_time_between_reservations: 30,
        normal_fee: 30,
        maintenance_fee: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },
    /**
   * Actualiza la configuración del sistema de reservas
   * @param configData Datos de configuración a actualizar
   * @returns Respuesta con la configuración actualizada
   */  updateConfig: async (configData: Partial<ReservationConfig>): Promise<ConfigResponse> => {
    try {
      // Log para depuración
      console.log('Datos enviados al servidor:', configData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para actualizar la configuración');
      }
      
      const response = await fetch(`${API_URL}${API_PATH}/config/reservation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return {
        config: normalizeNumericValues(data.config),
        message: data.message || 'Configuración actualizada correctamente'
      };
    } catch (error) {
      console.error('Error al actualizar la configuración de reservas:', error);
      throw error;
    }
  }
};
