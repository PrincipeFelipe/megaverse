import fs from 'fs';
import mysql from 'mysql2/promise';
import { pool } from '../config/database.js';

async function applyDatabaseUpdate() {
  console.log('Iniciando actualización de la base de datos...');
  
  let connection;
  
  try {
    // Leer el archivo SQL
    const sqlScript = fs.readFileSync('./scripts/update_consumptions_table.sql', 'utf8');
    
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
    
    console.log('Actualización completada con éxito.');
    
  } catch (error) {
    console.error('Error al aplicar la actualización:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('Conexión liberada.');
    }
  }
}

// Ejecutar la actualización
applyDatabaseUpdate();
