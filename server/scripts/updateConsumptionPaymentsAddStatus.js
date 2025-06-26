/**
 * Script para añadir el campo status a la tabla consumption_payments
 * para permitir aprobar o rechazar pagos
 */

import { pool } from '../config/database.js';

const updateConsumptionPaymentsTable = async () => {
  try {
    console.log('Verificando si la tabla consumption_payments tiene el campo status...');
    
    const connection = await pool.getConnection();
    
    // Verificar si el campo ya existe
    const [columnExists] = await connection.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_schema = DATABASE()
      AND table_name = 'consumption_payments'
      AND column_name = 'status'
    `);
    
    if (columnExists[0].count > 0) {
      console.log('El campo status ya existe en la tabla consumption_payments.');
      connection.release();
      return;
    }
    
    console.log('Añadiendo campo status a la tabla consumption_payments...');
    
    // Añadir el campo status
    await connection.query(`
      ALTER TABLE consumption_payments
      ADD COLUMN status ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
      ADD COLUMN approved_by INT NULL,
      ADD COLUMN approved_at TIMESTAMP NULL,
      ADD COLUMN rejection_reason TEXT NULL,
      ADD FOREIGN KEY (approved_by) REFERENCES users(id)
    `);
    
    // Establecer todos los pagos existentes como aprobados (para mantener compatibilidad)
    await connection.query(`
      UPDATE consumption_payments
      SET status = 'aprobado'
    `);
    
    console.log('Campo status añadido correctamente a la tabla consumption_payments.');
    
    connection.release();
    
  } catch (error) {
    console.error('Error al actualizar la tabla consumption_payments:', error);
  }
};

// Ejecutar el script
updateConsumptionPaymentsTable()
  .then(() => console.log('Script completado'))
  .catch(err => console.error('Error en el script:', err))
  .finally(() => process.exit());
