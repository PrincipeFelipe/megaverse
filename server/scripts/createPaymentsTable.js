/**
 * Script para crear la tabla de pagos de cuotas de usuarios
 */

import { pool } from '../config/database.js';

const createPaymentsTable = async () => {
  try {
    console.log('Verificando si existe la tabla payments...');
    
    // Verificar si la tabla ya existe
    const connection = await pool.getConnection();
    const [tableExists] = await connection.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name = 'payments'
    `);
    
    if (tableExists[0].count > 0) {
      console.log('La tabla payments ya existe.');
      connection.release();
      return;
    }
    
    console.log('Creando tabla payments...');
    
    // Crear la tabla
    await connection.query(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_type ENUM('normal', 'maintenance') NOT NULL DEFAULT 'normal',
        month INT NOT NULL,
        year INT NOT NULL,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'transferencia',
        reference VARCHAR(100),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    console.log('Tabla payments creada correctamente.');
    
    // Crear un índice para búsqueda rápida por fecha y usuario
    await connection.query(`
      CREATE INDEX idx_payments_user_date ON payments(user_id, payment_date);
    `);
    
    console.log('Índice creado correctamente.');
    connection.release();
    
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla de pagos:', error);
    process.exit(1);
  }
};

createPaymentsTable();
