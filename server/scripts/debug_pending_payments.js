import { pool } from '../config/database.js';

const debugPendingPayments = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('=== DEBUG: Investigando pagos pendientes ===');
    
    // 1. Verificar pagos con status pendiente
    console.log('\n1. Pagos con status pendiente:');
    const [pendingPayments] = await connection.query(
      `SELECT id, user_id, status, amount, payment_date, created_by 
       FROM consumption_payments 
       WHERE status = 'pendiente'`
    );
    
    console.log(`Encontrados: ${pendingPayments.length}`);
    pendingPayments.forEach(payment => {
      console.log(`  ID: ${payment.id}, User: ${payment.user_id}, Status: ${payment.status}, Created by: ${payment.created_by}`);
    });
    
    // 2. Verificar si existe el usuario que creó el pago
    if (pendingPayments.length > 0) {
      const payment = pendingPayments[0];
      console.log(`\n2. Verificando usuario que creó el pago ID ${payment.id}:`);
      
      const [createdByUser] = await connection.query(
        `SELECT id, name, username FROM users WHERE id = ?`,
        [payment.created_by]
      );
      
      if (createdByUser.length > 0) {
        console.log(`  Usuario creador existe: ID ${createdByUser[0].id}, Nombre: ${createdByUser[0].name}`);
      } else {
        console.log(`  ❌ Usuario creador NO existe: ID ${payment.created_by}`);
      }
      
      // 3. Verificar si existe el usuario del pago
      console.log(`\n3. Verificando usuario del pago ID ${payment.id}:`);
      
      const [paymentUser] = await connection.query(
        `SELECT id, name, username FROM users WHERE id = ?`,
        [payment.user_id]
      );
      
      if (paymentUser.length > 0) {
        console.log(`  Usuario del pago existe: ID ${paymentUser[0].id}, Nombre: ${paymentUser[0].name}`);
      } else {
        console.log(`  ❌ Usuario del pago NO existe: ID ${payment.user_id}`);
      }
      
      // 4. Intentar la consulta completa paso a paso
      console.log(`\n4. Probando consulta completa:`);
      
      try {
        const [fullQuery] = await connection.query(
          `SELECT cp.*, 
           u.name as user_name,
           u_created.name as created_by_name,
           (SELECT COUNT(*) FROM consumption_payments_details WHERE payment_id = cp.id) as consumptions_count
           FROM consumption_payments cp
           JOIN users u ON cp.user_id = u.id
           JOIN users u_created ON cp.created_by = u_created.id
           WHERE cp.status = 'pendiente'
           ORDER BY cp.payment_date DESC`
        );
        
        console.log(`  Resultado de consulta completa: ${fullQuery.length} registros`);
        
        if (fullQuery.length > 0) {
          console.log('  Primer resultado:', {
            id: fullQuery[0].id,
            user_name: fullQuery[0].user_name,
            created_by_name: fullQuery[0].created_by_name,
            amount: fullQuery[0].amount
          });
        }
        
      } catch (error) {
        console.log(`  ❌ Error en consulta completa:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error en debug:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    pool.end();
  }
};

// Ejecutar el script
debugPendingPayments();
