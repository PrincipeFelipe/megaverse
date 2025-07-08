import { pool } from '../config/database.js';

const verifyTables = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('Verificando tablas necesarias...');
    
    // Verificar tabla consumption_payments
    const [paymentsTable] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'consumption_payments'
    `);
    
    if (paymentsTable.length > 0) {
      console.log('✅ La tabla consumption_payments existe.');
    } else {
      console.log('❌ Error: La tabla consumption_payments no existe.');
    }
    
    // Verificar tabla consumption_payments_details
    const [detailsTable] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'consumption_payments_details'
    `);
    
    if (detailsTable.length > 0) {
      console.log('✅ La tabla consumption_payments_details existe.');
    } else {
      console.log('❌ Error: La tabla consumption_payments_details no existe.');
    }
    
    // Verificar columnas de la tabla consumptions
    const [consumptionsColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'consumptions'
    `);
    
    const columnNames = consumptionsColumns.map(col => col.COLUMN_NAME);
    console.log('Columnas en la tabla consumptions:', columnNames);
    
    if (columnNames.includes('paid')) {
      console.log('✅ La columna "paid" existe en consumptions.');
    } else {
      console.log('❌ Error: La columna "paid" no existe en consumptions.');
    }
    
    if (columnNames.includes('price_per_unit')) {
      console.log('✅ La columna "price_per_unit" existe en consumptions.');
    } else {
      console.log('❌ Error: La columna "price_per_unit" no existe en consumptions.');
    }
    
  } catch (error) {
    console.error('Error al verificar las tablas:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    pool.end();
  }
};

// Ejecutar el script
verifyTables();
