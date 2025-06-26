/**
 * Script para añadir los campos teléfono y DNI a la tabla de usuarios
 */

import { pool } from '../config/database.js';

async function updateUsersTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Iniciando actualización de la tabla users...');
    
    // Comprobar si el campo phone ya existe
    const [phoneColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'phone'
    `);
    
    if (phoneColumns.length === 0) {
      console.log('Añadiendo campo phone a la tabla users...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(20) DEFAULT NULL
      `);
      console.log('Campo phone añadido correctamente');
    } else {
      console.log('El campo phone ya existe en la tabla users');
    }
    
    // Comprobar si el campo dni ya existe
    const [dniColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'dni'
    `);
    
    if (dniColumns.length === 0) {
      console.log('Añadiendo campo dni a la tabla users...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN dni VARCHAR(20) DEFAULT NULL
      `);
      console.log('Campo dni añadido correctamente');
    } else {
      console.log('El campo dni ya existe en la tabla users');
    }
    
    console.log('Actualización de la tabla users completada');
    
  } catch (error) {
    console.error('Error al actualizar la tabla users:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

updateUsersTable();
