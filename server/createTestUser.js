// Archivo temporal para crear un usuario de prueba con deuda pendiente
import { pool } from './config/database.js';
import bcrypt from 'bcrypt';

async function createTestUser() {
  let connection;
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    connection = await pool.getConnection();
    
    // Verificar primero si el usuario ya existe
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      ['testuser', 'test@example.com']
    );
    
    if (existingUser.length > 0) {
      // Actualizar el balance en lugar de crear uno nuevo
      await connection.query(
        'UPDATE users SET balance = -15.50 WHERE id = ?',
        [existingUser[0].id]
      );
      console.log('Balance del usuario de prueba actualizado correctamente a -15.50€');
    } else {
      // Insertar nuevo usuario
      await connection.query(
        'INSERT INTO users (name, username, email, password, role, balance) VALUES (?, ?, ?, ?, ?, ?)',
        ['Usuario Prueba', 'testuser', 'test@example.com', hashedPassword, 'user', -15.50]
      );
      console.log('Usuario de prueba con deuda pendiente creado correctamente.');
    }
    
  } catch (error) {
    console.error('Error al crear o actualizar usuario de prueba:', error);
  } finally {
    if (connection) connection.release();
    pool.end(); // Cerrar el pool de conexiones al final
  }
}

createTestUser();
