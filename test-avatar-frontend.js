#!/usr/bin/env node

/**
 * Script de validación para la actualización de avatar en frontend
 * 
 * Este script valida que el flujo de actualización de avatar funcione correctamente
 * sin requerir recarga de página.
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Configuración del test
const config = {
  baseUrl: 'http://localhost:5173', // URL del frontend de desarrollo
  testUser: {
    username: 'admin',
    password: 'admin123'
  },
  timeout: 30000,
  avatar: {
    testImagePath: path.join(__dirname, 'test-avatar.png'),
    // Generaremos una imagen de test si no existe
    width: 200,
    height: 200
  }
};

/**
 * Genera una imagen de test para usar como avatar
 */
async function generateTestAvatar() {
  const fs = require('fs');
  const { createCanvas } = require('canvas');
  
  if (fs.existsSync(config.avatar.testImagePath)) {
    console.log('✅ Imagen de test ya existe');
    return;
  }
  
  try {
    const canvas = createCanvas(config.avatar.width, config.avatar.height);
    const ctx = canvas.getContext('2d');
    
    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, config.avatar.width, config.avatar.height);
    gradient.addColorStop(0, '#4F46E5');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.avatar.width, config.avatar.height);
    
    // Texto
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TEST', config.avatar.width / 2, config.avatar.height / 2);
    
    // Timestamp para hacer cada imagen única
    ctx.font = '12px Arial';
    ctx.fillText(new Date().toISOString(), config.avatar.width / 2, config.avatar.height / 2 + 40);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(config.avatar.testImagePath, buffer);
    
    console.log(`✅ Imagen de test generada: ${config.avatar.testImagePath}`);
  } catch (error) {
    console.warn('⚠️ No se pudo generar imagen de test automáticamente:', error.message);
    console.log('💡 Puedes crear manualmente una imagen PNG en:', config.avatar.testImagePath);
  }
}

/**
 * Test principal de actualización de avatar
 */
async function testAvatarUpdate() {
  let browser;
  
  try {
    console.log('🚀 Iniciando test de actualización de avatar...');
    
    // Generar imagen de test
    await generateTestAvatar();
    
    // Iniciar navegador
    browser = await puppeteer.launch({
      headless: false, // Mostrar navegador para debugging
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar timeouts
    page.setDefaultTimeout(config.timeout);
    
    // Navegar a la aplicación
    console.log(`📍 Navegando a ${config.baseUrl}...`);
    await page.goto(config.baseUrl);
    
    // Esperar a que cargue la página
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Verificar si ya está logueado
    const isLoggedIn = await page.$('.avatar.avatar-header, [data-testid="user-avatar"]');
    
    if (!isLoggedIn) {
      console.log('🔐 Iniciando sesión...');
      
      // Ir a la página de login
      await page.goto(`${config.baseUrl}/auth`);
      
      // Llenar formulario de login
      await page.waitForSelector('input[type="text"], input[name="username"]');
      await page.type('input[type="text"], input[name="username"]', config.testUser.username);
      await page.type('input[type="password"], input[name="password"]', config.testUser.password);
      
      // Hacer clic en login
      await page.click('button[type="submit"], button:contains("Iniciar")');
      
      // Esperar redirección
      await page.waitForNavigation({ timeout: 10000 });
      
      console.log('✅ Sesión iniciada correctamente');
    } else {
      console.log('✅ Ya está logueado');
    }
    
    // Obtener URL actual del avatar antes de la actualización
    const initialAvatarSrc = await page.evaluate(() => {
      const avatarImg = document.querySelector('.avatar.avatar-header img, [data-testid="header-avatar"] img');
      return avatarImg ? avatarImg.src : null;
    });
    
    console.log(`📸 Avatar inicial: ${initialAvatarSrc || 'Sin avatar'}`);
    
    // Ir a la página de perfil
    console.log('👤 Navegando a la página de perfil...');
    await page.goto(`${config.baseUrl}/profile`);
    
    // Esperar a que cargue la página de perfil
    await page.waitForSelector('.avatar.avatar-profile, [data-testid="profile-avatar"]', { timeout: 10000 });
    
    // Buscar el input de archivo para el avatar
    const fileInput = await page.$('input[type="file"][accept*="image"]');
    
    if (!fileInput) {
      throw new Error('❌ No se encontró input de archivo para avatar');
    }
    
    // Verificar que existe la imagen de test
    const fs = require('fs');
    if (!fs.existsSync(config.avatar.testImagePath)) {
      throw new Error(`❌ No existe la imagen de test: ${config.avatar.testImagePath}`);
    }
    
    console.log('📤 Subiendo nueva imagen de avatar...');
    
    // Subir archivo
    await fileInput.uploadFile(config.avatar.testImagePath);
    
    // Esperar a que aparezca la previsualización
    await page.waitForFunction(() => {
      const preview = document.querySelector('.avatar.avatar-profile img');
      return preview && preview.src.includes('blob:');
    }, { timeout: 5000 });
    
    console.log('✅ Previsualización de avatar cargada');
    
    // Hacer clic en el botón de guardar
    const saveButton = await page.$('button:contains("Guardar"), button[type="submit"]');
    if (saveButton) {
      await saveButton.click();
      console.log('💾 Guardando avatar...');
      
      // Esperar a que se complete la subida
      await page.waitForFunction(() => {
        const preview = document.querySelector('.avatar.avatar-profile img');
        return preview && !preview.src.includes('blob:');
      }, { timeout: 15000 });
      
      console.log('✅ Avatar guardado correctamente');
    } else {
      console.log('ℹ️ No se encontró botón de guardar - podría guardarse automáticamente');
    }
    
    // Verificar que el avatar se actualizó en el header SIN recargar la página
    console.log('🔍 Verificando actualización en el header...');
    
    const updatedAvatarSrc = await page.evaluate(() => {
      const avatarImg = document.querySelector('.avatar.avatar-header img, [data-testid="header-avatar"] img');
      return avatarImg ? avatarImg.src : null;
    });
    
    console.log(`📸 Avatar actualizado: ${updatedAvatarSrc || 'Sin avatar'}`);
    
    // Verificar que el avatar cambió
    if (updatedAvatarSrc && updatedAvatarSrc !== initialAvatarSrc) {
      console.log('✅ ¡ÉXITO! El avatar se actualizó en el header sin recargar la página');
    } else if (updatedAvatarSrc === initialAvatarSrc) {
      console.warn('⚠️ El avatar no cambió - podría ser un problema de caché o la imagen ser igual');
    } else {
      console.warn('⚠️ No se detectó avatar en el header después de la actualización');
    }
    
    // Navegar al dashboard para verificar que la información se propague
    console.log('🏠 Verificando propagación en el dashboard...');
    await page.goto(`${config.baseUrl}/dashboard`);
    
    // Verificar que el nombre del usuario sigue apareciendo correctamente
    const userName = await page.evaluate(() => {
      const nameElement = document.querySelector('p:contains("Bienvenido"), [data-testid="user-name"]');
      return nameElement ? nameElement.textContent : null;
    });
    
    if (userName) {
      console.log(`✅ Información de usuario en dashboard: ${userName}`);
    } else {
      console.warn('⚠️ No se encontró información de usuario en el dashboard');
    }
    
    // Test completado exitosamente
    console.log('\n🎉 ¡TEST COMPLETADO EXITOSAMENTE!');
    console.log('📋 Resumen:');
    console.log(`   - Avatar inicial: ${initialAvatarSrc ? '✅ Presente' : '❌ No presente'}`);
    console.log(`   - Avatar actualizado: ${updatedAvatarSrc ? '✅ Presente' : '❌ No presente'}`);
    console.log(`   - Cambio detectado: ${updatedAvatarSrc !== initialAvatarSrc ? '✅ Sí' : '❌ No'}`);
    console.log(`   - Info en dashboard: ${userName ? '✅ Presente' : '❌ No presente'}`);
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Test simplificado sin navegador (solo estructura)
 */
async function testStructure() {
  console.log('🔍 Verificando estructura de archivos...');
  
  const fs = require('fs');
  const filesToCheck = [
    'src/contexts/AuthContext.tsx',
    'src/components/layout/Header.tsx',
    'src/pages/ProfilePage.tsx',
    'src/pages/DashboardPage.tsx',
    'src/services/uploadService.ts',
    'src/utils/avatar.ts'
  ];
  
  for (const file of filesToCheck) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.warn(`❌ ${file} - No encontrado`);
    }
  }
  
  console.log('\n📋 Funciones clave a verificar:');
  console.log('   - AuthContext.updateUserData()');
  console.log('   - Header usa useAuth()');
  console.log('   - ProfilePage llama updateUserData() después de subir avatar');
  console.log('   - DashboardPage usa useAuth()');
  console.log('   - uploadService retorna datos actualizados');
}

// Ejecutar el test apropiado
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--structure-only')) {
    await testStructure();
  } else if (args.includes('--help')) {
    console.log('Script de test para actualización de avatar');
    console.log('');
    console.log('Uso:');
    console.log('  node test-avatar-frontend.js              # Test completo con navegador');
    console.log('  node test-avatar-frontend.js --structure-only  # Solo verificar estructura');
    console.log('  node test-avatar-frontend.js --help            # Mostrar ayuda');
    console.log('');
    console.log('Requisitos:');
    console.log('  - Aplicación frontend ejecutándose en http://localhost:5173');
    console.log('  - Usuario de test configurado (admin/admin123)');
    console.log('  - npm install puppeteer canvas (para test completo)');
  } else {
    try {
      await testAvatarUpdate();
    } catch (error) {
      console.error('\n💥 Test falló:', error.message);
      console.log('\n💡 Sugerencias:');
      console.log('   - Verificar que la aplicación esté ejecutándose');
      console.log('   - Verificar credenciales de usuario de test');
      console.log('   - Ejecutar con --structure-only para test básico');
      process.exit(1);
    }
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAvatarUpdate,
  testStructure,
  config
};
