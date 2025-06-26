/**
 * Script de validación de la solución para el problema de zona horaria
 * 
 * Este script verifica que la solución implementada funciona
 * correctamente en diferentes escenarios, tanto en horario de
 * verano (CEST, UTC+2) como en horario de invierno (CET, UTC+1)
 */

import { logDateDetails } from '../utils/dateUtils.js';

/**
 * Determina si una fecha está en horario de verano
 * @param {Date} date - La fecha a comprobar
 * @returns {boolean} - True si está en horario de verano, false si no
 */
function isDaylightSavingTime(date) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return date.getTimezoneOffset() < stdTimezoneOffset;
}

/**
 * Extrae la hora local de una fecha UTC ISO con detección automática de horario de verano
 * @param {string} isoString - Fecha en formato ISO
 * @returns {Date} - Objeto Date con la hora visual correcta
 */
function extractLocalTime(isoString) {
  const utcDate = new Date(isoString);
  
  // Determinar si es horario de verano o invierno
  const isDST = isDaylightSavingTime(utcDate);
  const hourOffset = isDST ? 2 : 1; // +2 para CEST (verano), +1 para CET (invierno)
  
  // Crear una fecha local con el offset correspondiente
  const localDate = new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours() + hourOffset,
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds()
  );
  
  return localDate;
}

/**
 * Preserva la hora visual local al convertir a formato ISO
 * @param {Date} date - Fecha local
 * @returns {string} - Fecha ISO que preserva la misma hora visual
 */
function preserveLocalTime(date) {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  )).toISOString();
}

/**
 * Formatea una hora para mostrarla
 * @param {Date} date - La fecha a formatear
 * @returns {string} - Hora formateada (HH:MM)
 */
function formatHour(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Valida un escenario específico
 * @param {string} name - Nombre del escenario
 * @param {string} startISO - Hora de inicio en ISO
 * @param {string} endISO - Hora de fin en ISO  
 * @param {number} expectedStartHour - Hora de inicio esperada
 * @param {number} expectedEndHour - Hora de fin esperada
 * @returns {boolean} - True si el escenario pasa la validación
 */
function validateScenario(name, startISO, endISO, expectedStartHour, expectedEndHour) {
  console.log(`\n🧪 ESCENARIO: ${name}`);
  console.log(`Fechas ISO (como en BD):`);
  console.log(`- Inicio: ${startISO}`);
  console.log(`- Fin: ${endISO}`);
  
  // Extraer fechas locales
  const extractedStart = extractLocalTime(startISO);
  const extractedEnd = extractLocalTime(endISO);
  
  // Mostrar resultados
  console.log(`\nFechas extraídas (como se muestran en UI):`);
  console.log(`- Inicio: ${formatHour(extractedStart)} (esperado: ${String(expectedStartHour).padStart(2, '0')}:00)`);
  console.log(`- Fin: ${formatHour(extractedEnd)} (esperado: ${String(expectedEndHour).padStart(2, '0')}:00)`);
  
  // Verificar resultados
  const startIsCorrect = extractedStart.getHours() === expectedStartHour;
  const endIsCorrect = extractedEnd.getHours() === expectedEndHour;
  const allCorrect = startIsCorrect && endIsCorrect;
  
  console.log(`\nResultado: ${allCorrect ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
  
  if (!allCorrect) {
    if (!startIsCorrect) console.log(`  ⚠️ Hora inicio incorrecta: ${extractedStart.getHours()} (esperado ${expectedStartHour})`);
    if (!endIsCorrect) console.log(`  ⚠️ Hora fin incorrecta: ${extractedEnd.getHours()} (esperado ${expectedEndHour})`);
  }
  
  return allCorrect;
}

// Ejecutar validaciones
console.log("======= VALIDACIÓN DE SOLUCIÓN DE ZONA HORARIA - SERVIDOR =======");

// Caso 1: Reserva de 13:00 a 16:00 en verano (CEST, UTC+2)
const summerReservationCorrect = validateScenario(
  "Reserva 13:00-16:00 (verano - CEST)",
  "2025-06-08T13:00:00.000Z",
  "2025-06-08T16:00:00.000Z",
  13,
  16
);

// Caso 2: Reserva de 10:00 a 12:00 en invierno (CET, UTC+1)
const winterReservationCorrect = validateScenario(
  "Reserva 10:00-12:00 (invierno - CET)",
  "2025-01-15T10:00:00.000Z",
  "2025-01-15T12:00:00.000Z",
  10,
  12
);

// Caso 3: Reserva a medianoche 00:00-02:00 en verano
const midnightSummerCorrect = validateScenario(
  "Reserva medianoche 00:00-02:00 (verano)",
  "2025-06-08T00:00:00.000Z",
  "2025-06-08T02:00:00.000Z",
  0,
  2
);

// Caso 4: Prueba de ida y vuelta (crear y recuperar)
console.log("\n🧪 ESCENARIO: Prueba ida y vuelta (crear y recuperar)");
const originalDate = new Date(2025, 5, 8, 15, 30); // 15:30 hora local en verano
console.log(`Fecha seleccionada por usuario: ${formatHour(originalDate)}`);

const isoDate = preserveLocalTime(originalDate);
console.log(`Guardada en BD como: ${isoDate}`);

const extractedDate = extractLocalTime(isoDate);
console.log(`Extraída y mostrada como: ${formatHour(extractedDate)}`);

const roundTripCorrect = originalDate.getHours() === extractedDate.getHours() && 
                         originalDate.getMinutes() === extractedDate.getMinutes();
console.log(`Resultado: ${roundTripCorrect ? '✅ CORRECTO' : '❌ INCORRECTO'}`);

// Resultado final
const allScenariosCorrect = summerReservationCorrect && 
                            winterReservationCorrect && 
                            midnightSummerCorrect && 
                            roundTripCorrect;

console.log("\n✨ RESULTADO FINAL ✨");
console.log(`La solución ${allScenariosCorrect ? '✅ FUNCIONA CORRECTAMENTE' : '❌ TODAVÍA TIENE PROBLEMAS'}`);

// Mostrar resultado de cada escenario
console.log("\nResumen de escenarios:");
console.log(`- Reserva verano (13:00-16:00): ${summerReservationCorrect ? '✅' : '❌'}`);
console.log(`- Reserva invierno (10:00-12:00): ${winterReservationCorrect ? '✅' : '❌'}`);
console.log(`- Reserva medianoche (00:00-02:00): ${midnightSummerCorrect ? '✅' : '❌'}`);
console.log(`- Prueba ida y vuelta: ${roundTripCorrect ? '✅' : '❌'}`);
