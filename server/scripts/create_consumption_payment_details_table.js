const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('../config/database');

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
    
    // Conectar a la base de datos
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(config);
    
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
      await connection.end();
      console.log('Conexión cerrada.');
    }
  }
}

// Ejecutar la creación de la tabla
createConsumptionPaymentDetailsTable();
