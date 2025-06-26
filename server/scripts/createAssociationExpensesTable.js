/**
 * Script para crear la tabla de gastos (pagos realizados por la asociación)
 */

import { pool } from '../config/database.js';

async function createAssociationExpensesTable() {
  try {
    console.log('Iniciando creación de la tabla association_expenses...');
    
    const connection = await pool.getConnection();
    
    // Verificar si la tabla ya existe
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'association_expenses'
    `);
    
    if (tables.length > 0) {
      console.log('La tabla association_expenses ya existe.');
      connection.release();
      return;
    }
    
    // Crear la tabla
    await connection.query(`
      CREATE TABLE association_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        expense_date DATE NOT NULL,
        concept VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        payment_method VARCHAR(50) NOT NULL DEFAULT 'transferencia',
        recipient VARCHAR(255),
        reference VARCHAR(100),
        attachment_url VARCHAR(255),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    console.log('Tabla association_expenses creada correctamente.');
    
    // Crear un índice para búsqueda rápida por fecha
    await connection.query(`
      CREATE INDEX idx_expenses_date ON association_expenses(expense_date);
    `);
    
    // Crear un índice para búsqueda por categoría
    await connection.query(`
      CREATE INDEX idx_expenses_category ON association_expenses(category);
    `);
    
    console.log('Índices creados correctamente.');
    connection.release();
    
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla association_expenses:', error);
    process.exit(1);
  }
}

createAssociationExpensesTable();
