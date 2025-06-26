/**
 * Test unitarios para las funciones de dateUtils
 * 
 * Ejecutar con: npx jest date-utils.test.ts
 */

import {
  extractLocalTime,
  preserveLocalTime,
  formatLocalTime,
  createUTCDate
} from '../src/utils/dateUtils';

// Mock de las funciones dstUtils para control de pruebas
jest.mock('../src/utils/dstUtils', () => ({
  getHourOffsetForDate: (date: Date) => {
    // Simular offset basado en el mes
    // Invierno: enero-febrero, noviembre-diciembre (CET, +1)
    // Verano: marzo-octubre (CEST, +2)
    const month = date.getMonth();
    return (month >= 2 && month <= 9) ? 2 : 1;
  },
  getTimeZoneName: (date: Date) => {
    const month = date.getMonth();
    return (month >= 2 && month <= 9) ? 'CEST' : 'CET';
  },
  checkDSTIssue: () => ({ hasPotentialIssue: false })
}));

describe('createUTCDate', () => {
  test('debe crear una fecha UTC correcta', () => {
    const isoDate = createUTCDate(2025, 6, 15, 14, 30, 0);
    const date = new Date(isoDate);
    
    expect(date.getUTCFullYear()).toBe(2025);
    expect(date.getUTCMonth()).toBe(5); // 0-indexed (junio)
    expect(date.getUTCDate()).toBe(15);
    expect(date.getUTCHours()).toBe(14);
    expect(date.getUTCMinutes()).toBe(30);
  });
});

describe('preserveLocalTime', () => {
  test('debe preservar la hora visual seleccionada', () => {
    // Crear fecha local: 15 de junio de 2025, 14:30
    const localDate = new Date(2025, 5, 15, 14, 30);
    const isoDate = preserveLocalTime(localDate);
    
    // La hora UTC en el string ISO debe ser la misma que la hora local
    const utcDate = new Date(isoDate);
    expect(utcDate.getUTCHours()).toBe(14);
    expect(utcDate.getUTCMinutes()).toBe(30);
  });
});

describe('extractLocalTime', () => {
  test('debe extraer correctamente hora local en verano (CEST)', () => {
    // Fecha ISO que representa 15 de junio de 2025, 14:30 UTC
    const isoDate = '2025-06-15T14:30:00.000Z';
    const localDate = extractLocalTime(isoDate);
    
    // En verano (CEST, UTC+2), 14:30 UTC se muestra como 16:30
    expect(localDate.getHours()).toBe(16);
    expect(localDate.getMinutes()).toBe(30);
  });
  
  test('debe extraer correctamente hora local en invierno (CET)', () => {
    // Fecha ISO que representa 15 de enero de 2025, 14:30 UTC
    const isoDate = '2025-01-15T14:30:00.000Z';
    const localDate = extractLocalTime(isoDate);
    
    // En invierno (CET, UTC+1), 14:30 UTC se muestra como 15:30
    expect(localDate.getHours()).toBe(15);
    expect(localDate.getMinutes()).toBe(30);
  });
  
  test('debe preservar la hora visual después de ida y vuelta', () => {
    // Hora original: 13:00 (hora local)
    const originalDate = new Date(2025, 5, 15, 13, 0); // 15 de junio, 13:00
    
    // Convertir a ISO (como se guardaría en BD)
    const isoDate = preserveLocalTime(originalDate);
    
    // Extraer de nuevo para mostrar en UI
    const extractedDate = extractLocalTime(isoDate);
    
    // La hora visual debe ser la misma que la original
    expect(extractedDate.getHours()).toBe(originalDate.getHours());
    expect(extractedDate.getMinutes()).toBe(originalDate.getMinutes());
  });
});

describe('formatLocalTime', () => {
  test('debe formatear correctamente la hora local', () => {
    // 14:30 UTC en verano se muestra como 16:30 local
    expect(formatLocalTime('2025-06-15T14:30:00.000Z')).toBe('16:30');
    
    // 14:30 UTC en invierno se muestra como 15:30 local
    expect(formatLocalTime('2025-01-15T14:30:00.000Z')).toBe('15:30');
    
    // Debe añadir ceros a la izquierda para formato uniforme
    expect(formatLocalTime('2025-06-15T08:05:00.000Z')).toBe('10:05');
  });
});
