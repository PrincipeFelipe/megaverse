/**
 * Script para actualizar la tabla payments para soportar cuotas de entrada
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updatePaymentsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_megaverse'
  });

  try {
    console.log('🔧 Actualizando tabla payments para soportar cuotas de entrada...');

    // 1. Agregar 'entrance' al enum de payment_type
    console.log('1. Actualizando tipos de pago...');
    await connection.execute(`
      ALTER TABLE payments 
      MODIFY COLUMN payment_type ENUM('normal', 'maintenance', 'entrance') NOT NULL DEFAULT 'normal'
    `);
    console.log('✅ Tipos de pago actualizados');

    // 2. Permitir NULL en month y year
    console.log('2. Permitiendo NULL en campos month y year...');
    await connection.execute(`
      ALTER TABLE payments 
      MODIFY COLUMN month INT(11) NULL
    `);
    console.log('✅ Campo month actualizado a NULL');

    await connection.execute(`
      ALTER TABLE payments 
      MODIFY COLUMN year INT(11) NULL
    `);
    console.log('✅ Campo year actualizado a NULL');

    // 3. Verificar la nueva estructura
    console.log('\n📋 Nueva estructura de la tabla payments:');
    const [columns] = await connection.execute('DESCRIBE payments');
    columns.forEach(col => {
      if (['payment_type', 'month', 'year'].includes(col.Field)) {
        console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.Default !== null ? `Default: ${col.Default}` : ''}`);
      }
    });

    console.log('\n🎉 Tabla payments actualizada exitosamente para soportar cuotas de entrada!');

  } catch (error) {
    console.error('❌ Error al actualizar tabla payments:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

updatePaymentsTable();
