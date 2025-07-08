/**
 * Script de prueba para el endpoint de deuda de usuario
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test del endpoint de deuda sin autenticación
async function testDebtEndpointNoAuth() {
  console.log('🔍 Testing /consumption-payments/debt endpoint without auth...');
  
  try {
    const response = await fetch(`${BASE_URL}/consumption-payments/debt`);
    const data = await response.text();
    
    console.log('📍 Response status:', response.status);
    console.log('📋 Response:', data);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (expected)');
    } else {
      console.log('❌ Unexpected response status');
    }
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

// Test del endpoint con diferentes rutas
async function testDebtEndpointVariations() {
  console.log('\n🔍 Testing endpoint variations...');
  
  const endpoints = [
    '/consumption-payments/debt',
    '/consumption-payments/debt/1',
    '/api/consumption-payments/debt'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📍 Testing: ${endpoint}`);
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const data = await response.text();
      
      console.log('   Status:', response.status);
      console.log('   Response:', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
    } catch (error) {
      console.log('   Error:', error.message);
    }
  }
}

// Ejecutar tests
async function runTests() {
  await testDebtEndpointNoAuth();
  await testDebtEndpointVariations();
}

runTests().catch(console.error);
