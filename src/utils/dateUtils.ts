/**
 * Utilidades para manejar fechas y zonas horarias en la aplicación
 */
import { getHourOffsetForDate, getTimeZoneName, checkDSTIssue } from './dstUtils';
import { createModuleLogger } from './loggerExampleUsage';

// Crear logger para utilidades de fecha
const dateLogger = createModuleLogger('DATE_UTILS');

/**
 * Crea una fecha en UTC a partir de una fecha local.
 * Esto mantiene la misma hora "visual" pero la convierte correctamente a UTC.
 * @param date - Fecha local
 * @returns Fecha ISO en UTC con la misma hora visual
 */
export function createUTCDate(year: number, month: number, day: number, hours: number, minutes: number = 0, seconds: number = 0): string {
  // Crear fecha en UTC directamente
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  return date.toISOString();
}

/**
 * Convierte la fecha local a un formato ISO conservando la hora visual
 * @param date - Fecha local
 * @returns Fecha ISO con la misma hora visual
 */
export function preserveLocalTime(date: Date): string {
  // Obtener los componentes de la fecha local
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() es 0-indexado
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // Crear fecha en UTC con los mismos valores que la fecha local
  return createUTCDate(year, month, day, hours, minutes, seconds);
}

/**
 * Extrae la hora local de una fecha UTC ISO
 * @param isoString - Fecha en formato ISO
 * @returns Objeto Date con la misma hora visual que la fecha ISO
 */
export function extractLocalTime(isoString: string): Date {
  // Convertir la cadena ISO a un objeto Date
  const utcDate = new Date(isoString);
    // Usar las utilidades avanzadas para determinar el offset
  const hourOffset = getHourOffsetForDate(utcDate);
  const tzName = getTimeZoneName(utcDate);
  
  // Crear una nueva fecha con los valores UTC + el offset correspondiente
  const localDate = new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours() + hourOffset, // Añadimos el offset correspondiente
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds()
  );
  
  // Verificar posibles problemas con cambios de horario
  const dstIssue = checkDSTIssue(localDate);
  if (dstIssue.hasPotentialIssue) {
    dateLogger.warn('ADVERTENCIA DST', { message: dstIssue.message });
  }
  
  dateLogger.debug('Extracting local time', { 
    isoString,
    originalUTCHours: utcDate.getUTCHours(),
    adjustedHours: localDate.getHours(),
    offset: hourOffset,
    timezone: tzName
  });
  return localDate;
}

/**
 * Formatea una fecha ISO para mostrarla con hora local
 * @param isoString - Fecha en formato ISO
 * @returns Fecha formateada con la hora local
 */
export function formatLocalTime(isoString: string): string {
  const date = extractLocalTime(isoString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
