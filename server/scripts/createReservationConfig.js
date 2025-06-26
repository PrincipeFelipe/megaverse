/**
 * Script para crear la tabla de configuración de reservas en la base de datos
 */

import { pool } from '../config/database.js';

const createReservationConfigTable = async () => {  try {
    console.log('Verificando si existe la tabla reservation_config...');
    
    // Verificar si la tabla ya existe
    const connection = await pool.getConnection();
    const [tableExists] = await connection.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name = 'reservation_config'
    `);
    
    if (tableExists[0].count > 0) {
      console.log('La tabla reservation_config ya existe.');
      connection.release();
      return;
    }
    
    console.log('Creando tabla reservation_config...');
      // Crear la tabla
    await connection.query(`
      CREATE TABLE reservation_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        max_hours_per_reservation INT NOT NULL DEFAULT 4,
        max_reservations_per_user_per_day INT NOT NULL DEFAULT 1,
        min_hours_in_advance INT NOT NULL DEFAULT 0,
        allowed_start_time VARCHAR(5) NOT NULL DEFAULT '08:00',
        allowed_end_time VARCHAR(5) NOT NULL DEFAULT '22:00',
        requires_approval_for_all_day BOOLEAN NOT NULL DEFAULT TRUE,
        normal_fee DECIMAL(10, 2) NOT NULL DEFAULT 30.00,
        maintenance_fee DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
      console.log('Tabla reservation_config creada correctamente.');
      // Insertar configuración por defecto
    console.log('Insertando configuración por defecto...');
    await connection.query(`
      INSERT INTO reservation_config
      (max_hours_per_reservation, max_reservations_per_user_per_day, min_hours_in_advance,
       allowed_start_time, allowed_end_time, requires_approval_for_all_day, normal_fee, maintenance_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [4, 1, 0, '08:00', '22:00', true, 30.00, 15.00]);
    
    console.log('Configuración por defecto insertada correctamente.');
    connection.release();
    
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla de configuración:', error);
    process.exit(1);
  }
};

createReservationConfigTable();
