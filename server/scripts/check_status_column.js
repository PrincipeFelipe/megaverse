import { pool } from '../config/database.js';

const checkStatusColumn = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('Verificando valores permitidos para la columna status...');
    
    // Obtener información sobre la columna status
    const [columnInfo] = await connection.query(`
      SELECT COLUMN_TYPE, COLUMN_DEFAULT
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'consumption_payments'
      AND column_name = 'status'
    `);
    
    console.log('Información de la columna status:');
    console.log(`  Tipo: ${columnInfo[0].COLUMN_TYPE}`);
    console.log(`  Valor por defecto: ${columnInfo[0].COLUMN_DEFAULT}`);
    
    // Verificar valores únicos existentes
    const [statusValues] = await connection.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM consumption_payments 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\nValores de status en la tabla:');
    statusValues.forEach(row => {
      console.log(`  ${row.status}: ${row.count} registros`);
    });
    
  } catch (error) {
    console.error('Error al verificar la columna status:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    pool.end();
  }
};

// Ejecutar el script
checkStatusColumn();
