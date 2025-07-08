import fs from 'fs';
import mysql from 'mysql2/promise';
import { pool } from '../config/database.js';

async function createConsumptionPaymentDetailsTable() {
  console.log('Iniciando creación de tabla de detalles de pagos...');
  
  let connection;
  
  try {
    // Leer el archivo SQL
    const sqlScript = fs.readFileSync('./scripts/create_consumption_payment_details_table.sql', 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    // Usar el pool de conexiones existente
    console.log('Conectando a la base de datos...');
    connection = await pool.getConnection();
    
    console.log('Aplicando cambios...');
    // Ejecutar cada comando por separado
    for (const command of commands) {
      console.log(`Ejecutando: ${command.substring(0, 50)}...`);
      await connection.execute(`${command};`);
    }
    
    console.log('Tabla creada con éxito.');
    
  } catch (error) {
    console.error('Error al crear la tabla:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('Conexión liberada.');
    }
  }
}

// Ejecutar la creación de la tabla
createConsumptionPaymentDetailsTable();
