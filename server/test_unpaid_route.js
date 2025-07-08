// Script para verificar que la función getUnpaidConsumptions está funcionando correctamente
import fetch from 'node-fetch';

const baseURL = 'http://localhost:8090/api';

async function testUnpaidConsumptions() {
  console.log('🔍 Testing /consumptions/unpaid/:userId endpoint...');
  
  try {
    // Probar sin autenticación (debe dar 401 pero no 404)
    const testUserId = 1;
    const response = await fetch(`${baseURL}/consumptions/unpaid/${testUserId}`);
    
    console.log(`📍 Response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📋 Response: ${responseText}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (expected)');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found - route not registered correctly');
    } else {
      console.log('ℹ️ Unexpected response status');
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    console.log('💡 Make sure the server is running on port 8090');
  }
}

testUnpaidConsumptions();
