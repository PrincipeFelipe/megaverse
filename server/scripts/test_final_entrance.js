/**
 * Script final para probar con usuario diferente
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:8090/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';

async function getAuthToken() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
  });
  const data = await response.json();
  authToken = data.token;
  return authToken;
}

async function testWithDifferentUser() {
  await getAuthToken();
  
  // Probar con usuario ID 6 (Juan Ignacio)
  const userId = 6;
  const entranceFee = 200.00;
  
  console.log('🧪 Probando cuota mensual y de entrada con usuario ID 6...');

  // 1. Registrar cuota de entrada
  console.log('\n--- Registrando cuota de entrada ---');
  const entrancePayment = {
    user_id: userId,
    amount: entranceFee,
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'entrance',
    payment_method: 'transferencia',
    reference: 'TEST-ENTRANCE-USER6',
    notes: 'Cuota de entrada para usuario 6'
  };

  const entranceResponse = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(entrancePayment)
  });

  if (entranceResponse.ok) {
    const result = await entranceResponse.json();
    console.log('✅ Cuota de entrada registrada:', result.payment.id);
  } else {
    const error = await entranceResponse.text();
    console.log('❌ Error en cuota de entrada:', error);
  }

  // 2. Registrar cuota mensual para el mismo usuario
  console.log('\n--- Registrando cuota mensual ---');
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  
  const monthlyPayment = {
    user_id: userId,
    amount: 50.00,
    payment_date: currentDate.toISOString().split('T')[0],
    payment_type: 'normal',
    month: month,
    year: year,
    payment_method: 'tarjeta',
    reference: 'TEST-MONTHLY-USER6',
    notes: 'Cuota mensual para usuario 6'
  };

  const monthlyResponse = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(monthlyPayment)
  });

  if (monthlyResponse.ok) {
    const result = await monthlyResponse.json();
    console.log('✅ Cuota mensual registrada:', result.payment.id);
    console.log('🎉 Prueba exitosa: Usuario puede tener tanto cuota de entrada como cuota mensual');
  } else {
    const error = await monthlyResponse.text();
    console.log('❌ Error en cuota mensual:', error);
  }
}

testWithDifferentUser().catch(console.error);
