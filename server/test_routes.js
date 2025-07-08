// Script para probar si las rutas de consumption-payments funcionan
import fetch from 'node-fetch';

const baseURL = 'http://localhost:8090/api';

async function testRoutes() {
  console.log('🔍 Testing consumption-payments routes...');
  
  try {
    // Probar ruta de detalles de pago (debe dar 401 sin auth, pero no 404)
    const testId = 1;
    const response = await fetch(`${baseURL}/consumption-payments/${testId}/details`);
    
    console.log(`✅ Route /consumption-payments/${testId}/details responded with status: ${response.status}`);
    
    if (response.status === 404) {
      console.error('❌ Route not found! The route is not registered correctly.');
    } else if (response.status === 401) {
      console.log('✅ Route exists but requires authentication (expected behavior)');
    } else {
      const data = await response.text();
      console.log(`ℹ️ Response: ${data}`);
    }
    
    // Probar otra ruta para confirmar que el servidor está funcionando
    const healthResponse = await fetch(`${baseURL}/consumption-payments/pending`);
    console.log(`✅ Route /consumption-payments/pending responded with status: ${healthResponse.status}`);
    
  } catch (error) {
    console.error('❌ Error testing routes:', error.message);
    console.log('💡 Make sure the server is running on port 8090');
  }
}

testRoutes();
