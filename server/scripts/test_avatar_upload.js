/**
 * Script de prueba para verificar que el endpoint de upload de avatar funcione
 */

import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

const BASE_URL = 'http://localhost:8090/api';

async function testAvatarUpload() {
  try {
    console.log('🔐 Haciendo login...');
    
    // Login como usuario normal
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Error en login: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login exitoso como admin');
    
    // Test 1: Verificar que el endpoint existe
    console.log('\n📊 Test 1: Verificando endpoint /api/uploads/avatar...');
    
    const optionsResponse = await fetch(`${BASE_URL}/uploads/avatar`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`📡 Status del endpoint: ${optionsResponse.status}`);
    
    // Test 2: Intentar subir un avatar (simular con datos de prueba)
    console.log('\n📊 Test 2: Probando upload con datos simulados...');
    
    // Crear un FormData simulado para probar la ruta
    const formData = new FormData();
    
    // Crear un buffer de imagen simple (1x1 pixel PNG transparente)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
      0x00, 0x00, 0x00, 0x0D,                          // IHDR chunk length
      0x49, 0x48, 0x44, 0x52,                          // IHDR
      0x00, 0x00, 0x00, 0x01,                          // width: 1
      0x00, 0x00, 0x00, 0x01,                          // height: 1
      0x08, 0x02,                                      // bit depth: 8, color type: 2 (RGB)
      0x00, 0x00, 0x00,                               // compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE,                          // CRC
      0x00, 0x00, 0x00, 0x0C,                          // IDAT chunk length
      0x49, 0x44, 0x41, 0x54,                          // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,  // compressed data
      0xE2, 0x21, 0xBC, 0x33,                          // CRC
      0x00, 0x00, 0x00, 0x00,                          // IEND chunk length
      0x49, 0x45, 0x4E, 0x44,                          // IEND
      0xAE, 0x42, 0x60, 0x82                           // CRC
    ]);
    
    formData.append('avatar', pngBuffer, {
      filename: 'test-avatar.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await fetch(`${BASE_URL}/uploads/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log(`📡 Status del upload: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Upload exitoso');
      console.log('📋 Respuesta:', JSON.stringify(uploadData, null, 2));
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Error en upload:');
      console.log(`📋 Status: ${uploadResponse.status} ${uploadResponse.statusText}`);
      console.log(`📋 Error: ${errorText}`);
    }
    
    // Test 3: Verificar si el archivo de avatar se creó
    console.log('\n📊 Test 3: Verificando si el avatar se guardó...');
    
    const avatarPath = path.join(process.cwd(), 'uploads', 'avatars');
    if (fs.existsSync(avatarPath)) {
      const files = fs.readdirSync(avatarPath);
      console.log(`📁 Archivos en ${avatarPath}:`);
      files.forEach(file => console.log(`  - ${file}`));
    } else {
      console.log('❌ La carpeta de avatares no existe');
    }
    
    console.log('\n✅ Tests completados');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testAvatarUpload();
