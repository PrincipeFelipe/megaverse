/**
 * Monitor de transición de horario de verano a invierno (DST)
 * 
 * Este script monitorea las fechas cercanas a la transición de horario de verano a invierno
 * y viceversa, verificando que las reservas muestren las horas correctas.
 */

import { logDateDetails } from '../utils/dateUtils.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse',
};

/**
 * Devuelve las fechas de cambio de horario para un año específico
 * @param {number} year - El año para el que calcular los cambios
 * @returns {Object} - Fechas de inicio y fin del horario de verano
 */
function getDSTTransitionDates(year) {
  // En Europa, el horario de verano comienza el último domingo de marzo a las 1:00 UTC
  // y termina el último domingo de octubre a las 1:00 UTC
  
  // Encontrar el último domingo de marzo
  let dstStart = new Date(year, 2, 31); // 31 de marzo
  while (dstStart.getDay() !== 0) { // 0 = domingo
    dstStart.setDate(dstStart.getDate() - 1);
  }
  dstStart.setHours(1, 0, 0, 0); // 1:00 UTC
  
  // Encontrar el último domingo de octubre
  let dstEnd = new Date(year, 9, 31); // 31 de octubre
  while (dstEnd.getDay() !== 0) { // 0 = domingo
    dstEnd.setDate(dstEnd.getDate() - 1);
  }
  dstEnd.setHours(1, 0, 0, 0); // 1:00 UTC
  
  return {
    start: dstStart,
    end: dstEnd
  };
}

/**
 * Genera fechas alrededor de una transición de DST
 * @param {Date} transitionDate - La fecha de transición
 * @param {number} daysAround - Número de días antes y después para generar
 * @returns {Array<Date>} - Array de fechas alrededor de la transición
 */
function generateDatesAroundTransition(transitionDate, daysAround = 3) {
  const dates = [];
  
  // Fechas antes de la transición
  for (let i = daysAround; i > 0; i--) {
    const date = new Date(transitionDate);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  // La fecha de la transición
  dates.push(new Date(transitionDate));
  
  // Fechas después de la transición
  for (let i = 1; i <= daysAround; i++) {
    const date = new Date(transitionDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Verifica reservas en fechas críticas de transición de DST
 * @param {number} year - El año para verificar
 */
async function monitorDSTTransitions(year = new Date().getFullYear()) {
  console.log(`Monitoreando reservas en fechas críticas de transición de DST para el año ${year}...`);
  
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa a MySQL');
    
    // Obtener fechas de transición
    const transitionDates = getDSTTransitionDates(year);
    console.log(`\nFechas de transición de DST para ${year}:`);
    console.log(`- Inicio de horario de verano (CET → CEST): ${transitionDates.start.toISOString()}`);
    console.log(`- Fin de horario de verano (CEST → CET): ${transitionDates.end.toISOString()}`);
    
    // Generar fechas alrededor de las transiciones
    const datesAroundSpringTransition = generateDatesAroundTransition(transitionDates.start);
    const datesAroundFallTransition = generateDatesAroundTransition(transitionDates.end);
    
    // Verificar reservas alrededor del inicio de DST (primavera)
    console.log('\n📅 Verificando reservas alrededor del inicio de horario de verano (primavera)...');
    for (const date of datesAroundSpringTransition) {
      const formattedDate = date.toISOString().split('T')[0];
      
      // Buscar reservas en esta fecha
      const [reservations] = await connection.query(
        'SELECT * FROM reservations WHERE DATE(start_time) = ?',
        [formattedDate]
      );
      
      console.log(`\n${formattedDate}: ${reservations.length} reservas encontradas`);
      
      // Verificar cada reserva
      for (const res of reservations) {
        const startDate = new Date(res.start_time);
        const endDate = new Date(res.end_time);
        
        console.log(`- Reserva ID ${res.id}: ${startDate.getUTCHours()}:${startDate.getUTCMinutes().toString().padStart(2, '0')} - ${endDate.getUTCHours()}:${endDate.getUTCMinutes().toString().padStart(2, '0')} UTC`);
        
        // Verificar si la fecha está en el día de transición
        if (formattedDate === transitionDates.start.toISOString().split('T')[0]) {
          console.log(`  ⚠️ Esta reserva está en el día de cambio al horario de verano`);
          
          // Sugerir verificación manual
          if (startDate.getUTCHours() >= 1 && startDate.getUTCHours() <= 3) {
            console.log(`  🔍 ATENCIÓN: Esta reserva está en horas críticas de transición, verificar manualmente`);
          }
        }
      }
    }
    
    // Verificar reservas alrededor del fin de DST (otoño)
    console.log('\n📅 Verificando reservas alrededor del fin de horario de verano (otoño)...');
    for (const date of datesAroundFallTransition) {
      const formattedDate = date.toISOString().split('T')[0];
      
      // Buscar reservas en esta fecha
      const [reservations] = await connection.query(
        'SELECT * FROM reservations WHERE DATE(start_time) = ?',
        [formattedDate]
      );
      
      console.log(`\n${formattedDate}: ${reservations.length} reservas encontradas`);
      
      // Verificar cada reserva
      for (const res of reservations) {
        const startDate = new Date(res.start_time);
        const endDate = new Date(res.end_time);
        
        console.log(`- Reserva ID ${res.id}: ${startDate.getUTCHours()}:${startDate.getUTCMinutes().toString().padStart(2, '0')} - ${endDate.getUTCHours()}:${endDate.getUTCMinutes().toString().padStart(2, '0')} UTC`);
        
        // Verificar si la fecha está en el día de transición
        if (formattedDate === transitionDates.end.toISOString().split('T')[0]) {
          console.log(`  ⚠️ Esta reserva está en el día de cambio al horario de invierno`);
          
          // Sugerir verificación manual
          if (startDate.getUTCHours() >= 0 && startDate.getUTCHours() <= 3) {
            console.log(`  🔍 ATENCIÓN: Esta reserva está en horas críticas de transición, verificar manualmente`);
          }
        }
      }
    }
    
    console.log('\n✅ Monitoreo de transición DST completado.');
  } catch (error) {
    console.error('Error al monitorear transiciones DST:', error);
  } finally {
    if (connection) {
      connection.end();
      console.log('Conexión a MySQL cerrada');
    }
  }
}

// Ejecutar el script con el año actual
monitorDSTTransitions();

// También permite ejecutar con un año específico:
// node dstTransitionMonitor.js 2026
if (process.argv.length > 2) {
  const year = parseInt(process.argv[2]);
  if (!isNaN(year)) {
    monitorDSTTransitions(year);
  }
}
