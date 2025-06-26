/**
 * Este script corrige las fechas en las reservas existentes para asegurar que 
 * las horas se mantengan como se ingresaron visualmente, corrigiendo el problema de zona horaria.
 */

import { pool } from '../config/database.js';

// Función para corregir una fecha ISO para mantener la hora visual
function extractLocalTimeFromISO(isoString) {
  const date = new Date(isoString);
  
  // Extraemos los componentes UTC (que corresponden a la hora visual original)
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  
  // Creamos una nueva fecha con esos componentes como hora local
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}

// Función para corregir las reservas
async function fixReservationTimeZones() {
  console.log('Iniciando corrección de zonas horarias en reservas...');
  
  try {
    const connection = await pool.getConnection();
    
    // Obtener todas las reservas
    const [reservations] = await connection.query('SELECT * FROM reservations');
    console.log(`Encontradas ${reservations.length} reservas en la base de datos.`);
    
    let correctedCount = 0;
    
    // Procesar cada reserva
    for (const reservation of reservations) {
      const reservationId = reservation.id;
      
      // Extraer las horas visuales de las cadenas ISO
      const fixedStartDate = extractLocalTimeFromISO(reservation.start_time);
      const fixedEndDate = extractLocalTimeFromISO(reservation.end_time);
      
      console.log(`Reserva #${reservationId}:`);
      console.log(`  Original start: ${reservation.start_time}`);
      console.log(`  Original end:   ${reservation.end_time}`);
      console.log(`  Fixed start:    ${fixedStartDate.toISOString()}`);
      console.log(`  Fixed end:      ${fixedEndDate.toISOString()}`);
      
      // Actualizar la reserva con las horas corregidas
      await connection.query(
        `UPDATE reservations 
         SET start_time = ?, end_time = ? 
         WHERE id = ?`,
        [fixedStartDate.toISOString(), fixedEndDate.toISOString(), reservationId]
      );
      
      correctedCount++;
    }
    
    connection.release();
    
    console.log(`Proceso completado. Se corrigieron ${correctedCount} reservas.`);
    
  } catch (error) {
    console.error('Error al corregir las zonas horarias de las reservas:', error);
  } finally {
    // Cerrar la conexión al pool
    pool.end();
  }
}

// Ejecutar la función principal
fixReservationTimeZones();
