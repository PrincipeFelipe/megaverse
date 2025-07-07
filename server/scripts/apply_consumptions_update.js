const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('../config/database');

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
    
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(config);
    
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
      await connection.end();
      console.log('Conexión cerrada.');
    }
  }
}

// Ejecutar la actualización
applyDatabaseUpdate();
