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
    
    // 2. Crear un archivo de imagen de prueba si no existe
    const testImagePath = path.join(__dirname, 'test-avatar-upload.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('📷 Creando imagen de prueba...');
      
      // Crear una imagen PNG simple de 100x100 píxeles
      const canvas = require('canvas').createCanvas;
      const ctx = canvas(100, 100).getContext('2d');
      
      // Fondo azul
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, 100, 100);
      
      // Texto
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST', 50, 50);
      
      const buffer = canvas(100, 100).toBuffer('image/png');
      fs.writeFileSync(testImagePath, buffer);
      console.log('✅ Imagen de prueba creada');
    }
    
    // 3. Subir avatar
    console.log('📤 Subiendo avatar...');
    
    const form = new FormData();
    form.append('avatar', fs.createReadStream(testImagePath));
    
    const uploadResponse = await fetch(`${API_URL}/uploads/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload falló: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Avatar subido exitosamente');
    console.log('🎯 Nueva URL de avatar:', uploadData.user.avatar_url);
    
    // 4. Verificar que el perfil se actualizó
    console.log('🔍 Verificando perfil actualizado...');
    
    const profileResponse = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Profile fetch falló: ${profileResponse.status} ${profileResponse.statusText}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Perfil verificado');
    console.log('👤 Usuario:', profileData.name);
    console.log('🎯 Avatar en perfil:', profileData.avatar_url);
    
    // 5. Verificar que la imagen es accesible
    if (profileData.avatar_url) {
      console.log('🔍 Verificando accesibilidad de imagen...');
      
      // Construir URL completa
      const imageUrl = profileData.avatar_url.startsWith('http') 
        ? profileData.avatar_url 
        : `http://localhost:8090${profileData.avatar_url}`;
      
      console.log('🌐 URL de imagen:', imageUrl);
      
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        console.log('✅ Imagen accesible');
        console.log('📏 Tamaño:', imageResponse.headers.get('content-length'), 'bytes');
        console.log('🎨 Tipo:', imageResponse.headers.get('content-type'));
      } else {
        console.warn('⚠️ Imagen no accesible:', imageResponse.status, imageResponse.statusText);
      }
    }
    
    console.log('\n🎉 Test completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - Login: ✅`);
    console.log(`   - Subida: ✅`);
    console.log(`   - Perfil actualizado: ✅`);
    console.log(`   - Avatar URL: ${profileData.avatar_url}`);
    
  } catch (error) {
    console.error('\n❌ Error en el test:', error.message);
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
