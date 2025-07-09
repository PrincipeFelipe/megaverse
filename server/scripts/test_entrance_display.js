/**
 * Script para verificar las cuotas de entrada en el listado de pagos
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function testEntrancePaymentsDisplay() {
  try {
    // 1. Login
    console.log('🔐 Haciendo login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
    });

    const { token } = await loginResponse.json();
    console.log('✅ Login exitoso');

    // 2. Obtener pagos
    console.log('📋 Obteniendo listado de pagos...');
    const paymentsResponse = await fetch(`${BASE_URL}/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const paymentsData = await paymentsResponse.json();
    console.log(`✅ Se obtuvieron ${paymentsData.payments.length} pagos`);

    // 3. Filtrar y mostrar cuotas de entrada
    const entrancePayments = paymentsData.payments.filter(p => p.payment_type === 'entrance');
    console.log(`\n🎯 Cuotas de entrada encontradas: ${entrancePayments.length}`);

    entrancePayments.forEach(payment => {
      console.log(`
📄 Pago ID: ${payment.id}
👤 Usuario: ${payment.user_name}
💰 Monto: €${payment.amount}
📅 Fecha: ${payment.payment_date}
🏷️  Tipo: ${payment.payment_type}
📆 Mes/Año: ${payment.month || 'null'}/${payment.year || 'null'}
📋 Método: ${payment.payment_method}
📝 Referencia: ${payment.reference || 'N/A'}
      `);
    });

    // 4. Verificar cuotas normales también
    const normalPayments = paymentsData.payments.filter(p => p.payment_type === 'normal').slice(0, 2);
    console.log(`\n📊 Ejemplo de cuotas normales (${normalPayments.length}):`);
    
    normalPayments.forEach(payment => {
      console.log(`
📄 Pago ID: ${payment.id}
👤 Usuario: ${payment.user_name}
🏷️  Tipo: ${payment.payment_type}
📆 Mes/Año: ${payment.month}/${payment.year}
      `);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEntrancePaymentsDisplay();
