/**
 * Script de prueba para verificar la carga correcta de fechas al editar pagos
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';

async function testPaymentDateLoading() {
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
    
    // Obtener algunos pagos para probar
    console.log('\n📊 Obteniendo lista de pagos...');
    const paymentsResponse = await fetch(`${BASE_URL}/payments?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!paymentsResponse.ok) {
      throw new Error(`Error al obtener pagos: ${paymentsResponse.status}`);
    }
    
    const paymentsData = await paymentsResponse.json();
    console.log('✅ Pagos obtenidos');
    
    if (paymentsData.payments.length === 0) {
      console.log('❌ No hay pagos disponibles para probar');
      return;
    }
    
    // Probar la carga de detalles de cada pago para verificar el formato de fecha
    console.log('\n🔍 Verificando formato de fechas en pagos:');
    
    for (let i = 0; i < Math.min(3, paymentsData.payments.length); i++) {
      const payment = paymentsData.payments[i];
      
      console.log(`\n📋 Pago #${payment.id}:`);
      console.log(`  - Usuario: ${payment.user_name}`);
      console.log(`  - Fecha original: ${payment.payment_date}`);
      console.log(`  - Formato esperado para input: ${payment.payment_date.split('T')[0]}`);
      console.log(`  - Tipo: ${payment.payment_type}`);
      
      // Verificar que la conversión de fecha sea correcta
      const originalDate = payment.payment_date;
      const inputFormat = originalDate.split('T')[0];
      
      // Validar que el formato sea YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(inputFormat)) {
        console.log(`  ✅ Formato de fecha correcto para input: ${inputFormat}`);
      } else {
        console.log(`  ❌ Formato de fecha incorrecto: ${inputFormat}`);
      }
      
      // Verificar que las fechas sean válidas
      const dateObj = new Date(inputFormat);
      if (!isNaN(dateObj.getTime())) {
        console.log(`  ✅ Fecha válida: ${dateObj.toLocaleDateString('es-ES')}`);
      } else {
        console.log(`  ❌ Fecha inválida`);
      }
    }
    
    // Probar obtener un pago específico por ID
    const testPaymentId = paymentsData.payments[0].id;
    console.log(`\n🎯 Probando obtener pago específico #${testPaymentId}...`);
    
    const specificPaymentResponse = await fetch(`${BASE_URL}/payments/${testPaymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!specificPaymentResponse.ok) {
      throw new Error(`Error al obtener pago específico: ${specificPaymentResponse.status}`);
    }
    
    const specificPaymentData = await specificPaymentResponse.json();
    const specificPayment = specificPaymentData.payment;
    
    console.log('✅ Pago específico obtenido');
    console.log(`📋 Detalles del pago #${specificPayment.id}:`);
    console.log(`  - Fecha original: ${specificPayment.payment_date}`);
    console.log(`  - Para el formulario: ${specificPayment.payment_date.split('T')[0]}`);
    console.log(`  - Usuario: ${specificPayment.user_name}`);
    console.log(`  - Importe: €${specificPayment.amount}`);
    console.log(`  - Tipo: ${specificPayment.payment_type}`);
    
    // Simular el procesamiento que haría el formulario
    const formattedForForm = {
      user_id: specificPayment.user_id,
      amount: specificPayment.amount,
      payment_date: specificPayment.payment_date.split('T')[0], // Esta es la corrección aplicada
      payment_type: specificPayment.payment_type,
      month: specificPayment.month,
      year: specificPayment.year,
      payment_method: specificPayment.payment_method,
      reference: specificPayment.reference || undefined,
      notes: specificPayment.notes || undefined
    };
    
    console.log('\n📝 Datos formateados para el formulario:');
    console.log(JSON.stringify(formattedForForm, null, 2));
    
    console.log('\n✅ Prueba completada. La fecha se debería cargar correctamente en el formulario de edición.');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testPaymentDateLoading();
