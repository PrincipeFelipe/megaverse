/**
 * Test para verificar que la subida de avatar funciona después de eliminar express-fileupload
 */
import fs from 'fs';
import path from 'path';

const SERVER_URL = 'http://localhost:8090';

async function testAvatarUpload() {
  console.log('🧪 Testing avatar upload after removing express-fileupload middleware...\n');
  
  try {
    // 1. Intentar hacer login
    console.log('1. Logging in as test user...');
    const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
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
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText} - ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // 2. Crear un archivo de imagen de prueba pequeño
    console.log('\n2. Creating test image file...');
    const testImagePath = path.join(process.cwd(), 'test-avatar.png');
    
    // Crear una imagen PNG simple de 1x1 pixel (43 bytes)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    console.log(`✅ Test image created: ${testImagePath}`);
    
    // 3. Subir el avatar usando FormData con fetch
    console.log('\n3. Uploading avatar...');
    
    // Usar fetch con Blob para simular el navegador
    const imageBuffer = fs.readFileSync(testImagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('avatar', blob, 'test-avatar.png');
    
    const uploadResponse = await fetch(`${SERVER_URL}/api/uploads/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.text();
    console.log(`Upload response status: ${uploadResponse.status}`);
    console.log(`Upload response: ${uploadResult}`);
    
    if (uploadResponse.ok) {
      const uploadData = JSON.parse(uploadResult);
      console.log('✅ Avatar upload successful!');
      console.log(`📸 Avatar URL: ${uploadData.avatarUrl || uploadData.url}`);
    } else {
      console.log('❌ Avatar upload failed');
      console.log(`Error details: ${uploadResult}`);
    }
    
    // 4. Limpiar archivo de prueba
    try {
      fs.unlinkSync(testImagePath);
      console.log('\n🧹 Test file cleaned up');
    } catch (err) {
      console.log('⚠️ Could not clean up test file:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Limpiar archivo de prueba en caso de error
    try {
      const testImagePath = path.join(process.cwd(), 'test-avatar.png');
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
        console.log('🧹 Test file cleaned up after error');
      }
    } catch (cleanupErr) {
      console.log('⚠️ Could not clean up test file after error:', cleanupErr.message);
    }
  }
}

// Ejecutar el test
testAvatarUpload();
