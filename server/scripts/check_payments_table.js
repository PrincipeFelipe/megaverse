import { pool } from '../config/database.js';

const checkPaymentsTable = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('Verificando estructura de la tabla consumption_payments...');
    
    // Verificar columnas de la tabla consumption_payments
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'consumption_payments'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columnas en consumption_payments:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE}, default: ${col.COLUMN_DEFAULT}`);
    });
    
    // Verificar registros existentes
    const [payments] = await connection.query(`
      SELECT id, status, payment_date, created_at, amount, user_id 
      FROM consumption_payments 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\nÚltimos 10 pagos registrados:');
    payments.forEach(payment => {
      console.log(`  ID: ${payment.id}, Status: ${payment.status}, Amount: ${payment.amount}, Date: ${payment.created_at}`);
    });
    
  } catch (error) {
    console.error('Error al verificar la tabla:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    pool.end();
  }
};

// Ejecutar el script
checkPaymentsTable();
