/**
 * Script para actualizar la tabla de configuración de reservas
 * Añade campos para las cuotas de usuarios
 */

import { pool } from '../config/database.js';

const updateReservationConfigTable = async () => {
  try {
    console.log('Comprobando y actualizando la tabla reservation_config...');
    
    const connection = await pool.getConnection();
    
    // Verificar si ya existen los campos de cuotas
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reservation_config'
      AND COLUMN_NAME IN ('normal_fee', 'maintenance_fee')
    `);
    
    if (columns.length === 2) {
      console.log('Los campos de cuotas ya existen en la tabla.');
      connection.release();
      return;
    }
    
    console.log('Añadiendo campos de cuotas a la tabla reservation_config...');
    
    // Verificar cada columna y agregarla si no existe
    if (!columns.find(col => col.COLUMN_NAME === 'normal_fee')) {
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN normal_fee DECIMAL(10, 2) NOT NULL DEFAULT 30.00
      `);
      console.log('Campo normal_fee añadido correctamente.');
    }
    
    if (!columns.find(col => col.COLUMN_NAME === 'maintenance_fee')) {
      await connection.query(`
        ALTER TABLE reservation_config
        ADD COLUMN maintenance_fee DECIMAL(10, 2) NOT NULL DEFAULT 15.00
      `);
      console.log('Campo maintenance_fee añadido correctamente.');
    }
    
    // Actualizar la configuración existente si es necesario
    await connection.query(`
      UPDATE reservation_config
      SET normal_fee = 30.00, maintenance_fee = 15.00
      WHERE normal_fee IS NULL OR maintenance_fee IS NULL
    `);
    
    console.log('Tabla reservation_config actualizada correctamente.');
    connection.release();
    
    process.exit(0);
  } catch (error) {
    console.error('Error al actualizar la tabla de configuración:', error);
    process.exit(1);
  }
};

updateReservationConfigTable();
