/**
 * Script para verificar la estructura de la tabla payments
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkPaymentsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_megaverse'
  });

  try {
    console.log('📋 Estructura de la tabla payments:');
    const [columns] = await connection.execute('DESCRIBE payments');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.Default !== null ? `Default: ${col.Default}` : ''}`);
    });

  } catch (error) {
    console.error('Error al verificar tabla payments:', error.message);
  } finally {
    await connection.end();
  }
}

checkPaymentsTable();
