import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Verificar si estamos usando XAMPP (Windows) o el comando mysql está disponible directamente
const mysqlPath = process.env.MYSQL_PATH || 'mysql';

// Función helper para ejecutar comandos SQL con la ruta adecuada de MySQL
function executeSql(sql, database = null) {
  try {
    const dbOption = database ? `-D ${database}` : '';
    const command = `"${mysqlPath}" -u ${process.env.DB_USER || 'root'} ${process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : ''} ${dbOption} -e "${sql}"`;
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error ejecutando SQL: ${error.message}`);
    return false;
  }
}

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};

async function initializeDatabase() {
  let connection;
  
  try {
    // Conectar a MySQL sin seleccionar una base de datos
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Crear la base de datos si no existe
    console.log('Creando base de datos db_megaverse...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE}`);
    console.log(`Base de datos ${process.env.DB_DATABASE} creada o ya existía.`);
    
    // Usar la base de datos
    await connection.query(`USE ${process.env.DB_DATABASE}`);
    
    // 2. Crear tabla de usuarios
    console.log('Creando tabla de usuarios...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        balance DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 3. Crear tabla de productos
    console.log('Creando tabla de productos...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 4. Crear tabla de mesas
    console.log('Creando tabla de mesas...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 5. Crear tabla de reservas
    console.log('Creando tabla de reservas...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        table_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);
    
    // 6. Crear tabla de consumos
    console.log('Creando tabla de consumos...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS consumptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
    
    // 7. Insertar usuario administrador por defecto
    console.log('Comprobando si existe el usuario admin...');
    const [adminRows] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@megaverse.com']);
    
    if (adminRows.length === 0) {
      console.log('Creando usuario administrador por defecto...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(`
        INSERT INTO users (name, email, password, role, balance)
        VALUES (?, ?, ?, ?, ?)
      `, ['Administrador', 'admin@megaverse.com', hashedPassword, 'admin', 100]);
      console.log('Usuario administrador creado.');
    } else {
      console.log('El usuario administrador ya existe.');
    }
    
    // 8. Insertar datos de ejemplo: productos
    console.log('Insertando productos de ejemplo...');
    await connection.query(`
      INSERT INTO products (name, price, stock, category)
      VALUES 
        ('Agua mineral', 1.00, 50, 'bebidas'),
        ('Coca Cola', 1.50, 40, 'bebidas'),
        ('Zumo de naranja', 2.00, 30, 'bebidas'),
        ('Café', 1.20, 100, 'bebidas'),
        ('Sandwich mixto', 3.50, 20, 'comida'),
        ('Patatas fritas', 2.00, 30, 'comida'),
        ('Nachos con queso', 4.50, 15, 'comida')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name)
    `);
    
    // 9. Insertar datos de ejemplo: mesas
    console.log('Insertando mesas de ejemplo...');
    await connection.query(`
      INSERT INTO tables (name, description)
      VALUES 
        ('Mesa Principal', 'Mesa grande para juegos de rol y juegos de mesa'),
        ('Mesa Warhammer', 'Mesa para juegos de miniaturas y wargames'),
        ('Mesa D&D', 'Mesa para partidas de Dungeons & Dragons'),
        ('Mesa Magic', 'Mesa para juegos de cartas'),
        ('Mesa Libre 1', 'Mesa para uso general')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name)
    `);
    
    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la inicialización
initializeDatabase();



