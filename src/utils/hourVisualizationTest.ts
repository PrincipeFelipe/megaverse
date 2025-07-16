// Prueba de corrección de zona horaria para la visualización de reservas
import { extractLocalTime, preserveLocalTime } from './dateUtils';
import { createModuleLogger } from './loggerExampleUsage';

// Crear logger para las pruebas de visualización de horas
const testLogger = createModuleLogger('TESTS');

// Fechas de prueba
// 1. Reserva de 13:00 a 16:00 en verano (CEST, UTC+2)
const reservationStartISO = "2025-06-08T13:00:00.000Z"; // Fecha de inicio: 13:00
const reservationEndISO = "2025-06-08T16:00:00.000Z";   // Fecha de fin: 16:00

testLogger.info('=== PRUEBA DE CORRECCIÓN DE VISUALIZACIÓN DE HORAS ===');
testLogger.info('PRUEBA PRINCIPAL:');
testLogger.info('Fecha ISO de inicio almacenada en BD', { reservationStartISO });

// Aplicamos la función de extracción local para mostrar en el calendario
const extractedStart = extractLocalTime(reservationStartISO);
const extractedEnd = extractLocalTime(reservationEndISO);

// Imprimimos los resultados detallados
testLogger.info('Resultados de la extracción:');
testLogger.info('Hora de inicio', { 
  hour: extractedStart.getHours(),
  minute: String(extractedStart.getMinutes()).padStart(2, '0'),
  formatted: `${extractedStart.getHours()}:${String(extractedStart.getMinutes()).padStart(2, '0')}`
});
testLogger.info('Hora de fin', { 
  hour: extractedEnd.getHours(),
  minute: String(extractedEnd.getMinutes()).padStart(2, '0'),
  formatted: `${extractedEnd.getHours()}:${String(extractedEnd.getMinutes()).padStart(2, '0')}`
});
testLogger.info('Fecha completa', { 
  range: `${extractedStart.toLocaleString()} - ${extractedEnd.toLocaleString()}`
});

// Verificamos que las horas visuales sean correctas
const startHourIsCorrect = extractedStart.getHours() === 13;
const endHourIsCorrect = extractedEnd.getHours() === 16;

// Prueba adicional: conversión ida y vuelta
testLogger.info('Prueba de ida y vuelta:');
const originalDate = new Date(2025, 5, 8, 13, 0); // 13:00 hora local en junio
testLogger.info('Fecha original', { 
  date: originalDate.toLocaleString(),
  hour: originalDate.getHours()
});
const isoDate = preserveLocalTime(originalDate);
testLogger.info('Convertida a ISO', { isoDate });
const extractedDate = extractLocalTime(isoDate);
testLogger.info('Extraída de nuevo', { 
  date: extractedDate.toLocaleString(),
  hour: extractedDate.getHours()
});
const roundTripCorrect = originalDate.getHours() === extractedDate.getHours();
testLogger.info('Resultado de ida y vuelta', { 
  coincides: roundTripCorrect ? 'SÍ' : 'NO',
  success: roundTripCorrect
});

testLogger.info('Verificación de horas:');
testLogger.info('Hora de inicio mostrada como 13:00', { 
  isCorrect: startHourIsCorrect ? 'CORRECTO' : 'INCORRECTO',
  success: startHourIsCorrect
});
testLogger.info('Hora de fin mostrada como 16:00', { 
  isCorrect: endHourIsCorrect ? 'CORRECTO' : 'INCORRECTO',
  success: endHourIsCorrect
});

// Exportar una función para poder llamarla desde otros componentes
export function testHoursVisualization() {
  return {
    startTime: extractedStart,
    endTime: extractedEnd,
    isStartCorrect: startHourIsCorrect,
    isEndCorrect: endHourIsCorrect,
    roundTrip: {
      original: originalDate,
      extracted: extractedDate,
      isCorrect: roundTripCorrect
    },
    overallSuccess: startHourIsCorrect && endHourIsCorrect && roundTripCorrect
  };
}

// Ejecutar la prueba automáticamente
const result = testHoursVisualization();
testLogger.info('Resultado final', { 
  success: result.overallSuccess ? 'CORRECCIÓN EXITOSA' : 'AÚN HAY PROBLEMAS',
  overallSuccess: result.overallSuccess
});
