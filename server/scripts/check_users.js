/**
 * Script para verificar usuarios existentes
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_megaverse'
  });

  try {
    // Primero verificar la estructura de la tabla
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('📋 Estructura de la tabla users:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\n');
    
    // Luego obtener usuarios admin
    const [adminRows] = await connection.execute(
      'SELECT * FROM users WHERE role = "admin" LIMIT 5'
    );
    
    console.log('👤 Usuarios administradores encontrados:');
    adminRows.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Username: ${user.username}, Rol: ${user.role}`);
    });

    if (adminRows.length === 0) {
      console.log('❌ No se encontraron usuarios administradores');
    }

    // También obtener usuarios regulares para testing
    const [userRows] = await connection.execute(
      'SELECT * FROM users WHERE role = "user" OR role IS NULL LIMIT 5'
    );
    
    console.log('\n👥 Usuarios regulares encontrados:');
    userRows.forEach(user => {
      console.log(`  - ID: ${user.id}, Nombre: ${user.name}, Email: ${user.email}, Rol: ${user.role || 'N/A'}`);
    });

    if (userRows.length === 0) {
      console.log('❌ No se encontraron usuarios regulares');
    }

  } catch (error) {
    console.error('Error al verificar usuarios:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsers();
