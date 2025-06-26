/**
 * Utilidades avanzadas para manejar fechas y zonas horarias en la aplicación
 * Enfocado especialmente en la detección robusta de horarios de verano/invierno
 */

/**
 * Determina si una fecha dada está en horario de verano (DST)
 * @param date - Fecha a evaluar
 * @returns true si está en horario de verano, false si está en horario de invierno
 */
export function isDaylightSavingTime(date: Date): boolean {
  // Obtenemos la fecha de enero y julio para determinar el offset estándar
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  
  // El offset estándar es el mayor entre enero y julio (en minutos)
  // getTimezoneOffset devuelve minutos, valores más pequeños = zona horaria más al este
  const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  
  // Si el offset actual es menor que el estándar, estamos en horario de verano
  return date.getTimezoneOffset() < stdTimezoneOffset;
}

/**
 * Calcula el offset horario que debe aplicarse según la fecha
 * @param date - Fecha a evaluar
 * @returns Número de horas a añadir (1 para CET, 2 para CEST)
 */
export function getHourOffsetForDate(date: Date): number {
  return isDaylightSavingTime(date) ? 2 : 1;
}

/**
 * Devuelve el nombre de la zona horaria para una fecha
 * @param date - Fecha a evaluar
 * @returns Nombre de la zona horaria (CET o CEST)
 */
export function getTimeZoneName(date: Date): string {
  return isDaylightSavingTime(date) ? 'CEST' : 'CET';
}

/**
 * Calcula la próxima fecha de cambio de horario
 * @param date - Fecha de referencia
 * @param getEnd - Si es true, devuelve la fecha del próximo fin de DST, si es false, la del inicio
 * @returns Fecha del próximo cambio de DST
 */
export function getNextDSTTransition(date: Date, getEnd: boolean = false): Date {
  const currentYear = date.getFullYear();
  const isDST = isDaylightSavingTime(date);
  
  // Si estamos buscando la fecha de fin de DST y ya estamos en horario estándar,
  // o si estamos buscando la fecha de inicio de DST y ya estamos en DST,
  // entonces buscamos el cambio del próximo año
  const year = (getEnd && !isDST) || (!getEnd && isDST) ? currentYear + 1 : currentYear;
  
  if (getEnd) {
    // Buscar el último domingo de octubre (fin del DST)
    let endDate = new Date(year, 9, 31); // 31 de octubre
    while (endDate.getDay() !== 0) { // 0 = domingo
      endDate.setDate(endDate.getDate() - 1);
    }
    endDate.setHours(3, 0, 0, 0); // A las 3:00 (hora local CEST)
    return endDate;
  } else {
    // Buscar el último domingo de marzo (inicio del DST)
    let startDate = new Date(year, 2, 31); // 31 de marzo
    while (startDate.getDay() !== 0) { // 0 = domingo
      startDate.setDate(startDate.getDate() - 1);
    }
    startDate.setHours(2, 0, 0, 0); // A las 2:00 (hora local CET)
    return startDate;
  }
}

/**
 * Comprueba si una fecha está cerca de una transición de DST
 * @param date - Fecha a comprobar
 * @param daysThreshold - Número de días considerados "cerca"
 * @returns Objeto con información sobre la proximidad a una transición
 */
export function isNearDSTTransition(date: Date, daysThreshold: number = 3): { 
  isNear: boolean; 
  transitionDate?: Date; 
  daysUntil?: number; 
  isSpringTransition?: boolean;
} {
  // Obtener las próximas fechas de transición
  const nextSpringTransition = getNextDSTTransition(date, false);
  const nextFallTransition = getNextDSTTransition(date, true);
  
  // Calcular diferencias en días
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilSpring = Math.abs((nextSpringTransition.getTime() - date.getTime()) / msPerDay);
  const daysUntilFall = Math.abs((nextFallTransition.getTime() - date.getTime()) / msPerDay);
  
  // Determinar cuál está más cerca
  if (daysUntilSpring <= daysUntilFall && daysUntilSpring <= daysThreshold) {
    return {
      isNear: true,
      transitionDate: nextSpringTransition,
      daysUntil: Math.floor(daysUntilSpring),
      isSpringTransition: true
    };
  } else if (daysUntilFall <= daysThreshold) {
    return {
      isNear: true,
      transitionDate: nextFallTransition,
      daysUntil: Math.floor(daysUntilFall),
      isSpringTransition: false
    };
  }
  
  return { isNear: false };
}

/**
 * Verifica si una hora específica puede ser problemática durante una transición DST
 * @param date - Fecha a verificar
 * @returns Objeto con información del problema, si existe
 */
export function checkDSTIssue(date: Date): {
  hasPotentialIssue: boolean;
  issueType?: 'non-existent-hour' | 'ambiguous-hour';
  message?: string;
} {
  // Verificar cercanía a una transición
  const transitionCheck = isNearDSTTransition(date, 0); // Solo el mismo día
  
  // Si no está cerca, no hay problema
  if (!transitionCheck.isNear) {
    return { hasPotentialIssue: false };
  }
  
  // En transición de primavera, las horas entre 2:00 y 3:00 no existen
  if (transitionCheck.isSpringTransition && 
      date.getHours() >= 2 && date.getHours() < 3) {
    return {
      hasPotentialIssue: true,
      issueType: 'non-existent-hour',
      message: 'Esta hora no existe debido al cambio a horario de verano'
    };
  }
  
  // En transición de otoño, las horas entre 2:00 y 3:00 son ambiguas (se repiten)
  if (!transitionCheck.isSpringTransition && 
      date.getHours() >= 2 && date.getHours() < 3) {
    return {
      hasPotentialIssue: true,
      issueType: 'ambiguous-hour',
      message: 'Esta hora es ambigua debido al cambio a horario de invierno'
    };
  }
  
  return { hasPotentialIssue: false };
}
