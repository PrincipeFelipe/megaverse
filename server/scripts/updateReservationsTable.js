// El propósito de este script es actualizar la tabla de reservations
// para añadir columnas necesarias para el funcionamiento correcto del sistema

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Obtener la ruta actual del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse',
};

async function updateReservationsTable() {
  console.log('Iniciando actualización de la tabla de reservaciones...');
  
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa a MySQL');
    
    // Verificar si las columnas ya existen
    const [durationColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'duration_hours'
    `, [dbConfig.database]);
    
    if (durationColumns.length > 0) {
      console.log('La columna duration_hours ya existe en la tabla reservations.');
    } else {
      // Añadir columna duration_hours
      await connection.query(`
        ALTER TABLE reservations
        ADD COLUMN duration_hours FLOAT NOT NULL DEFAULT 1
      `);
      
      console.log('Columna duration_hours añadida correctamente.');
    }

    const [numMembersColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'num_members'
    `, [dbConfig.database]);
    
    if (numMembersColumns.length > 0) {
      console.log('La columna num_members ya existe en la tabla reservations.');
    } else {
      // Añadir columna num_members
      await connection.query(`
        ALTER TABLE reservations
        ADD COLUMN num_members INT NOT NULL DEFAULT 1
      `);
      
      console.log('Columna num_members añadida correctamente.');
    }

    const [numGuestsColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'num_guests'
    `, [dbConfig.database]);
    
    if (numGuestsColumns.length > 0) {
      console.log('La columna num_guests ya existe en la tabla reservations.');
    } else {
      // Añadir columna num_guests
      await connection.query(`
        ALTER TABLE reservations
        ADD COLUMN num_guests INT NOT NULL DEFAULT 0
      `);
      
      console.log('Columna num_guests añadida correctamente.');
    }

    const [allDayColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'all_day'
    `, [dbConfig.database]);
    
    if (allDayColumns.length > 0) {
      console.log('La columna all_day ya existe en la tabla reservations.');
    } else {
      // Añadir columna all_day
      await connection.query(`
        ALTER TABLE reservations
        ADD COLUMN all_day BOOLEAN NOT NULL DEFAULT FALSE
      `);
      
      console.log('Columna all_day añadida correctamente.');
    }

    const [reasonColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'reason'
    `, [dbConfig.database]);
    
    if (reasonColumns.length > 0) {
      console.log('La columna reason ya existe en la tabla reservations.');
    } else {
      // Añadir columna reason
      await connection.query(`
        ALTER TABLE reservations
        ADD COLUMN reason VARCHAR(255) NULL
      `);
      
      console.log('Columna reason añadida correctamente.');
    }

    const [approvedColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'approved'
    `, [dbConfig.database]);
    
    if (approvedColumns.length > 0) {
      console.log('La columna approved ya existe en la tabla reservations.');
    } else {
      // Añadir columna approved
      await connection.query(`
        ALTER TABLE reservations
        ADD COLUMN approved BOOLEAN NOT NULL DEFAULT TRUE
      `);
      
      console.log('Columna approved añadida correctamente.');
    }

    console.log('Actualización de la tabla de reservaciones completada correctamente.');
  } catch (error) {
    console.error('Error al actualizar la tabla de reservaciones:', error);
  } finally {
    if (connection) {
      connection.end();
      console.log('Conexión a MySQL cerrada');
    }
  }
}

updateReservationsTable();
