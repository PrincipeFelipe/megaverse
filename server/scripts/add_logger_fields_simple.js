import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse'
};

async function addLoggerFields() {
  let connection;
  
  try {
    console.log('🔧 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida');
    
    // Verificar si los campos ya existen
    console.log('🔍 Verificando campos existentes...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'reservation_config'
      AND COLUMN_NAME IN ('logger_enabled', 'logger_level', 'logger_modules')
    `, [dbConfig.database]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Campos existentes:', existingColumns);
    
    // Agregar logger_enabled si no existe
    if (!existingColumns.includes('logger_enabled')) {
      console.log('➕ Agregando campo logger_enabled...');
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN logger_enabled BOOLEAN DEFAULT TRUE COMMENT 'Estado del sistema de logging'
      `);
      console.log('✅ Campo logger_enabled agregado');
    } else {
      console.log('ℹ️  Campo logger_enabled ya existe');
    }
    
    // Agregar logger_level si no existe
    if (!existingColumns.includes('logger_level')) {
      console.log('➕ Agregando campo logger_level...');
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN logger_level VARCHAR(10) DEFAULT 'info' COMMENT 'Nivel mínimo de logging'
      `);
      console.log('✅ Campo logger_level agregado');
    } else {
      console.log('ℹ️  Campo logger_level ya existe');
    }
    
    // Agregar logger_modules si no existe
    if (!existingColumns.includes('logger_modules')) {
      console.log('➕ Agregando campo logger_modules...');
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN logger_modules TEXT DEFAULT NULL COMMENT 'Módulos filtrados (JSON)'
      `);
      console.log('✅ Campo logger_modules agregado');
    } else {
      console.log('ℹ️  Campo logger_modules ya existe');
    }
    
    // Verificar configuración actual
    console.log('🔍 Verificando configuración actual...');
    const [config] = await connection.query('SELECT logger_enabled, logger_level, logger_modules FROM reservation_config WHERE id = 1');
    
    if (config.length > 0) {
      console.log('📊 Configuración actual del logger:');
      console.log(`  - Habilitado: ${config[0].logger_enabled}`);
      console.log(`  - Nivel: ${config[0].logger_level}`);
      console.log(`  - Módulos: ${config[0].logger_modules || 'Todos'}`);
    } else {
      console.log('⚠️  No se encontró configuración existente');
    }
    
    console.log('✅ Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

addLoggerFields();
