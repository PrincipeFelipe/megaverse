import { pool } from '../config/database.js';

const testPendingPayments = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('Probando la consulta de pagos pendientes...');
    
    // Simular la consulta que hace getPendingPayments
    const [payments] = await connection.query(
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
    
    console.log(`Encontrados ${payments.length} pagos pendientes:`);
    
    for (let payment of payments) {
      console.log(`\nPago ID: ${payment.id}`);
      console.log(`  Usuario: ${payment.user_name}`);
      console.log(`  Monto: ${payment.amount}`);
      console.log(`  Método: ${payment.payment_method}`);
      console.log(`  Fecha: ${payment.created_at}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Consumos asociados: ${payment.consumptions_count}`);
      
      // Obtener detalles de consumos para este pago
      const [details] = await connection.query(
        `SELECT cpd.*, c.total_price, p.name as product_name
         FROM consumption_payments_details cpd
         JOIN consumptions c ON cpd.consumption_id = c.id
         JOIN products p ON c.product_id = p.id
         WHERE cpd.payment_id = ?`,
        [payment.id]
      );
      
      console.log(`  Detalles: ${details.length} consumos`);
      details.forEach((detail, index) => {
        console.log(`    ${index + 1}. ${detail.product_name}: ${detail.total_price}€`);
      });
    }
    
  } catch (error) {
    console.error('Error al probar la consulta:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    pool.end();
  }
};

// Ejecutar el script
testPendingPayments();
