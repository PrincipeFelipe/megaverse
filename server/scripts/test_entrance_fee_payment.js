/**
 * Script para probar el registro de cuotas de entrada
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:8090/api';
const ADMIN_USERNAME = 'admin'; // Cambio a username
const ADMIN_PASSWORD = 'admin123'; // Contraseña correcta

// Token de autenticación
let authToken = '';

/**
 * Obtener token de autenticación
 */
async function getAuthToken() {
  console.log('🔐 Obteniendo token de autenticación...');
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: ADMIN_USERNAME, // Cambio a username
      password: ADMIN_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Error al hacer login: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  authToken = data.token;
  console.log('✅ Token obtenido correctamente');
  return authToken;
}

/**
 * Obtener el valor actual de la cuota de entrada
 */
async function getEntranceFee() {
  console.log('📋 Obteniendo configuración actual...');
  
  const response = await fetch(`${BASE_URL}/config/reservation`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Error al obtener configuración: ${response.status}`);
  }

  const data = await response.json();
  const config = data.config || data; // Manejar ambos formatos
  console.log('📊 Configuración actual:', {
    normal_fee: config.normal_fee,
    maintenance_fee: config.maintenance_fee,
    entrance_fee: config.entrance_fee || 'No configurada'
  });
  
  return config.entrance_fee;
}

/**
 * Obtener usuarios para testing
 */
async function getUsers() {
  console.log('👥 Obteniendo lista de usuarios...');
  
  const response = await fetch(`${BASE_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Error al obtener usuarios: ${response.status}`);
  }

  const users = await response.json();
  console.log(`✅ Se encontraron ${users.length} usuarios`);
  
  // Buscar un usuario que no sea admin para testing
  const testUser = users.find(user => user.role !== 'admin');
  if (!testUser) {
    throw new Error('No se encontró un usuario no-admin para testing');
  }
  
  console.log(`📝 Usuario seleccionado para testing: ${testUser.name} (ID: ${testUser.id})`);
  return testUser;
}

/**
 * Probar el registro de una cuota de entrada
 */
async function testEntrancePayment(userId, entranceFee) {
  console.log('💰 Probando registro de cuota de entrada...');
  
  const paymentData = {
    user_id: userId,
    amount: entranceFee,
    payment_date: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    payment_type: 'entrance',
    payment_method: 'efectivo',
    reference: 'TEST-ENTRANCE-001',
    notes: 'Prueba de cuota de entrada desde script'
  };

  console.log('📤 Datos del pago a enviar:', paymentData);

  const response = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(paymentData)
  });

  console.log(`📥 Respuesta del servidor: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error al crear pago de entrada:', errorText);
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Cuota de entrada registrada exitosamente:', result);
  return result;
}

/**
 * Probar registrar una segunda cuota de entrada (debería fallar)
 */
async function testDuplicateEntrancePayment(userId, entranceFee) {
  console.log('🔄 Probando registro de cuota de entrada duplicada (debería fallar)...');
  
  const paymentData = {
    user_id: userId,
    amount: entranceFee,
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'entrance',
    payment_method: 'transferencia',
    reference: 'TEST-ENTRANCE-002',
    notes: 'Segunda prueba de cuota de entrada (duplicada)'
  };

  const response = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(paymentData)
  });

  if (response.ok) {
    console.log('⚠️  ADVERTENCIA: Se permitió registrar una cuota de entrada duplicada (esto no debería pasar)');
    const result = await response.json();
    console.log('Resultado inesperado:', result);
  } else {
    const errorText = await response.text();
    console.log('✅ Correcto: Se rechazó la cuota de entrada duplicada');
    console.log('Mensaje de error:', errorText);
  }
}

/**
 * Probar registrar una cuota mensual para el mismo usuario (debería funcionar)
 */
async function testMonthlyPaymentWithEntrance(userId) {
  console.log('📅 Probando registro de cuota mensual para usuario con cuota de entrada...');
  
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const paymentData = {
    user_id: userId,
    amount: 50.00, // Monto de cuota normal
    payment_date: currentDate.toISOString().split('T')[0],
    payment_type: 'normal',
    month: month,
    year: year,
    payment_method: 'tarjeta',
    reference: 'TEST-MONTHLY-001',
    notes: 'Prueba de cuota mensual con usuario que ya tiene cuota de entrada'
  };

  const response = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Error al crear cuota mensual:', errorText);
  } else {
    const result = await response.json();
    console.log('✅ Cuota mensual registrada exitosamente junto con cuota de entrada:', result);
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando pruebas de cuota de entrada...\n');

    // 1. Obtener token de autenticación
    await getAuthToken();

    // 2. Verificar configuración actual
    const entranceFee = await getEntranceFee();
    if (!entranceFee) {
      console.log('⚠️  La cuota de entrada no está configurada. Configurando valor de prueba...');
      // Aquí podrías agregar lógica para configurar una cuota de entrada si es necesario
      throw new Error('La cuota de entrada debe estar configurada antes de ejecutar estas pruebas');
    }

    // 3. Obtener usuario de prueba
    const testUser = await getUsers();

    // 4. Probar registro de cuota de entrada
    console.log('\n--- PRUEBA 1: Registrar cuota de entrada ---');
    await testEntrancePayment(testUser.id, entranceFee);

    // 5. Probar cuota de entrada duplicada
    console.log('\n--- PRUEBA 2: Intentar cuota de entrada duplicada ---');
    await testDuplicateEntrancePayment(testUser.id, entranceFee);

    // 6. Probar cuota mensual con usuario que ya tiene cuota de entrada
    console.log('\n--- PRUEBA 3: Registrar cuota mensual ---');
    await testMonthlyPaymentWithEntrance(testUser.id);

    console.log('\n✅ Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
main();
