/**
 * Script de prueba para el endpoint de reportes de pagos
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';

async function testPaymentReports() {
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
    
    // Test 1: Reporte general (todos los tipos)
    console.log('\n📊 Test 1: Reporte general (todos los tipos)...');
    const reportResponse1 = await fetch(`${BASE_URL}/payments/report?startDate=2025-01-01&endDate=2025-12-31`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!reportResponse1.ok) {
      throw new Error(`Error en reporte general: ${reportResponse1.status}`);
    }
    
    const reportData1 = await reportResponse1.json();
    console.log('✅ Reporte general obtenido');
    console.log('📈 TOTALES POR TIPO:');
    reportData1.totals.forEach(total => {
      console.log(`🔹 ${total.payment_type}: ${total.count} pagos de ${total.users_count} usuarios - Total: €${total.total}`);
    });
    
    // Test 2: Reporte específico para cuotas de entrada
    console.log('\n📊 Test 2: Reporte específico para cuotas de entrada...');
    const reportResponse2 = await fetch(`${BASE_URL}/payments/report?startDate=2025-01-01&endDate=2025-12-31&paymentType=entrance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!reportResponse2.ok) {
      throw new Error(`Error en reporte de entrada: ${reportResponse2.status}`);
    }
    
    const reportData2 = await reportResponse2.json();
    console.log('✅ Reporte de cuotas de entrada obtenido');
    console.log('📈 TOTALES PARA CUOTAS DE ENTRADA:');
    reportData2.totals.forEach(total => {
      console.log(`🟠 ${total.payment_type}: ${total.count} pagos de ${total.users_count} usuarios - Total: €${total.total}`);
    });
    
    console.log(`\n📋 DETALLE DE PAGOS DE ENTRADA (${reportData2.payments.length} registros):`);
    reportData2.payments.forEach(payment => {
      console.log(`- ${payment.user_name} (${payment.user_username}): €${payment.amount} - ${payment.payment_date}`);
    });
    
    // Test 3: Reporte específico para cuotas normales
    console.log('\n📊 Test 3: Reporte específico para cuotas normales...');
    const reportResponse3 = await fetch(`${BASE_URL}/payments/report?startDate=2025-07-01&endDate=2025-07-31&paymentType=normal`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!reportResponse3.ok) {
      throw new Error(`Error en reporte normal: ${reportResponse3.status}`);
    }
    
    const reportData3 = await reportResponse3.json();
    console.log('✅ Reporte de cuotas normales (julio) obtenido');
    console.log('📈 TOTALES PARA CUOTAS NORMALES EN JULIO:');
    reportData3.totals.forEach(total => {
      console.log(`🔵 ${total.payment_type}: ${total.count} pagos de ${total.users_count} usuarios - Total: €${total.total}`);
    });
    
  } catch (error) {
    console.error('❌ Error en test de reportes:', error.message);
  }
}

testPaymentReports();
