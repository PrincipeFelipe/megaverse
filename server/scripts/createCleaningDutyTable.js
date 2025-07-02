import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

async function createCleaningDutyTable() {
  let connection;
  
  try {
    // Conectar a MySQL
    connection = await mysql.createConnection(dbConfig);
    
    // Crear tabla de configuración de limpieza para almacenar ajustes generales
    console.log('Creando tabla de configuración de limpieza...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cleaning_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        users_per_week INT NOT NULL DEFAULT 2,
        rotation_complete BOOLEAN DEFAULT FALSE,
        last_assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla de historial de limpieza
    console.log('Creando tabla de historial de limpieza...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cleaning_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        week_start_date DATE NOT NULL,
        week_end_date DATE NOT NULL,
        status ENUM('pending', 'completed', 'missed') DEFAULT 'pending',
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_user_week (user_id, week_start_date)
      )
    `);
    
    // Crear tabla de exenciones de limpieza (para usuarios que por alguna razón no pueden participar)
    console.log('Creando tabla de exenciones de limpieza...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cleaning_exemptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        reason TEXT NOT NULL,
        is_permanent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Insertamos una configuración inicial
    console.log('Insertando configuración inicial...');
    await connection.query(`
      INSERT INTO cleaning_config (users_per_week)
      VALUES (2)
      ON DUPLICATE KEY UPDATE
        users_per_week = VALUES(users_per_week)
    `);
    
    console.log('Tablas del sistema de limpieza creadas correctamente.');
  } catch (error) {
    console.error('Error al crear las tablas del sistema de limpieza:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la creación de tablas
createCleaningDutyTable();
