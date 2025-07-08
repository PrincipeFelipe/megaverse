import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
  try {
    console.log('🔄 Iniciando migración para crear tabla de notificaciones...');
    
    const connection = await pool.getConnection();
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'create_notifications_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Ejecutando SQL:', sqlContent);
    
    // Ejecutar la migración
    await connection.query(sqlContent);
    
    console.log('✅ Tabla de notificaciones creada exitosamente');
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla de notificaciones:', error);
    process.exit(1);
  }
};

runMigration();
