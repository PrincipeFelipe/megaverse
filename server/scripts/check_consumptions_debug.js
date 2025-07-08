// Script para verificar directamente en la BD el estado de los consumos
import { pool } from '../config/database.js';

async function checkConsumptionsStatus() {
  try {
    const connection = await pool.getConnection();
    
    console.log('🔍 Verificando estado de consumos en la base de datos...\n');
    
    // 1. Verificar todos los consumos por estado
    const [statusCount] = await connection.query(`
      SELECT 
        paid,
        CASE 
          WHEN paid = 0 THEN 'sin_pagar'
          WHEN paid = 1 THEN 'en_proceso'
          WHEN paid = 2 THEN 'pagado'
          ELSE 'desconocido'
        END as estado,
        COUNT(*) as cantidad
      FROM consumptions
      GROUP BY paid
      ORDER BY paid
    `);
    
    console.log('📊 Resumen por estados:');
    statusCount.forEach(row => {
      console.log(`   ${row.estado}: ${row.cantidad} consumos (paid = ${row.paid})`);
    });
    console.log('');
    
    // 2. Verificar consumos recientes por usuario
    const [recentConsumptions] = await connection.query(`
      SELECT 
        c.id,
        c.user_id,
        u.name as user_name,
        p.name as product_name,
        c.paid,
        c.created_at
      FROM consumptions c
      JOIN users u ON c.user_id = u.id
      JOIN products p ON c.product_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `);
    
    console.log('📋 Últimos 10 consumos:');
    recentConsumptions.forEach(row => {
      console.log(`   ID: ${row.id} | Usuario: ${row.user_name} | Producto: ${row.product_name} | Paid: ${row.paid} | Fecha: ${row.created_at}`);
    });
    console.log('');
    
    // 3. Verificar que consumos devolvería getUnpaidConsumptions para cada usuario
    const [users] = await connection.query('SELECT id, name FROM users WHERE role = "socio"');
    
    for (const user of users) {
      const [unpaidConsumptions] = await connection.query(`
        SELECT c.id, p.name as product_name, c.paid
        FROM consumptions c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ? AND c.paid = 0
        ORDER BY c.created_at DESC
      `, [user.id]);
      
      if (unpaidConsumptions.length > 0) {
        console.log(`👤 Usuario ${user.name} (ID: ${user.id}) - Consumos sin pagar: ${unpaidConsumptions.length}`);
        unpaidConsumptions.forEach(c => {
          console.log(`     - ${c.product_name} (ID: ${c.id}, paid: ${c.paid})`);
        });
      }
    }
    
    connection.release();
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando estado de consumos:', error);
  } finally {
    process.exit(0);
  }
}

checkConsumptionsStatus();
