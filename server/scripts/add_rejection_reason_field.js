// Script para agregar campo rejection_reason a la tabla reservations
import { pool } from '../config/database.js';

async function addRejectionReasonField() {
  try {
    console.log('🔄 Agregando campo rejection_reason a la tabla reservations...');
    
    const connection = await pool.getConnection();
    
    // Verificar si el campo ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reservations' 
      AND COLUMN_NAME = 'rejection_reason'
    `);
    
    if (columns.length > 0) {
      console.log('✅ El campo rejection_reason ya existe en la tabla reservations');
      connection.release();
      return;
    }
    
    // Agregar el campo
    await connection.query(`
      ALTER TABLE reservations 
      ADD COLUMN rejection_reason TEXT NULL 
      COMMENT 'Motivo de denegación de reservas de todo el día'
    `);
    
    console.log('✅ Campo rejection_reason agregado exitosamente a la tabla reservations');
    
    // Verificar que se agregó correctamente
    const [newColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reservations' 
      AND COLUMN_NAME = 'rejection_reason'
    `);
    
    console.log('📋 Información del nuevo campo:', newColumns[0]);
    
    connection.release();
    
  } catch (error) {
    console.error('❌ Error al agregar campo rejection_reason:', error);
  } finally {
    process.exit(0);
  }
}

addRejectionReasonField();
