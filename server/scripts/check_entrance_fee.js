/**
 * Script simple para verificar y agregar el campo entrance_fee
 */

import { pool } from '../config/database.js';

console.log('🔧 Verificando estructura de reservation_config...');

try {
  const connection = await pool.getConnection();
  
  // Verificar estructura actual
  const [columns] = await connection.query('DESCRIBE reservation_config');
  console.log('📊 Estructura actual:');
  columns.forEach(col => console.log(`  - ${col.Field}: ${col.Type}`));
  
  // Verificar si entrance_fee existe
  const hasEntranceFee = columns.some(col => col.Field === 'entrance_fee');
  
  if (!hasEntranceFee) {
    console.log('➕ Agregando campo entrance_fee...');
    await connection.query(`
      ALTER TABLE reservation_config 
      ADD COLUMN entrance_fee DECIMAL(10, 2) DEFAULT 50.00 
      COMMENT 'Cuota de entrada única para nuevos miembros (€)'
    `);
    console.log('✅ Campo agregado exitosamente');
  } else {
    console.log('✅ El campo entrance_fee ya existe');
  }
  
  // Mostrar datos actuales
  const [config] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
  console.log('📊 Configuración actual:', config[0]);
  
  connection.release();
  console.log('🎉 Verificación completada');
  
} catch (error) {
  console.error('❌ Error:', error);
}
