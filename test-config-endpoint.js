/**
 * Script para probar el endpoint de configuración directamente
 */

// Función para realizar una petición de prueba al endpoint
const testConfigEndpoint = async () => {
  try {
    console.log('🧪 Probando endpoint de configuración...');
    
    // Obtener configuración actual
    console.log('📥 Obteniendo configuración actual...');
    const getResponse = await fetch('http://localhost:8090/api/config/reservation');
    
    if (!getResponse.ok) {
      throw new Error(`Error GET: ${getResponse.status}`);
    }
    
    const currentConfig = await getResponse.json();
    console.log('📊 Configuración actual:', currentConfig.config.entrance_fee);
    
    // Simular actualización (requiere token de autenticación)
    console.log('⚠️ Nota: La actualización requiere autenticación');
    console.log('✅ Endpoint GET funciona correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testConfigEndpoint();
