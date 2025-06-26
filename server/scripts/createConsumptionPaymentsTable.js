/**
 * Script para crear la tabla de pagos de consumiciones
 */

import { pool } from '../config/database.js';

const createConsumptionPaymentsTable = async () => {
  try {
    console.log('Verificando si existe la tabla consumption_payments...');
    
    // Verificar si la tabla ya existe
    const connection = await pool.getConnection();
    const [tableExists] = await connection.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name = 'consumption_payments'
    `);
    
    if (tableExists[0].count > 0) {
      console.log('La tabla consumption_payments ya existe.');
      connection.release();
      return;
    }
    
    console.log('Creando tabla consumption_payments...');
    
    // Crear la tabla
    await connection.query(`
      CREATE TABLE consumption_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method ENUM('efectivo', 'transferencia', 'bizum') NOT NULL,
        reference_number VARCHAR(100),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    console.log('Tabla consumption_payments creada correctamente.');
    
    // Crear un índice para búsqueda rápida
    await connection.query(`
      CREATE INDEX idx_consumption_payments_user ON consumption_payments(user_id, payment_date);
    `);
    
    console.log('Índice creado correctamente.');
    connection.release();
    
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla de pagos de consumiciones:', error);
    process.exit(1);
  }
};

createConsumptionPaymentsTable();
