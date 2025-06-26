/**
 * Utilidades para validar las reglas de reserva según la configuración
 */
import { Reservation } from '../types';

/**
 * Verifica si un usuario ha alcanzado su límite diario de reservas
 * @param userId ID del usuario
 * @param date Fecha para la cual verificar
 * @param allReservations Todas las reservas existentes
 * @param maxReservationsPerDay Número máximo de reservas permitidas por día
 * @returns Un objeto con el estado de la validación y el número de reservas actuales
 */
export const hasReachedDailyLimit = (
  userId: number, 
  date: Date,
  allReservations: Reservation[],
  maxReservationsPerDay: number
): { hasReached: boolean, currentCount: number } => {
  // Si el límite es 0, no hay restricción
  if (maxReservationsPerDay === 0) return { hasReached: false, currentCount: 0 };
  
  // Normalizar la fecha para comparar solo año, mes y día
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // Contar cuántas reservas activas tiene el usuario para este día
  const reservationsToday = allReservations.filter(reservation => {
    // Solo considerar reservas activas
    if (reservation.status !== 'active') return false;
    
    // Solo considerar reservas del usuario actual
    if (reservation.user_id !== userId) return false;
    
    // Comparar la fecha (sin hora)
    const reservationDate = new Date(reservation.start_time);
    reservationDate.setHours(0, 0, 0, 0);
    
    return reservationDate.getTime() === targetDate.getTime();
  });
  
  const currentCount = reservationsToday.length;
  const hasReached = currentCount >= maxReservationsPerDay;
  
  return { hasReached, currentCount };
};

/**
 * Verifica si una reserva cumple con la restricción de horas mínimas de antelación
 * @param startDate Fecha y hora de inicio de la reserva
 * @param minHoursInAdvance Horas mínimas requeridas de antelación
 * @returns Verdadero si cumple con la restricción, falso en caso contrario
 */
export const hasMinimumAdvanceTime = (
  startDate: Date,
  minHoursInAdvance: number
): boolean => {
  // Si no hay restricción de antelación, siempre válido
  if (minHoursInAdvance <= 0) return true;
  
  const now = new Date();
  const diffMs = startDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours >= minHoursInAdvance;
};
