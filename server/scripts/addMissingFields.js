// Script para añadir los campos phone y avatar_url a la tabla users
import { pool } from '../config/database.js';

async function updateUsersTable() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Verificar si la columna 'phone' existe
    const [phoneColumnCheck] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'phone'
    `);
    
    // Verificar si la columna 'avatar_url' existe
    const [avatarColumnCheck] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'avatar_url'
    `);
    
    // Añadir columna 'phone' si no existe
    if (phoneColumnCheck.length === 0) {
      console.log('Añadiendo columna "phone" a la tabla users...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN phone VARCHAR(20) NULL AFTER username
      `);
      console.log('Columna "phone" añadida correctamente');
    } else {
      console.log('La columna "phone" ya existe');
    }
    
    // Añadir columna 'avatar_url' si no existe
    if (avatarColumnCheck.length === 0) {
      console.log('Añadiendo columna "avatar_url" a la tabla users...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN avatar_url VARCHAR(255) NULL AFTER email
      `);
      console.log('Columna "avatar_url" añadida correctamente');
    } else {
      console.log('La columna "avatar_url" ya existe');
    }
    
    // Añadir columna 'membership_date' si no existe
    const [membershipDateColumnCheck] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'membership_date'
    `);
    
    if (membershipDateColumnCheck.length === 0) {
      console.log('Añadiendo columna "membership_date" a la tabla users...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN membership_date DATE NULL AFTER created_at
      `);
      console.log('Columna "membership_date" añadida correctamente');
    } else {
      console.log('La columna "membership_date" ya existe');
    }
    
    console.log('Actualización de la tabla users completada con éxito');
    
  } catch (error) {
    console.error('Error al actualizar la tabla users:', error);
  } finally {
    if (connection) connection.release();
  }
  
  // Cerrar la conexión al pool
  pool.end();
}

updateUsersTable();
