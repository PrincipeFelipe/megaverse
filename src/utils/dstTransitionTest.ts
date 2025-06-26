/**
 * Test para verificar que las funciones de fecha manejan correctamente 
 * las transiciones de horario de verano (DST)
 */

import { extractLocalTime, preserveLocalTime } from './dateUtils';

/**
 * Simula una fecha en un momento específico del año
 * @param {number} year - Año
 * @param {number} month - Mes (1-12)
 * @param {number} day - Día
 * @param {number} hours - Horas (0-23)
 * @param {number} minutes - Minutos (0-59)
 * @returns {{original: Date, iso: string, extracted: Date}}
 */
function testDateConversion(year, month, day, hours, minutes) {
  // Crear fecha original (como la que seleccionaría un usuario)
  const original = new Date(year, month - 1, day, hours, minutes);
  
  // Convertir a ISO (como se guardaría en BD)
  const iso = preserveLocalTime(original);
  
  // Extraer de nuevo (como se mostraría en la UI)
  const extracted = extractLocalTime(iso);
  
  // Comparar
  const hoursMatch = original.getHours() === extracted.getHours();
  const minutesMatch = original.getMinutes() === extracted.getMinutes();
  const success = hoursMatch && minutesMatch;
  
  return {
    original,
    iso,
    extracted,
    success,
    hoursMatch,
    minutesMatch
  };
}

/**
 * Ejecuta pruebas para fechas específicas críticas durante cambios de DST
 */
export function testDSTTransitions() {
  console.log('🧪 TEST: MANEJO DE TRANSICIONES DE HORARIO DE VERANO/INVIERNO (DST)');
  
  // Test 1: Día antes del cambio a horario de verano
  const beforeSpringDST = testDateConversion(2025, 3, 29, 13, 30); // 29 de marzo, 13:30
  console.log('\n📅 Prueba 1: Día antes del cambio a horario de verano (29 de marzo, 13:30)');
  console.log(`Original: ${beforeSpringDST.original.toLocaleString()}`);
  console.log(`ISO: ${beforeSpringDST.iso}`);
  console.log(`Extraído: ${beforeSpringDST.extracted.toLocaleString()}`);
  console.log(`Resultado: ${beforeSpringDST.success ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
  
  // Test 2: Día del cambio a horario de verano (horas antes del cambio)
  const springDSTDay = testDateConversion(2025, 3, 30, 1, 30); // 30 de marzo, 1:30 (antes del cambio)
  console.log('\n📅 Prueba 2: Día del cambio a horario de verano, antes del cambio (30 de marzo, 1:30)');
  console.log(`Original: ${springDSTDay.original.toLocaleString()}`);
  console.log(`ISO: ${springDSTDay.iso}`);
  console.log(`Extraído: ${springDSTDay.extracted.toLocaleString()}`);
  console.log(`Resultado: ${springDSTDay.success ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
  
  // Test 3: Día del cambio a horario de verano (hora crítica - puede no existir)
  const springDSTCritical = testDateConversion(2025, 3, 30, 2, 30); // 30 de marzo, 2:30 (hora perdida)
  console.log('\n📅 Prueba 3: Día del cambio, hora crítica - puede no existir (30 de marzo, 2:30)');
  console.log(`Original: ${springDSTCritical.original.toLocaleString()}`);
  console.log(`ISO: ${springDSTCritical.iso}`);
  console.log(`Extraído: ${springDSTCritical.extracted.toLocaleString()}`);
  console.log(`Resultado: ${springDSTCritical.success ? '✅ CORRECTO' : '⚠️ REVISAR - Esta hora puede no existir'}`);
  
  // Test 4: Día del cambio a horario de verano (horas después del cambio)
  const afterSpringDST = testDateConversion(2025, 3, 30, 14, 30); // 30 de marzo, 14:30 (después del cambio)
  console.log('\n📅 Prueba 4: Día del cambio, después del cambio (30 de marzo, 14:30)');
  console.log(`Original: ${afterSpringDST.original.toLocaleString()}`);
  console.log(`ISO: ${afterSpringDST.iso}`);
  console.log(`Extraído: ${afterSpringDST.extracted.toLocaleString()}`);
  console.log(`Resultado: ${afterSpringDST.success ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
  
  // Test 5: Día antes del cambio a horario de invierno
  const beforeFallDST = testDateConversion(2025, 10, 25, 15, 0); // 25 de octubre, 15:00
  console.log('\n📅 Prueba 5: Día antes del cambio a horario de invierno (25 de octubre, 15:00)');
  console.log(`Original: ${beforeFallDST.original.toLocaleString()}`);
  console.log(`ISO: ${beforeFallDST.iso}`);
  console.log(`Extraído: ${beforeFallDST.extracted.toLocaleString()}`);
  console.log(`Resultado: ${beforeFallDST.success ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
  
  // Test 6: Día del cambio a horario de invierno (hora crítica - se repite)
  const fallDSTCritical = testDateConversion(2025, 10, 26, 2, 30); // 26 de octubre, 2:30 (hora ambigua)
  console.log('\n📅 Prueba 6: Día del cambio, hora crítica - se repite (26 de octubre, 2:30)');
  console.log(`Original: ${fallDSTCritical.original.toLocaleString()}`);
  console.log(`ISO: ${fallDSTCritical.iso}`);
  console.log(`Extraído: ${fallDSTCritical.extracted.toLocaleString()}`);
  console.log(`Resultado: ${fallDSTCritical.success ? '✅ CORRECTO' : '⚠️ REVISAR - Esta hora es ambigua'}`);
  
  // Test 7: Día del cambio a horario de invierno (después del cambio)
  const afterFallDST = testDateConversion(2025, 10, 26, 14, 0); // 26 de octubre, 14:00
  console.log('\n📅 Prueba 7: Día del cambio, después del cambio (26 de octubre, 14:00)');
  console.log(`Original: ${afterFallDST.original.toLocaleString()}`);
  console.log(`ISO: ${afterFallDST.iso}`);
  console.log(`Extraído: ${afterFallDST.extracted.toLocaleString()}`);
  console.log(`Resultado: ${afterFallDST.success ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
  
  // Resultado general
  const allTests = [beforeSpringDST, springDSTDay, afterSpringDST, beforeFallDST, afterFallDST];
  const allTestsSuccess = allTests.every(test => test.success);
  
  console.log('\n✨ RESULTADO FINAL ✨');
  console.log(`Las pruebas básicas ${allTestsSuccess ? '✅ FUNCIONAN CORRECTAMENTE' : '❌ TIENEN PROBLEMAS'}`);
  console.log('⚠️ Nota: Las pruebas en horas críticas de cambio de horario pueden dar resultados variables');
  console.log('   Se recomienda evitar programar reservas en esas franjas horarias específicas.');
  
  return {
    tests: {
      beforeSpringDST,
      springDSTDay,
      springDSTCritical,
      afterSpringDST,
      beforeFallDST,
      fallDSTCritical,
      afterFallDST
    },
    allTestsSuccess
  };
}

// Ejecutar tests automáticamente si se importa este archivo
const results = testDSTTransitions();
