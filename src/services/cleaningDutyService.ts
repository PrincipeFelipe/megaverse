/**
 * Servicio para gestionar el sistema de turnos de limpieza
 */

import { fetchWithAuth, normalizeNumericValues } from './api';

// Interfaces para los datos
export interface CleaningConfig {
  id: number;
  users_per_week: number;
  rotation_complete: boolean;
  last_assignment_date: string;
  created_at: string;
  updated_at: string;
}

export interface CleaningAssignment {
  id: number;
  user_id: number;
  name: string;
  email: string;
  week_start_date: string;
  week_end_date: string;
  status: 'pending' | 'completed' | 'missed';
  feedback?: string;
}

export interface CleaningExemption {
  id: number;
  user_id: number;
  name: string;
  email: string;
  start_date: string;
  end_date?: string;
  reason: string;
  is_permanent: boolean;
  created_at: string;
  updated_at: string;
}

// Definición de un tipo para las asignaciones generadas
export interface NewAssignment {
  userId: number;
  name: string;
  weekStartDate: string;
  weekEndDate: string;
}

export const cleaningDutyService = {
  // Obtener configuración del sistema de limpieza
  getConfig: async (): Promise<CleaningConfig> => {
    const response = await fetchWithAuth('/api/cleaning-duty/config');
    return normalizeNumericValues(await response.json());
  },
  
  // Actualizar configuración del sistema de limpieza
  updateConfig: async (config: { usersPerWeek: number; rotationComplete?: boolean; }): Promise<void> => {
    await fetchWithAuth('/api/cleaning-duty/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  },
  
  // Obtener asignaciones de limpieza actuales
  getCurrentAssignments: async (): Promise<CleaningAssignment[]> => {
    const response = await fetchWithAuth('/api/cleaning-duty/current');
    return normalizeNumericValues(await response.json());
  },
  
  // Obtener historial de asignaciones de limpieza
  getHistory: async (): Promise<CleaningAssignment[]> => {
    const response = await fetchWithAuth('/api/cleaning-duty/history');
    return normalizeNumericValues(await response.json());
  },
  
  // Obtener historial de limpieza de un usuario específico
  getUserHistory: async (userId: number): Promise<CleaningAssignment[]> => {
    const response = await fetchWithAuth(`/api/cleaning-duty/user/${userId}`);
    return normalizeNumericValues(await response.json());
  },
  
  // Actualizar estado de una asignación de limpieza
  updateStatus: async (
    assignmentId: number, 
    data: { status: 'pending' | 'completed' | 'missed'; feedback?: string; }
  ): Promise<void> => {
    await fetchWithAuth(`/api/cleaning-duty/status/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  // Asignar turnos de limpieza para la próxima semana
  assignCleaningDuty: async (): Promise<{ message: string; assignments: NewAssignment[]; }> => {
    const response = await fetchWithAuth('/api/cleaning-duty/assign', {
      method: 'POST',
      body: JSON.stringify({})
    });
    return normalizeNumericValues(await response.json());
  },
  
  // Obtener todas las exenciones de limpieza
  getExemptions: async (): Promise<CleaningExemption[]> => {
    const response = await fetchWithAuth('/api/cleaning-duty/exemptions');
    return normalizeNumericValues(await response.json());
  },
  
  // Añadir una exención de limpieza
  addExemption: async (exemption: {
    userId: number;
    startDate: string;
    endDate?: string;
    reason: string;
    isPermanent?: boolean;
  }): Promise<{ message: string; exemptionId: number; }> => {
    const response = await fetchWithAuth('/api/cleaning-duty/exemptions', {
      method: 'POST',
      body: JSON.stringify(exemption)
    });
    return normalizeNumericValues(await response.json());
  },
  
  // Eliminar una exención de limpieza
  deleteExemption: async (exemptionId: number): Promise<void> => {
    await fetchWithAuth(`/api/cleaning-duty/exemptions/${exemptionId}`, {
      method: 'DELETE'
    });
  }
};
