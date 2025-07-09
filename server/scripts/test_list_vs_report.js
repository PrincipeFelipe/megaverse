/**
 * Script de prueba para comparar listado vs reporte
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';

async function compareListVsReport() {
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
    
    // Test 1: Listado de pagos con filtros similares al reporte
    console.log('\n📊 Test 1: Listado de pagos (startDate=2025-07-01, endDate=2025-07-09)...');
    const listResponse = await fetch(`${BASE_URL}/payments?startDate=2025-07-01&endDate=2025-07-09&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!listResponse.ok) {
      throw new Error(`Error en listado: ${listResponse.status}`);
    }
    
    const listData = await listResponse.json();
    console.log('✅ Listado obtenido');
    console.log(`📋 TOTAL DE PAGOS EN LISTADO: ${listData.payments.length} registros`);
    
    // Contar por tipo
    const listTypeCounts = {};
    listData.payments.forEach(payment => {
      listTypeCounts[payment.payment_type] = (listTypeCounts[payment.payment_type] || 0) + 1;
    });
    
    console.log('📈 CONTEO POR TIPO EN LISTADO:');
    Object.keys(listTypeCounts).forEach(type => {
      console.log(`🔹 ${type}: ${listTypeCounts[type]} pagos`);
    });
    
    console.log('\n📋 DETALLE DE PAGOS DE ENTRADA EN LISTADO:');
    listData.payments
      .filter(p => p.payment_type === 'entrance')
      .forEach(payment => {
        console.log(`- ${payment.user_name}: €${payment.amount} - ${payment.payment_date}`);
      });
    
    // Test 2: Reporte con las mismas fechas
    console.log('\n📊 Test 2: Reporte de pagos (startDate=2025-07-01, endDate=2025-07-09)...');
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
    console.log(`📋 TOTAL DE PAGOS EN REPORTE: ${reportData.payments.length} registros`);
    
    console.log('📈 TOTALES POR TIPO EN REPORTE:');
    reportData.totals.forEach(total => {
      console.log(`🔹 ${total.payment_type}: ${total.count} pagos de ${total.users_count} usuarios - Total: €${total.total}`);
    });
    
    console.log('\n📋 DETALLE DE PAGOS DE ENTRADA EN REPORTE:');
    reportData.payments
      .filter(p => p.payment_type === 'entrance')
      .forEach(payment => {
        console.log(`- ${payment.user_name}: €${payment.amount} - ${payment.payment_date}`);
      });
    
    // Comparación
    const listEntranceCount = listData.payments.filter(p => p.payment_type === 'entrance').length;
    const reportEntranceCount = reportData.totals.find(t => t.payment_type === 'entrance')?.count || 0;
    
    console.log('\n🔍 COMPARACIÓN:');
    console.log(`📊 Listado de pagos: ${listEntranceCount} cuotas de entrada`);
    console.log(`📈 Reporte de pagos: ${reportEntranceCount} cuotas de entrada`);
    
    if (listEntranceCount !== reportEntranceCount) {
      console.log('❌ HAY DISCREPANCIA ENTRE LISTADO Y REPORTE');
    } else {
      console.log('✅ Listado y reporte coinciden');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

compareListVsReport();
