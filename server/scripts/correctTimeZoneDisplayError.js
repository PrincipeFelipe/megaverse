/**
 * Este script corrige las fechas de reservas para asegurar que se muestran correctamente en la UI
 * compensando la diferencia de zona horaria de 2 horas.
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import { logDateDetails } from '../utils/dateUtils.js';

dotenv.config();

// Obtener la ruta actual del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse',
};

/**
 * Ajusta una fecha ISO para compensar la diferencia de zona horaria
 * @param {string} isoString - Fecha ISO a ajustar
 * @param {number|null} manualHourOffset - Diferencia horaria manual a aplicar (opcional)
 * @returns {string} - Nueva fecha ISO con el ajuste aplicado
 */
function adjustTimeZoneOffset(isoString, manualHourOffset = null) {
  const date = new Date(isoString);
  
  // Determinar automáticamente si estamos en horario de verano (CEST) o invierno (CET)
  // España usa UTC+1 (CET) en invierno y UTC+2 (CEST) en verano
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = date.getTimezoneOffset() < stdTimezoneOffset;
  
  // Usar el offset manual si se proporciona, o determinar automáticamente
  const hourOffset = manualHourOffset !== null ? manualHourOffset : (isDST ? 2 : 1);
  
  console.log(`Ajustando fecha con offset de ${hourOffset} horas (${isDST ? 'CEST - verano' : 'CET - invierno'})`);
  logDateDetails("Original date", date);
  
  // Crear una nueva fecha UTC con los componentes de la fecha original más el offset
  const correctedDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours() + hourOffset,
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ));
  
  logDateDetails("Corrected date", correctedDate);
  return correctedDate.toISOString();
}

async function correctReservationTimeZones() {
  console.log('Iniciando corrección de visualización de zona horaria en reservas...');
  
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa a MySQL');
    
    // Obtener todas las reservas
    const [reservations] = await connection.query('SELECT * FROM reservations');
    console.log(`Se encontraron ${reservations.length} reservas en la base de datos.`);
    
    // Procesar cada reserva
    for (const reservation of reservations) {
      console.log(`\nProcesando reserva ID: ${reservation.id}`);
      console.log(`Hora de inicio original: ${reservation.start_time}`);
      console.log(`Hora de fin original: ${reservation.end_time}`);
      
      // Calcular las fechas ajustadas
      const adjustedStartTime = adjustTimeZoneOffset(reservation.start_time);
      const adjustedEndTime = adjustTimeZoneOffset(reservation.end_time);
      
      console.log(`Hora de inicio ajustada: ${adjustedStartTime}`);
      console.log(`Hora de fin ajustada: ${adjustedEndTime}`);
      
      // Actualizar la reserva con las horas ajustadas
      await connection.query(
        'UPDATE reservations SET start_time = ?, end_time = ? WHERE id = ?',
        [adjustedStartTime, adjustedEndTime, reservation.id]
      );
      
      console.log(`Reserva ID ${reservation.id} actualizada correctamente.`);
    }
    
    console.log('\nCorrección de zona horaria completada con éxito.');
  } catch (error) {
    console.error('Error al corregir zona horaria:', error);
  } finally {
    if (connection) {
      connection.end();
      console.log('Conexión a MySQL cerrada');
    }
  }
}

// Ejecutar el script
correctReservationTimeZones();
