/**
 * Script para probar la actualización del campo entrance_fee
 */

import { pool } from '../config/database.js';

const testEntranceFeeUpdate = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🧪 Probando actualización de entrance_fee...');
    
    // Obtener valor actual
    const [currentConfig] = await connection.query('SELECT entrance_fee FROM reservation_config WHERE id = 1');
    console.log('📊 Valor actual de entrance_fee:', currentConfig[0].entrance_fee);
    
    // Simular actualización
    const newValue = 75.00;
    console.log('🔄 Actualizando a:', newValue);
    
    await connection.query(
      'UPDATE reservation_config SET entrance_fee = ?, updated_at = NOW() WHERE id = 1',
      [newValue]
    );
    
    // Verificar cambio
    const [updatedConfig] = await connection.query('SELECT entrance_fee, updated_at FROM reservation_config WHERE id = 1');
    console.log('✅ Nuevo valor:', updatedConfig[0].entrance_fee);
    console.log('🕐 Actualizado en:', updatedConfig[0].updated_at);
    
    // Restaurar valor original
    await connection.query(
      'UPDATE reservation_config SET entrance_fee = ? WHERE id = 1',
      [currentConfig[0].entrance_fee]
    );
    console.log('🔄 Valor restaurado');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

testEntranceFeeUpdate()
  .then(() => {
    console.log('🎉 Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la prueba:', error);
    process.exit(1);
  });
