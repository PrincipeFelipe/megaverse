// Prueba de corrección de zona horaria para la visualización de reservas
import { extractLocalTime, preserveLocalTime } from './dateUtils';

// Fechas de prueba
// 1. Reserva de 13:00 a 16:00 en verano (CEST, UTC+2)
const reservationStartISO = "2025-06-08T13:00:00.000Z"; // Fecha de inicio: 13:00
const reservationEndISO = "2025-06-08T16:00:00.000Z";   // Fecha de fin: 16:00

console.log("=== PRUEBA DE CORRECCIÓN DE VISUALIZACIÓN DE HORAS ===");
console.log("\nPRUEBA PRINCIPAL:");
console.log("Fecha ISO de inicio almacenada en BD:", reservationStartISO);

// Aplicamos la función de extracción local para mostrar en el calendario
const extractedStart = extractLocalTime(reservationStartISO);
const extractedEnd = extractLocalTime(reservationEndISO);

// Imprimimos los resultados detallados
console.log("\nResultados de la extracción:");
console.log(`- Hora de inicio:   ${extractedStart.getHours()}:${String(extractedStart.getMinutes()).padStart(2, '0')}`);
console.log(`- Hora de fin:      ${extractedEnd.getHours()}:${String(extractedEnd.getMinutes()).padStart(2, '0')}`);
console.log(`- Fecha completa:   ${extractedStart.toLocaleString()} - ${extractedEnd.toLocaleString()}`);

// Verificamos que las horas visuales sean correctas
const startHourIsCorrect = extractedStart.getHours() === 13;
const endHourIsCorrect = extractedEnd.getHours() === 16;

// Prueba adicional: conversión ida y vuelta
console.log("\nPrueba de ida y vuelta:");
const originalDate = new Date(2025, 5, 8, 13, 0); // 13:00 hora local en junio
console.log(`- Fecha original: ${originalDate.toLocaleString()} (${originalDate.getHours()}:00)`);
const isoDate = preserveLocalTime(originalDate);
console.log(`- Convertida a ISO: ${isoDate}`);
const extractedDate = extractLocalTime(isoDate);
console.log(`- Extraída de nuevo: ${extractedDate.toLocaleString()} (${extractedDate.getHours()}:00)`);
const roundTripCorrect = originalDate.getHours() === extractedDate.getHours();
console.log(`- ¿Coincide la hora después de ida y vuelta?: ${roundTripCorrect ? '✅ SÍ' : '❌ NO'}`);

console.log("\nVerificación de horas:");
console.log(`- La hora de inicio se muestra como 13:00: ${startHourIsCorrect ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
console.log(`- La hora de fin se muestra como 16:00: ${endHourIsCorrect ? '✅ CORRECTO' : '❌ INCORRECTO'}`);

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
console.log("\nResultado final:", result.overallSuccess ? '✅ CORRECCIÓN EXITOSA' : '❌ AÚN HAY PROBLEMAS');
