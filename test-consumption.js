// Script para probar la API de consumos directamente
// Para ejecutar: node test-consumption.js
import fetch from 'node-fetch';

const url = 'http://localhost:8090/api/consumptions';  // URL correcta con prefijo /api/
// Este es un token de ejemplo, deberías reemplazarlo por uno válido de tu sistema
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluIFVzZXIiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY4NzQ1MjEyMCwiZXhwIjoxNjg3NTM4NTIwfQ.random_signature_here';

async function testConsumptionAPI() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        productId: 1,  // ID de un producto que existe
        quantity: 1    // Cantidad a consumir
      })
    });
    
    console.log('Respuesta del servidor:', response.status);
    
    const data = await response.json();
    console.log('Datos:', data);
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

console.log('Ejecutando prueba de consumo...');
testConsumptionAPI();
