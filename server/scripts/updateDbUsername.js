// El propósito de este script es actualizar la base de datos para añadir
// el campo 'username' a la tabla 'users' y facilitar la migración
// del sistema de login basado en email a uno basado en nombre de usuario.

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Obtener la ruta actual del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse',
};

async function updateDb() {
  console.log('Iniciando actualización de la base de datos...');
  
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa a MySQL');
    
    // Verificar si la columna username ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username'
    `, [dbConfig.database]);
    
    if (columns.length > 0) {
      console.log('La columna username ya existe en la tabla users.');
    } else {
      // Añadir columna username a la tabla users
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN username VARCHAR(50) NULL
      `);
      
      console.log('Columna username añadida correctamente.');
      
      // Copiar el valor de email a username para los usuarios existentes
      await connection.query(`
        UPDATE users
        SET username = SUBSTRING_INDEX(email, '@', 1)
        WHERE username IS NULL
      `);
      
      console.log('Valores de username actualizados para usuarios existentes.');
      
      // Hacer la columna username NOT NULL y añadir UNIQUE constraint
      await connection.query(`
        ALTER TABLE users
        MODIFY COLUMN username VARCHAR(50) NOT NULL,
        ADD UNIQUE INDEX idx_username (username)
      `);
      
      console.log('Restricciones aplicadas a la columna username.');
      
      // Modificar la columna email para hacerla opcional
      await connection.query(`
        ALTER TABLE users
        MODIFY COLUMN email VARCHAR(255) NULL
      `);
      
      console.log('Columna email ahora es opcional.');
    }
    
    console.log('Actualización de la base de datos completada correctamente.');
    
  } catch (error) {
    console.error('Error al actualizar la base de datos:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión a MySQL cerrada');
    }
  }
}

updateDb();
