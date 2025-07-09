/**
 * Script de prueba para verificar el rango específico del reporte
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';

async function testSpecificDateRange() {
  try {
    console.log('🔐 Haciendo login...');
    
    // Login como admin
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Error en login: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login exitoso');
    
    // Test con el rango específico de la imagen: 01/07/2025 a 09/07/2025
    console.log('\n📊 Test específico: 01/07/2025 a 09/07/2025...');
    const reportResponse = await fetch(`${BASE_URL}/payments/report?startDate=2025-07-01&endDate=2025-07-09`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!reportResponse.ok) {
      throw new Error(`Error en reporte: ${reportResponse.status}`);
    }
    
    const reportData = await reportResponse.json();
    console.log('✅ Reporte obtenido');
    console.log('📈 TOTALES POR TIPO EN EL RANGO:');
    reportData.totals.forEach(total => {
      console.log(`🔹 ${total.payment_type}: ${total.count} pagos de ${total.users_count} usuarios - Total: €${total.total}`);
    });
    
    console.log(`\n📋 DETALLE DE TODOS LOS PAGOS (${reportData.payments.length} registros):`);
    reportData.payments.forEach(payment => {
      console.log(`- ${payment.user_name} (${payment.payment_type}): €${payment.amount} - ${payment.payment_date}`);
    });
    
    // Test solo cuotas de entrada en el rango específico
    console.log('\n📊 Test solo cuotas de entrada: 01/07/2025 a 09/07/2025...');
    const entranceResponse = await fetch(`${BASE_URL}/payments/report?startDate=2025-07-01&endDate=2025-07-09&paymentType=entrance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!entranceResponse.ok) {
      throw new Error(`Error en reporte de entrada: ${entranceResponse.status}`);
    }
    
    const entranceData = await entranceResponse.json();
    console.log('✅ Reporte de entrada obtenido');
    console.log('📈 TOTALES PARA CUOTAS DE ENTRADA EN EL RANGO:');
    entranceData.totals.forEach(total => {
      console.log(`🟠 ${total.payment_type}: ${total.count} pagos de ${total.users_count} usuarios - Total: €${total.total}`);
    });
    
    console.log(`\n📋 DETALLE DE PAGOS DE ENTRADA (${entranceData.payments.length} registros):`);
    entranceData.payments.forEach(payment => {
      console.log(`- ${payment.user_name}: €${payment.amount} - ${payment.payment_date}`);
    });
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testSpecificDateRange();
