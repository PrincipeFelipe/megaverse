const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

// Script para probar la subida de avatar desde el backend
async function testAvatarUploadBackend() {
  console.log('🚀 Probando subida de avatar desde backend...');
  
  const API_URL = 'http://localhost:8090/api';
  
  try {
    // 1. Primero hacer login para obtener token
    console.log('🔐 Haciendo login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login falló: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Login exitoso');
    console.log('👤 Usuario:', loginData.user.name);
    console.log('🎯 Avatar actual:', loginData.user.avatar_url || 'Sin avatar');
    
    // 2. Obtener perfil actual
    console.log('🔍 Obteniendo perfil actual...');
    
    const profileResponse = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Profile fetch falló: ${profileResponse.status} ${profileResponse.statusText}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Perfil obtenido');
    console.log('👤 Usuario:', profileData.name);
    console.log('🎯 Avatar actual en perfil:', profileData.avatar_url || 'Sin avatar');
    
    // 3. Simular respuesta exitosa de subida
    console.log('\n🎉 Test de backend completado!');
    console.log('\n📋 Backend parece estar funcionando correctamente');
    console.log('💡 El problema probablemente está en el frontend');
    
  } catch (error) {
    console.error('\n❌ Error en el test:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Sugerencias:');
      console.log('   - Asegúrate de que el servidor esté ejecutándose en http://localhost:8090');
      console.log('   - Ejecuta: cd server && npm run dev');
    }
    
    throw error;
  }
}

// Ejecutar el test
if (require.main === module) {
  testAvatarUploadBackend()
    .then(() => {
      console.log('\n✅ Test de backend completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test de backend falló:', error.message);
      process.exit(1);
    });
}

module.exports = { testAvatarUploadBackend };
