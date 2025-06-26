import { pool } from '../config/database.js';

async function updateUsersTable() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('Conectado a la base de datos. Actualizando tabla users...');
    
    // Verificar si la columna membership_date existe
    const [checkMembershipDate] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'membership_date'
    `);
    
    if (checkMembershipDate.length === 0) {
      console.log('Añadiendo columna membership_date...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN membership_date DATE DEFAULT NULL
      `);
      console.log('Columna membership_date añadida correctamente.');
    } else {
      console.log('La columna membership_date ya existe.');
    }
    
    // Verificar si la columna phone existe
    const [checkPhone] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'phone'
    `);
    
    if (checkPhone.length === 0) {
      console.log('Añadiendo columna phone...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN phone VARCHAR(20) DEFAULT NULL
      `);
      console.log('Columna phone añadida correctamente.');
    } else {
      console.log('La columna phone ya existe.');
    }
    
    // Verificar si la columna avatar_url existe
    const [checkAvatarUrl] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'avatar_url'
    `);
    
    if (checkAvatarUrl.length === 0) {
      console.log('Añadiendo columna avatar_url...');
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL
      `);
      console.log('Columna avatar_url añadida correctamente.');
    } else {
      console.log('La columna avatar_url ya existe.');
    }
    
    console.log('Tabla users actualizada correctamente.');
    
  } catch (error) {
    console.error('Error al actualizar la tabla users:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('Conexión liberada.');
    }
    process.exit(0);
  }
}

updateUsersTable();
