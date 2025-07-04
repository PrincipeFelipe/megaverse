import { pool } from '../config/database.js';

const updateUsersTable = async () => {
  try {
    console.log('Iniciando actualización de la tabla users...');
    
    const connection = await pool.getConnection();
    
    try {
      // Verificar si la columna ya existe para evitar errores
      const [columns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'is_active'`);
      
      if (columns.length === 0) {
        console.log('Añadiendo columna is_active a la tabla users...');
        await connection.query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER role`);
        console.log('Columna is_active añadida correctamente');
      } else {
        console.log('La columna is_active ya existe en la tabla users');
      }
    } catch (error) {
      console.error('Error al actualizar la tabla users:', error);
      throw error;
    } finally {
      connection.release();
    }
    
    console.log('Actualización de la tabla users completada con éxito.');
  } catch (error) {
    console.error('Error general:', error);
  }
};

// Ejecutar la función
updateUsersTable();
