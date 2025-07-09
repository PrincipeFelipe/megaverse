/**
 * Test específico para verificar la actualización de componentes después de subir avatar
 * Ejecutar en la consola del navegador después de subir un avatar
 */

console.log('🧪 INICIANDO TEST DE ACTUALIZACIÓN DE COMPONENTES');

function testComponentUpdates() {
  console.log('\n=== VERIFICANDO ESTADO ACTUAL DE COMPONENTES ===');
  
  // 1. Verificar Header
  const headerAvatar = document.querySelector('.avatar.avatar-header img');
  if (headerAvatar) {
    console.log('🔔 HEADER:');
    console.log(`   - URL: ${headerAvatar.src}`);
    console.log(`   - Key: ${headerAvatar.getAttribute('key')}`);
    console.log(`   - Timestamp en URL: ${headerAvatar.src.includes('_t=') ? '✅' : '❌'}`);
  } else {
    console.log('🔔 HEADER: ❌ No se encontró imagen de avatar');
  }
  
  // 2. Verificar ProfilePage
  const profileAvatar = document.querySelector('.avatar.avatar-profile img');
  if (profileAvatar) {
    console.log('👤 PROFILE:');
    console.log(`   - URL: ${profileAvatar.src}`);
    console.log(`   - Key: ${profileAvatar.getAttribute('key')}`);
    console.log(`   - Timestamp en URL: ${profileAvatar.src.includes('_t=') ? '✅' : '❌'}`);
    console.log(`   - Es blob: ${profileAvatar.src.startsWith('blob:') ? '⚠️ Temporal' : '✅ Servidor'}`);
  } else {
    console.log('👤 PROFILE: ❌ No se encontró imagen de avatar');
  }
  
  // 3. Verificar localStorage
  const token = localStorage.getItem('token');
  if (token) {
    console.log('🔑 TOKEN: ✅ Presente');
  } else {
    console.log('🔑 TOKEN: ❌ No encontrado');
  }
  
  // 4. Probar fetch manual del perfil
  console.log('\n=== PROBANDO FETCH MANUAL DEL PERFIL ===');
  return testManualProfileFetch();
}

async function testManualProfileFetch() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token para hacer el test');
    return;
  }
  
  const API_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:5173/api';
  
  try {
    console.log(`📡 Haciendo petición a: ${API_URL}/auth/me`);
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📥 Respuesta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('👤 Datos del usuario desde servidor:', userData);
      
      if (userData.avatar_url) {
        console.log(`🖼️ Avatar URL del servidor: ${userData.avatar_url}`);
        
        // Construir URL completa del avatar
        const fullAvatarUrl = userData.avatar_url.startsWith('http') 
          ? userData.avatar_url 
          : `http://localhost:8090${userData.avatar_url}`;
        
        console.log(`🌐 URL completa del avatar: ${fullAvatarUrl}`);
        
        // Verificar si la imagen es accesible
        try {
          const imgResponse = await fetch(fullAvatarUrl);
          console.log(`🖼️ Imagen accesible: ${imgResponse.ok ? '✅' : '❌'} (${imgResponse.status})`);
        } catch (imgError) {
          console.error('🖼️ Error al verificar imagen:', imgError.message);
        }
        
        return userData;
      } else {
        console.log('🖼️ Usuario sin avatar en el servidor');
        return userData;
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Error en respuesta:', errorText);
    }
  } catch (error) {
    console.error('❌ Error en fetch:', error.message);
  }
}

function simulateContextUpdate() {
  console.log('\n=== SIMULANDO ACTUALIZACIÓN DE CONTEXTO ===');
  
  // Disparar eventos personalizados que podrían forzar actualizaciones
  const events = [
    'userUpdated',
    'avatarChanged',
    'profileRefresh'
  ];
  
  events.forEach(eventName => {
    const event = new CustomEvent(eventName, {
      detail: { 
        timestamp: Date.now(),
        source: 'manual-test' 
      }
    });
    document.dispatchEvent(event);
    console.log(`✅ Evento ${eventName} disparado`);
  });
  
  // Intentar forzar re-render cambiando el hash
  const originalHash = window.location.hash;
  window.location.hash = '#force-update-' + Date.now();
  setTimeout(() => {
    window.location.hash = originalHash;
    console.log('✅ Hash restaurado');
  }, 500);
  
  console.log('🔄 Esperando 1 segundo para ver cambios...');
  setTimeout(() => {
    testComponentUpdates();
  }, 1000);
}

function checkIfImagesAreCached() {
  console.log('\n=== VERIFICANDO CACHÉ DE IMÁGENES ===');
  
  const images = document.querySelectorAll('.avatar img');
  images.forEach((img, index) => {
    console.log(`📸 Imagen ${index + 1}:`);
    console.log(`   - URL: ${img.src}`);
    console.log(`   - Complete: ${img.complete}`);
    console.log(`   - Natural size: ${img.naturalWidth}x${img.naturalHeight}`);
    console.log(`   - Has timestamp: ${img.src.includes('_t=') ? '✅' : '❌'}`);
  });
}

// Función principal de test
async function runFullTest() {
  console.log('🚀 EJECUTANDO TEST COMPLETO...\n');
  
  // 1. Estado actual
  await testComponentUpdates();
  
  // 2. Verificar caché
  checkIfImagesAreCached();
  
  // 3. Simular actualización
  simulateContextUpdate();
  
  console.log('\n💡 INSTRUCCIONES:');
  console.log('1. Si las imágenes tienen timestamp (✅), el sistema anti-caché funciona');
  console.log('2. Si la URL del servidor tiene el avatar correcto, el backend funciona');
  console.log('3. Si los componentes no se actualizan, el problema está en React');
  console.log('\n🔧 COMANDOS DISPONIBLES:');
  console.log('   - testComponentUpdates() - Verificar estado actual');
  console.log('   - testManualProfileFetch() - Probar fetch del perfil');
  console.log('   - simulateContextUpdate() - Simular actualización');
  console.log('   - checkIfImagesAreCached() - Verificar caché de imágenes');
}

// Hacer funciones disponibles globalmente
window.testComponentUpdates = testComponentUpdates;
window.testManualProfileFetch = testManualProfileFetch;
window.simulateContextUpdate = simulateContextUpdate;
window.checkIfImagesAreCached = checkIfImagesAreCached;
window.runFullTest = runFullTest;

// Ejecutar automáticamente
runFullTest();
