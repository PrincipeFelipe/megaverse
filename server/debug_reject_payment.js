// Script para debuggear el rechazo de pagos
import fetch from 'node-fetch';

const baseURL = 'http://localhost:8090/api';

async function debugRejectPayment() {
  console.log('🔍 Testing reject payment endpoint...');
  
  try {
    // Simular una petición de rechazo (sin auth, solo para ver el formato esperado)
    const testPayload = {
      rejection_reason: "Motivo de prueba"
    };
    
    console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(`${baseURL}/consumption-payments/12/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📍 Response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📋 Response body: ${responseText}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (expected)');
    } else if (response.status === 400) {
      console.log('❌ Bad Request - validation error');
      try {
        const errorData = JSON.parse(responseText);
        console.log('🔍 Error details:', errorData);
      } catch (e) {
        console.log('🔍 Raw error:', responseText);
      }
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found - route not registered');
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    console.log('💡 Make sure the server is running on port 8090');
  }
}

debugRejectPayment();
