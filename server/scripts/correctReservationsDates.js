// Script para corregir el problema de las fechas de reserva invertidas
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

async function correctReservationsDates() {
  console.log('Iniciando corrección de fechas de reservaciones...');
  
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa a MySQL');
    
    // Verificar si hay reservas con fechas invertidas
    const [reservations] = await connection.query(`
      SELECT * FROM reservations
      WHERE status = 'active'
    `);
    
    console.log(`Encontradas ${reservations.length} reservas activas para revisar.`);
    
    let correctedCount = 0;
    
    // Procesar cada reserva
    for (const reservation of reservations) {
      const startDate = new Date(reservation.start_time);
      const endDate = new Date(reservation.end_time);
      const duration = reservation.duration_hours;
      
      // Verificar si las fechas están invertidas
      if (startDate > endDate || (endDate.getHours() - startDate.getHours() < duration)) {
        console.log(`Reserva #${reservation.id} parece tener las fechas invertidas.`);
        console.log(`  Original: ${startDate.toISOString()} - ${endDate.toISOString()}`);
        
        // Calcular las fechas correctas
        const correctedStart = new Date(endDate);
        correctedStart.setHours(correctedStart.getHours() - duration);
        
        const correctedEnd = new Date(correctedStart);
        correctedEnd.setHours(correctedEnd.getHours() + duration);
        
        console.log(`  Corregido: ${correctedStart.toISOString()} - ${correctedEnd.toISOString()}`);
        
        // Actualizar la reserva
        await connection.query(
          `UPDATE reservations 
           SET start_time = ?, end_time = ? 
           WHERE id = ?`,
          [correctedStart.toISOString(), correctedEnd.toISOString(), reservation.id]
        );
        
        correctedCount++;
      }
    }
    
    console.log(`Se han corregido ${correctedCount} reservas con fechas invertidas.`);
    
  } catch (error) {
    console.error('Error al corregir fechas de reservaciones:', error);
  } finally {
    if (connection) {
      connection.end();
      console.log('Conexión a MySQL cerrada');
    }
  }
}

correctReservationsDates();
