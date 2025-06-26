/**
 * Test unitarios para las utilidades DST
 * 
 * Ejecutar con: npx jest dst-utils.test.ts
 */

import { 
  isDaylightSavingTime, 
  getHourOffsetForDate, 
  getTimeZoneName,
  getNextDSTTransition,
  isNearDSTTransition,
  checkDSTIssue
} from '../src/utils/dstUtils';

// Fechas de prueba específicas
const winterDate = new Date(2025, 0, 15); // 15 de enero, invierno, CET
const summerDate = new Date(2025, 6, 15); // 15 de julio, verano, CEST
const springTransitionEve = new Date(2025, 2, 29); // 29 de marzo, día antes del cambio
const springTransitionDay = new Date(2025, 2, 30); // 30 de marzo, día del cambio
const fallTransitionEve = new Date(2025, 9, 25); // 25 de octubre, día antes del cambio
const fallTransitionDay = new Date(2025, 9, 26); // 26 de octubre, día del cambio

// Crear fechas con horas específicas
const createDateWithTime = (baseDate: Date, hours: number, minutes: number = 0): Date => {
  const newDate = new Date(baseDate);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

describe('isDaylightSavingTime', () => {
  test('debe detectar correctamente horario de verano (CEST)', () => {
    expect(isDaylightSavingTime(summerDate)).toBe(true);
  });
  
  test('debe detectar correctamente horario de invierno (CET)', () => {
    expect(isDaylightSavingTime(winterDate)).toBe(false);
  });
});

describe('getHourOffsetForDate', () => {
  test('debe devolver offset 2 para fechas en horario de verano', () => {
    expect(getHourOffsetForDate(summerDate)).toBe(2);
  });
  
  test('debe devolver offset 1 para fechas en horario de invierno', () => {
    expect(getHourOffsetForDate(winterDate)).toBe(1);
  });
});

describe('getTimeZoneName', () => {
  test('debe devolver CEST para fechas en horario de verano', () => {
    expect(getTimeZoneName(summerDate)).toBe('CEST');
  });
  
  test('debe devolver CET para fechas en horario de invierno', () => {
    expect(getTimeZoneName(winterDate)).toBe('CET');
  });
});

describe('getNextDSTTransition', () => {
  test('desde invierno, debe calcular correctamente el próximo inicio de DST', () => {
    const nextSpringTransition = getNextDSTTransition(winterDate, false);
    expect(nextSpringTransition.getMonth()).toBe(2); // marzo
    expect(nextSpringTransition.getDate()).toBeGreaterThan(24); // último domingo
    expect(nextSpringTransition.getDate()).toBeLessThan(32); // de marzo
  });
  
  test('desde verano, debe calcular correctamente el próximo fin de DST', () => {
    const nextFallTransition = getNextDSTTransition(summerDate, true);
    expect(nextFallTransition.getMonth()).toBe(9); // octubre
    expect(nextFallTransition.getDate()).toBeGreaterThan(24); // último domingo
    expect(nextFallTransition.getDate()).toBeLessThan(32); // de octubre
  });
});

describe('isNearDSTTransition', () => {
  test('debe identificar fechas cercanas a transición de primavera', () => {
    const result = isNearDSTTransition(springTransitionEve, 3);
    expect(result.isNear).toBe(true);
    expect(result.isSpringTransition).toBe(true);
    expect(result.daysUntil).toBeLessThanOrEqual(3);
  });
  
  test('debe identificar fechas cercanas a transición de otoño', () => {
    const result = isNearDSTTransition(fallTransitionEve, 3);
    expect(result.isNear).toBe(true);
    expect(result.isSpringTransition).toBe(false);
    expect(result.daysUntil).toBeLessThanOrEqual(3);
  });
  
  test('debe devolver falso para fechas no cercanas a transiciones', () => {
    const midWinterDate = new Date(2025, 1, 15); // 15 de febrero
    const midSummerDate = new Date(2025, 7, 15); // 15 de agosto
    
    expect(isNearDSTTransition(midWinterDate, 3).isNear).toBe(false);
    expect(isNearDSTTransition(midSummerDate, 3).isNear).toBe(false);
  });
});

describe('checkDSTIssue', () => {
  test('debe identificar horas no existentes en transición de primavera', () => {
    // 30 de marzo a las 2:30 AM (no existe esta hora en el día del cambio)
    const nonExistentHour = createDateWithTime(springTransitionDay, 2, 30);
    const result = checkDSTIssue(nonExistentHour);
    
    expect(result.hasPotentialIssue).toBe(true);
    expect(result.issueType).toBe('non-existent-hour');
  });
  
  test('debe identificar horas ambiguas en transición de otoño', () => {
    // 26 de octubre a las 2:30 AM (hora ambigua, se repite)
    const ambiguousHour = createDateWithTime(fallTransitionDay, 2, 30);
    const result = checkDSTIssue(ambiguousHour);
    
    expect(result.hasPotentialIssue).toBe(true);
    expect(result.issueType).toBe('ambiguous-hour');
  });
  
  test('debe indicar que no hay problemas para horas normales', () => {
    // Una hora normal sin problemas
    const normalHour1 = createDateWithTime(winterDate, 14, 0); // 14:00
    const normalHour2 = createDateWithTime(summerDate, 14, 0); // 14:00
    
    expect(checkDSTIssue(normalHour1).hasPotentialIssue).toBe(false);
    expect(checkDSTIssue(normalHour2).hasPotentialIssue).toBe(false);
  });
});
