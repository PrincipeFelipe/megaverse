/**
 * Script de prueba para verificar que el filtro de tipo 'entrance' funcione
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';

async function testEntranceFilter() {
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
    
    // Test 1: Reporte con filtro de tipo 'entrance'
    console.log('\n📊 Test 1: Reporte filtrado por tipo "entrance"...');
    const entranceReportResponse = await fetch(`${BASE_URL}/payments/report?startDate=2025-07-01&endDate=2025-07-09&paymentType=entrance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!entranceReportResponse.ok) {
      throw new Error(`Error en reporte de entrada: ${entranceReportResponse.status}`);
    }
    
    const entranceReportData = await entranceReportResponse.json();
    console.log('✅ Reporte de entrada obtenido');
    
    console.log('📈 TOTALES PARA FILTRO "entrance":');
    entranceReportData.totals.forEach(total => {
      console.log(`🟠 ${total.payment_type}: ${total.count} pagos de ${total.users_count} usuarios - Total: €${total.total}`);
    });
    
    console.log(`\n📋 DETALLE DE PAGOS (${entranceReportData.payments.length} registros):`);
    entranceReportData.payments.forEach(payment => {
      console.log(`- ${payment.user_name} (${payment.payment_type}): €${payment.amount} - ${payment.payment_date}`);
    });
    
    // Verificar que todos los pagos sean de tipo 'entrance'
    const nonEntrancePayments = entranceReportData.payments.filter(p => p.payment_type !== 'entrance');
    if (nonEntrancePayments.length > 0) {
      console.log('❌ PROBLEMA: Se encontraron pagos que no son de tipo "entrance":');
      nonEntrancePayments.forEach(payment => {
        console.log(`  - ${payment.user_name} (${payment.payment_type}): €${payment.amount}`);
      });
    } else {
      console.log('✅ Todos los pagos en el reporte son de tipo "entrance"');
    }
    
    // Test 2: Comparar con reporte general para verificar que el filtro funcione
    console.log('\n📊 Test 2: Reporte general (todos los tipos) para comparación...');
    const generalReportResponse = await fetch(`${BASE_URL}/payments/report?startDate=2025-07-01&endDate=2025-07-09`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!generalReportResponse.ok) {
      throw new Error(`Error en reporte general: ${generalReportResponse.status}`);
    }
    
    const generalReportData = await generalReportResponse.json();
    console.log('✅ Reporte general obtenido');
    
    const generalEntranceTotal = generalReportData.totals.find(t => t.payment_type === 'entrance');
    const filteredEntranceTotal = entranceReportData.totals.find(t => t.payment_type === 'entrance');
    
    console.log('\n🔍 COMPARACIÓN DE TOTALES:');
    console.log(`📊 Reporte general - Cuotas de entrada: ${generalEntranceTotal?.count || 0} pagos, €${generalEntranceTotal?.total || 0}`);
    console.log(`📈 Reporte filtrado - Cuotas de entrada: ${filteredEntranceTotal?.count || 0} pagos, €${filteredEntranceTotal?.total || 0}`);
    
    if (generalEntranceTotal && filteredEntranceTotal) {
      if (generalEntranceTotal.count === filteredEntranceTotal.count && 
          generalEntranceTotal.total === filteredEntranceTotal.total) {
        console.log('✅ Los totales coinciden perfectamente');
      } else {
        console.log('❌ HAY DISCREPANCIA EN LOS TOTALES');
      }
    }
    
    console.log(`\n📋 Comparación de registros:`);
    console.log(`  - Reporte general: ${generalReportData.payments.length} pagos totales`);
    console.log(`  - Reporte filtrado: ${entranceReportData.payments.length} pagos de entrada`);
    
    const generalEntranceCount = generalReportData.payments.filter(p => p.payment_type === 'entrance').length;
    console.log(`  - Pagos de entrada en reporte general: ${generalEntranceCount}`);
    
    if (generalEntranceCount === entranceReportData.payments.length) {
      console.log('✅ El filtro funciona correctamente');
    } else {
      console.log('❌ El filtro NO está funcionando correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testEntranceFilter();
