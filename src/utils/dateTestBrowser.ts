// Archivo para probar las utilidades de fecha en el navegador
console.log("Prueba de utilidades de fecha para zonas horarias");

// Importaciones
import { preserveLocalTime, extractLocalTime } from './dateUtils';

// Ejemplo práctico
export function testDateConversion() {
  // Caso: Reserva de 13:00 a 16:00
  const startDate = new Date(2025, 5, 8, 13, 0); // 8 de junio de 2025, 13:00
  const endDate = new Date(2025, 5, 8, 16, 0);   // 8 de junio de 2025, 16:00
  
  console.log("Fechas originales:");
  console.log(`Inicio: ${startDate.toLocaleString()} (${startDate.getHours()}:${startDate.getMinutes()})`);
  console.log(`Fin: ${endDate.toLocaleString()} (${endDate.getHours()}:${endDate.getMinutes()})`);
  
  // Convertir a formato ISO preservando la hora visual
  const startIso = preserveLocalTime(startDate);
  const endIso = preserveLocalTime(endDate);
  
  console.log("\nFechas ISO (para enviar al servidor):");
  console.log(`Inicio ISO: ${startIso}`);
  console.log(`Fin ISO: ${endIso}`);
  
  // Simular recuperación de datos del servidor
  const retrievedStart = extractLocalTime(startIso);
  const retrievedEnd = extractLocalTime(endIso);
  
  console.log("\nFechas recuperadas del servidor (deberían mostrar la misma hora visual):");
  console.log(`Inicio recuperado: ${retrievedStart.toLocaleString()} (${retrievedStart.getHours()}:${retrievedStart.getMinutes()})`);
  console.log(`Fin recuperado: ${retrievedEnd.toLocaleString()} (${retrievedEnd.getHours()}:${retrievedEnd.getMinutes()})`);
  
  // Verificar la coincidencia
  const startMatches = startDate.getHours() === retrievedStart.getHours() && 
                      startDate.getMinutes() === retrievedStart.getMinutes();
  const endMatches = endDate.getHours() === retrievedEnd.getHours() && 
                    endDate.getMinutes() === retrievedEnd.getMinutes();
  
  console.log("\nResultados de la prueba:");
  console.log(`La hora de inicio coincide: ${startMatches ? '✅ SÍ' : '❌ NO'}`);
  console.log(`La hora de fin coincide: ${endMatches ? '✅ SÍ' : '❌ NO'}`);
  
  return { startMatches, endMatches };
}

// Ejecutar la prueba automáticamente
testDateConversion();
