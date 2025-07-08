/**
 * Script para agregar el campo 'entrance_fee' a la tabla 'reservation_config'
 * Este campo almacenará la cuota de entrada que pagan los nuevos miembros
 */

import { pool } from '../config/database.js';

const addEntranceFeeColumn = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🔧 Iniciando migración: agregar campo entrance_fee...');
    
    // Verificar si el campo ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reservation_config' 
      AND COLUMN_NAME = 'entrance_fee'
    `);
    
    if (columns.length > 0) {
      console.log('✅ El campo entrance_fee ya existe en la tabla reservation_config');
      return;
    }
    
    // Agregar el campo entrance_fee
    await connection.query(`
      ALTER TABLE reservation_config 
      ADD COLUMN entrance_fee DECIMAL(10, 2) DEFAULT 0.00 
      COMMENT 'Cuota de entrada única para nuevos miembros (€)'
    `);
    
    console.log('✅ Campo entrance_fee agregado exitosamente');
    
    // Actualizar el registro existente con un valor por defecto
    await connection.query(`
      UPDATE reservation_config 
      SET entrance_fee = 50.00 
      WHERE id = 1
    `);
    
    console.log('✅ Valor por defecto establecido: €50.00');
    
    // Verificar la estructura actualizada
    const [result] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
    console.log('📊 Configuración actualizada:', result[0]);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Ejecutar la migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addEntranceFeeColumn()
    .then(() => {
      console.log('🎉 Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la migración:', error);
      process.exit(1);
    });
}

export default addEntranceFeeColumn;
