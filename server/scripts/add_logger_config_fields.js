/**
 * Script para agregar campos de configuración del logger a la tabla reservation_config
 */

import { pool } from '../config/database.js';

const addLoggerConfigFields = async () => {
  let connection;
  try {
    console.log('🔧 Verificando campos de configuración del logger...');
    
    connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida.');
    
    // Verificar si los campos ya existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reservation_config'
      AND COLUMN_NAME IN ('logger_enabled', 'logger_level', 'logger_modules')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Agregar logger_enabled si no existe
    if (!existingColumns.includes('logger_enabled')) {
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN logger_enabled BOOLEAN DEFAULT TRUE COMMENT 'Estado del sistema de logging (activado/desactivado)'
      `);
      console.log('✅ Campo logger_enabled agregado correctamente.');
    } else {
      console.log('ℹ️  Campo logger_enabled ya existe.');
    }
    
    // Agregar logger_level si no existe
    if (!existingColumns.includes('logger_level')) {
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN logger_level VARCHAR(10) DEFAULT 'info' COMMENT 'Nivel mínimo de logging (debug, info, warn, error, critical)'
      `);
      console.log('✅ Campo logger_level agregado correctamente.');
    } else {
      console.log('ℹ️  Campo logger_level ya existe.');
    }
    
    // Agregar logger_modules si no existe
    if (!existingColumns.includes('logger_modules')) {
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN logger_modules TEXT DEFAULT NULL COMMENT 'Módulos específicos para filtrado (JSON array o NULL para todos)'
      `);
      console.log('✅ Campo logger_modules agregado correctamente.');
    } else {
      console.log('ℹ️  Campo logger_modules ya existe.');
    }
    
    // Verificar/establecer configuración por defecto
    const [config] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
    
    if (config.length === 0) {
      console.log('⚠️  No existe configuración por defecto. Ejecuta primero el script de creación de configuración.');
    } else {
      console.log('✅ Campos de configuración del logger verificados correctamente.');
      console.log('Estado actual:');
      console.log(`  - Logger habilitado: ${config[0].logger_enabled}`);
      console.log(`  - Nivel de logging: ${config[0].logger_level}`);
      console.log(`  - Módulos filtrados: ${config[0].logger_modules || 'Todos'}`);
    }
    
    connection.release();
    console.log('✅ Proceso completado exitosamente.');
    
  } catch (error) {
    console.error('❌ Error al agregar campos de configuración del logger:', error);
    if (connection) connection.release();
    process.exit(1);
  }
};

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addLoggerConfigFields()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export { addLoggerConfigFields };
