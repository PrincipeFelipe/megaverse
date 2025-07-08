import { pool } from '../config/database.js';

const createPaymentDetailsTable = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('Verificando si la tabla consumption_payments_details existe...');
    
    // Crear la tabla si no existe
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`consumption_payments_details\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`payment_id\` INT NOT NULL,
        \`consumption_id\` INT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`fk_payment_details_payment_idx\` (\`payment_id\` ASC),
        INDEX \`fk_payment_details_consumption_idx\` (\`consumption_id\` ASC),
        CONSTRAINT \`fk_payment_details_payment\`
          FOREIGN KEY (\`payment_id\`)
          REFERENCES \`consumption_payments\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT \`fk_payment_details_consumption\`
          FOREIGN KEY (\`consumption_id\`)
          REFERENCES \`consumptions\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createTableSQL);
    console.log('Tabla consumption_payments_details creada o ya existe.');
    
    // Verificar que la tabla existe
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'consumption_payments_details'
    `);
    
    if (tables.length > 0) {
      console.log('✅ La tabla consumption_payments_details existe correctamente.');
    } else {
      console.log('❌ Error: La tabla consumption_payments_details no existe.');
    }
    
  } catch (error) {
    console.error('Error al crear la tabla:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    pool.end();
  }
};

// Ejecutar el script
createPaymentDetailsTable();
