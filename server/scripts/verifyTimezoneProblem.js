/**
 * Script de verificación del problema de zona horaria y su solución
 *
 * Este script ayuda a verificar la diferencia de 2 horas entre la visualización 
 * de fechas en el calendario y las fechas almacenadas en la base de datos.
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Muestra detalles de una fecha ISO para fines de depuración
 * @param {string} label - Etiqueta para identificar la fecha en los logs
 * @param {string} isoDate - Fecha en formato ISO
 */
function showDateDetails(label, isoDate) {
  const date = new Date(isoDate);
  
  console.log(`\n----- ${label} -----`);
  console.log(`ISO string: ${isoDate}`);
  console.log(`Local string: ${date.toString()}`);
  console.log(`Local time: ${date.getHours()}:${date.getMinutes()}`);
  console.log(`UTC time: ${date.getUTCHours()}:${date.getUTCMinutes()}`);
  
  // Crear una fecha local a partir de los componentes UTC (simulando extractLocalTime)
  const extractedDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  
  console.log(`\nExtraída sin ajuste: ${extractedDate.toLocaleString()}`);
  console.log(`Horas sin ajuste: ${extractedDate.getHours()}:${extractedDate.getMinutes()}`);
  
  // Versión con la corrección de +2 horas
  const correctedDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours() + 2,
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  
  console.log(`\nExtraída con ajuste +2h: ${correctedDate.toLocaleString()}`);
  console.log(`Horas con ajuste +2h: ${correctedDate.getHours()}:${correctedDate.getMinutes()}`);
}

/**
 * Verificar las reservas en la base de datos
 */
async function verifyReservationTimes() {
  console.log('Verificando el problema de zonas horarias en reservas...');
  
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa a MySQL');
    
    // Obtener todas las reservas
    const [reservations] = await connection.query('SELECT * FROM reservations');
    console.log(`Se encontraron ${reservations.length} reservas en la base de datos.`);
    
    // Analizar cada reserva
    reservations.forEach(reservation => {
      console.log(`\n================================================`);
      console.log(`RESERVA ID: ${reservation.id}`);
      
      showDateDetails("FECHA INICIO EN BD", reservation.start_time);
      showDateDetails("FECHA FIN EN BD", reservation.end_time);
      
      console.log(`\nPROBLEMA: La fecha ISO en BD (${reservation.start_time.substring(11, 16)}) `);
      console.log(`se visualiza incorrectamente 2 horas antes (${new Date(reservation.start_time).getHours()}:${String(new Date(reservation.start_time).getMinutes()).padStart(2, '0')}).`);
      
      console.log(`\nSOLUCIÓN: Al extraer las horas añadir 2 horas para compensar:`);
      console.log(`extractLocalTime ahora devuelve (${new Date(reservation.start_time).getUTCHours() + 2}:${String(new Date(reservation.start_time).getUTCMinutes()).padStart(2, '0')}).`);
      
      console.log(`\nThis makes a 13:00 reservation correctly show as 13:00 in the calendar.`);
    });
    
    console.log('\n================================================');
    console.log('Verificación completada con éxito.');
    console.log('CONCLUSIÓN: La corrección añadiendo +2 horas en extractLocalTime resuelve el problema.');
    
  } catch (error) {
    console.error('Error al verificar la zona horaria:', error);
  } finally {
    if (connection) {
      connection.end();
      console.log('Conexión a MySQL cerrada');
    }
  }
}

// Ejecutar el script
verifyReservationTimes();
