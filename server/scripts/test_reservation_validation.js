/**
 * Script para probar la validación de reservas consecutivas
 * Este script simula reservas consecutivas y verifica si la lógica las detecta correctamente
 */

import { areConsecutive } from '../controllers/reservations.js';

// Función simulada para recrear el comportamiento
function testConsecutiveReservations() {
  console.log('Probando detección de reservas consecutivas...');
  
  // Caso 1: Reservas exactamente consecutivas (09:00-11:00 y 11:00-13:00)
  const res1Start = new Date('2025-07-05T09:00:00');
  const res1End = new Date('2025-07-05T11:00:00');
  const res2Start = new Date('2025-07-05T11:00:00');
  const res2End = new Date('2025-07-05T13:00:00');
  
  const isConsecutive1 = areConsecutive(res1Start, res1End, res2Start, res2End);
  console.log('Caso 1: Reservas exactamente consecutivas (09:00-11:00 y 11:00-13:00)');
  console.log('Resultado:', isConsecutive1 ? 'DETECTADAS como consecutivas ✓' : 'NO detectadas como consecutivas ✗');
  console.log('Horas (res1):', `${res1Start.getHours()}:${res1Start.getMinutes()}-${res1End.getHours()}:${res1End.getMinutes()}`);
  console.log('Horas (res2):', `${res2Start.getHours()}:${res2Start.getMinutes()}-${res2End.getHours()}:${res2End.getMinutes()}`);
  console.log('\n');
  
  // Caso 2: Reservas con pequeña diferencia (09:00-11:00 y 11:00:01-13:00)
  const res3Start = new Date('2025-07-05T09:00:00');
  const res3End = new Date('2025-07-05T11:00:00');
  const res4Start = new Date('2025-07-05T11:00:01');  // 1 segundo después
  const res4End = new Date('2025-07-05T13:00:00');
  
  const isConsecutive2 = areConsecutive(res3Start, res3End, res4Start, res4End);
  console.log('Caso 2: Reservas con 1 segundo de diferencia (09:00-11:00 y 11:00:01-13:00)');
  console.log('Resultado:', isConsecutive2 ? 'DETECTADAS como consecutivas ✓' : 'NO detectadas como consecutivas ✗');
  console.log('Horas exactas (res3-res4):', 
    `${res3End.getHours()}:${res3End.getMinutes()}:${res3End.getSeconds()} - ${res4Start.getHours()}:${res4Start.getMinutes()}:${res4Start.getSeconds()}`);
  console.log('\n');
  
  // Caso 3: Prueba directa de comparación por horas y minutos
  console.log('Comparación directa por horas y minutos:');
  const hoursMinutesMatch = res1End.getHours() === res2Start.getHours() && 
                           res1End.getMinutes() === res2Start.getMinutes();
  console.log('¿Coinciden horas y minutos?', hoursMinutesMatch ? 'SÍ ✓' : 'NO ✗');
  console.log(`${res1End.getHours()}:${res1End.getMinutes()} vs ${res2Start.getHours()}:${res2Start.getMinutes()}`);
}

// Ejecutar pruebas
testConsecutiveReservations();

console.log('Todas las pruebas completadas');
