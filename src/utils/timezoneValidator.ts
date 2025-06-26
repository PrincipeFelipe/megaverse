/**
 * Script para validar la solución de los problemas de zona horaria
 * Este script muestra diferentes escenarios para verificar que la solución implementada
 * funciona correctamente en todas las situaciones.
 */

import { extractLocalTime, preserveLocalTime } from './dateUtils';

// Función para formatear una hora con dos dígitos
const formatHour = (date: Date): string => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// Función para probar diferentes escenarios
export function validateTimezoneSolution() {
  console.log("======= VALIDACIÓN DE SOLUCIÓN DE ZONA HORARIA =======");
  
  // Prueba 1: Reserva de 13:00 a 16:00 (caso principal reportado)
  console.log("\n📊 ESCENARIO 1: Reserva de 13:00 a 16:00");
  
  // Simulamos una reserva guardada en BD (ya en formato ISO)
  const caso1StartISO = "2025-06-08T13:00:00.000Z";
  const caso1EndISO = "2025-06-08T16:00:00.000Z";
  console.log(`ISO (BD): ${caso1StartISO} - ${caso1EndISO}`);
  
  // Extraemos la hora local
  const caso1Start = extractLocalTime(caso1StartISO);
  const caso1End = extractLocalTime(caso1EndISO);
  
  console.log(`Local: ${formatHour(caso1Start)} - ${formatHour(caso1End)}`);
  console.log(`¿Correcto?: ${caso1Start.getHours() === 13 && caso1End.getHours() === 16 ? '✅ SÍ' : '❌ NO'}`);
  
  // Prueba 2: Reserva de hora punta (18:00 a 20:00)
  console.log("\n📊 ESCENARIO 2: Reserva de hora punta (18:00 a 20:00)");
  
  // Simulamos una reserva guardada en BD (ya en formato ISO)
  const caso2StartISO = "2025-06-08T18:00:00.000Z";
  const caso2EndISO = "2025-06-08T20:00:00.000Z";
  console.log(`ISO (BD): ${caso2StartISO} - ${caso2EndISO}`);
  
  // Extraemos la hora local
  const caso2Start = extractLocalTime(caso2StartISO);
  const caso2End = extractLocalTime(caso2EndISO);
  
  console.log(`Local: ${formatHour(caso2Start)} - ${formatHour(caso2End)}`);
  console.log(`¿Correcto?: ${caso2Start.getHours() === 18 && caso2End.getHours() === 20 ? '✅ SÍ' : '❌ NO'}`);
  
  // Prueba 3: Guardado de reserva desde el cliente
  console.log("\n📊 ESCENARIO 3: Guardado de reserva desde el cliente");
  
  // El usuario selecciona 14:30 en su hora local
  const fechaSeleccionada = new Date(2025, 5, 8, 14, 30);
  console.log(`Usuario selecciona: ${formatHour(fechaSeleccionada)} (local)`);
  
  // Convertimos a ISO para guardar en BD
  const fechaISO = preserveLocalTime(fechaSeleccionada);
  console.log(`Se guarda en BD como: ${fechaISO}`);
  
  // Simulamos recuperar de BD y mostrar en calendario
  const fechaMostrada = extractLocalTime(fechaISO);
  console.log(`Se muestra en calendario como: ${formatHour(fechaMostrada)}`);
  
  console.log(`¿Hora preservada correctamente?: ${fechaSeleccionada.getHours() === fechaMostrada.getHours() ? '✅ SÍ' : '❌ NO'}`);
  
  // Resultado final
  const todoCorrecto = 
    caso1Start.getHours() === 13 && 
    caso1End.getHours() === 16 &&
    caso2Start.getHours() === 18 &&
    caso2End.getHours() === 20 &&
    fechaSeleccionada.getHours() === fechaMostrada.getHours();
  
  console.log("\n✨ RESULTADO FINAL ✨");
  console.log(`La solución ${todoCorrecto ? '✅ FUNCIONA CORRECTAMENTE' : '❌ TODAVÍA TIENE PROBLEMAS'}`);
  
  return {
    escenarios: [
      { caso: "13:00-16:00", correcto: caso1Start.getHours() === 13 && caso1End.getHours() === 16 },
      { caso: "18:00-20:00", correcto: caso2Start.getHours() === 18 && caso2End.getHours() === 20 },
      { caso: "preservar hora", correcto: fechaSeleccionada.getHours() === fechaMostrada.getHours() }
    ],
    todoCorrecto
  };
}

// Ejecutar validación automáticamente si se importa este archivo directamente
const resultados = validateTimezoneSolution();
