/**
 * Script para aplicar la actualización de la base de datos
 * Añade los campos necesarios para las nuevas funcionalidades de reservas consecutivas
 */

import { pool } from '../config/database.js';

const applyDatabaseUpdate = async () => {
  try {
    console.log('Iniciando actualización de la base de datos...');
    const connection = await pool.getConnection();
    
    // Comprobar si la columna allow_consecutive_reservations ya existe
    const [existCheck1] = await connection.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reservation_config'
      AND COLUMN_NAME = 'allow_consecutive_reservations'
    `);
    
    const allowConsecutiveExists = existCheck1[0].count > 0;
    
    // Comprobar si la columna min_time_between_reservations ya existe
    const [existCheck2] = await connection.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reservation_config'
      AND COLUMN_NAME = 'min_time_between_reservations'
    `);
    
    const minTimeBetweenExists = existCheck2[0].count > 0;
    
    // Aplicar los cambios si es necesario
    if (!allowConsecutiveExists) {
      console.log('Añadiendo columna allow_consecutive_reservations...');
      await connection.query(`
        ALTER TABLE reservation_config 
        ADD COLUMN allow_consecutive_reservations BOOLEAN DEFAULT TRUE 
        AFTER requires_approval_for_all_day
      `);
      console.log('Columna allow_consecutive_reservations añadida correctamente');
    } else {
      console.log('La columna allow_consecutive_reservations ya existe');
    }
    
    if (!minTimeBetweenExists) {
      console.log('Añadiendo columna min_time_between_reservations...');
      await connection.query(`
        ALTER TABLE reservation_config 
        ADD COLUMN min_time_between_reservations INT DEFAULT 30 
        AFTER allow_consecutive_reservations
      `);
      console.log('Columna min_time_between_reservations añadida correctamente');
    } else {
      console.log('La columna min_time_between_reservations ya existe');
    }
    
    // Actualizar los valores predeterminados
    console.log('Actualizando valores predeterminados...');
    await connection.query(`
      UPDATE reservation_config 
      SET allow_consecutive_reservations = TRUE, 
          min_time_between_reservations = 30 
      WHERE allow_consecutive_reservations IS NULL 
      OR min_time_between_reservations IS NULL
    `);
    
    // Verificar la actualización
    const [config] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
    
    connection.release();
    
    console.log('Actualización de la base de datos completada.');
    console.log('Configuración actual:', config[0]);
    
    return true;
  } catch (error) {
    console.error('Error al actualizar la base de datos:', error);
    return false;
  } finally {
    process.exit(); // Salir después de ejecutar
  }
};

// Ejecutar la función
applyDatabaseUpdate();
