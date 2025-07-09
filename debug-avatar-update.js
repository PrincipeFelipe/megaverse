/**
 * Script de debugging para verificar la actualización de avatar
 * Ejecutar en la consola del navegador
 */

console.log('🔍 INICIANDO DEBUG DE ACTUALIZACIÓN DE AVATAR v2.0');

// Función mejorada para debuggear el proceso de subida de avatar
function debugAvatarUpload() {
  console.log('\n=== ESTADO INICIAL ===');
  
  // 1. Verificar contexto de autenticación actual
  console.log('1. Estado del contexto de usuario:');
  
  // 2. Verificar avatar actual en el header
  const headerAvatar = document.querySelector('.avatar.avatar-header img, [data-testid="header-avatar"] img');
  if (headerAvatar) {
    console.log(`   - Avatar en header: ${headerAvatar.src}`);
    console.log(`   - Key del avatar: ${headerAvatar.getAttribute('key') || 'Sin key'}`);
  } else {
    console.log('   - ❌ No se encontró avatar en header');
  }
  
  // 3. Verificar avatar en ProfilePage (si estamos en esa página)
  const profileAvatar = document.querySelector('.avatar.avatar-profile img, [data-testid="profile-avatar"] img');
  if (profileAvatar) {
    console.log(`   - Avatar en perfil: ${profileAvatar.src}`);
    console.log(`   - Key del avatar: ${profileAvatar.getAttribute('key') || 'Sin key'}`);
  } else {
    console.log('   - ℹ️ No estamos en la página de perfil o no hay avatar');
  }
  
  console.log('\n=== INTERCEPTANDO LLAMADAS DE RED ===');
  
  // Interceptar fetch para monitorear llamadas relacionadas con avatar
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    // Solo monitorear llamadas relacionadas con avatares y perfil
    if (url.includes('/uploads/avatar') || url.includes('/auth/me') || url.includes('/auth/profile')) {
      console.log(`\n📡 LLAMADA DE RED INTERCEPTADA:`);
      console.log(`   URL: ${url}`);
      console.log(`   Método: ${options?.method || 'GET'}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);
      
      if (options?.body instanceof FormData) {
        console.log('   Tipo: FormData (subida de archivo)');
        for (let [key, value] of options.body.entries()) {
          if (value instanceof File) {
            console.log(`   - ${key}: ${value.name} (${value.size} bytes, ${value.type})`);
          } else {
            console.log(`   - ${key}: ${value}`);
          }
        }
      }
    }
    
    const response = await originalFetch.apply(this, args);
    
    // Interceptar la respuesta también
    if (url.includes('/uploads/avatar') || url.includes('/auth/me') || url.includes('/auth/profile')) {
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        console.log(`\n📥 RESPUESTA INTERCEPTADA:`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Timestamp: ${new Date().toISOString()}`);
        console.log('   Datos:', data);
        
        if (data.user && data.user.avatar_url) {
          console.log(`   ✅ Nueva URL de avatar: ${data.user.avatar_url}`);
        } else if (data.user) {
          console.log(`   ⚠️ Usuario sin avatar_url en respuesta`);
        } else if (data.avatar_url) {
          console.log(`   ✅ Avatar URL directo: ${data.avatar_url}`);
        }
      } catch (e) {
        console.log(`   ❌ Error al parsear respuesta: ${e.message}`);
      }
    }
    
    return response;
  };
  
  console.log('✅ Interceptor de red configurado');
  
  // 4. Monitorear cambios en el DOM más específicamente
  console.log('\n=== MONITOREANDO CAMBIOS EN DOM ===');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Monitorear cambios en atributos src de imágenes de avatar
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        const target = mutation.target;
        if (target.tagName === 'IMG' && (target.closest('.avatar') || target.getAttribute('alt') === 'Avatar')) {
          console.log(`\n🔄 CAMBIO DE AVATAR DETECTADO:`);
          console.log(`   Elemento: ${target.className}`);
          console.log(`   Nueva URL: ${target.src}`);
          console.log(`   Key: ${target.getAttribute('key') || 'Sin key'}`);
          console.log(`   Timestamp: ${new Date().toISOString()}`);
          
          // Verificar si es un blob (imagen temporal) o URL de servidor
          if (target.src.startsWith('blob:')) {
            console.log('   🔄 Es una imagen temporal (blob)');
          } else if (target.src.includes('/uploads/')) {
            console.log('   ✅ Es una imagen del servidor');
          } else {
            console.log('   ❓ Tipo de imagen desconocido');
          }
        }
      }
      
      // Monitorear cambios en keys también
      if (mutation.type === 'attributes' && mutation.attributeName === 'key') {
        const target = mutation.target;
        if (target.tagName === 'IMG' && target.closest('.avatar')) {
          console.log(`\n🔑 CAMBIO DE KEY DETECTADO:`);
          console.log(`   Elemento: ${target.className}`);
          console.log(`   Nueva Key: ${target.getAttribute('key')}`);
          console.log(`   URL: ${target.src}`);
        }
      }
      
      // Monitorear cuando se agregan/quitan elementos de avatar
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const avatarImages = node.querySelectorAll && node.querySelectorAll('.avatar img, [alt="Avatar"]');
            if (avatarImages && avatarImages.length > 0) {
              console.log(`\n➕ NUEVOS ELEMENTOS DE AVATAR AÑADIDOS: ${avatarImages.length}`);
              avatarImages.forEach((img, index) => {
                console.log(`   ${index + 1}. ${img.className} - ${img.src}`);
              });
            }
          }
        });
      }
    });
  });
  
  // Observar todo el body para cambios
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['src', 'key']
  });
  
  console.log('✅ Observer de DOM configurado');
  
  // 5. Añadir función para simular subida de avatar
  window.simulateAvatarUpload = () => {
    console.log('\n🎭 SIMULANDO SUBIDA DE AVATAR...');
    
    // Buscar input de archivo
    const fileInput = document.querySelector('input[type="file"][accept*="image"]');
    if (!fileInput) {
      console.error('❌ No se encontró input de archivo para avatar');
      return;
    }
    
    // Crear un archivo de prueba
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Dibujar algo simple
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TEST', 50, 50);
    
    // Convertir a blob
    canvas.toBlob((blob) => {
      const file = new File([blob], 'test-avatar.png', { type: 'image/png' });
      
      // Simular la selección del archivo
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      // Disparar evento change
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
      
      console.log('✅ Archivo de test agregado al input');
      console.log('💡 Ahora haz clic en "Guardar" para probar la subida');
    }, 'image/png');
  };
  
  console.log('\n=== INSTRUCCIONES MEJORADAS ===');
  console.log('1. Ve a la página de perfil (/profile)');
  console.log('2. Para test automático: simulateAvatarUpload()');
  console.log('3. O sube un archivo manualmente');
  console.log('4. Observa la consola para ver el flujo completo');
  console.log('5. Verifica que se actualice en el header automáticamente');
  console.log('\n⚠️ Para detener el debugging, ejecuta: stopAvatarDebug()');
  
  // Función para detener el debugging
  window.stopAvatarDebug = () => {
    window.fetch = originalFetch;
    observer.disconnect();
    delete window.simulateAvatarUpload;
    console.log('🛑 Debugging detenido - fetch y observer restaurados');
  };
  
  return {
    stopDebug: window.stopAvatarDebug,
    observer,
    originalFetch
  };
}

// Función para verificar el estado actual del contexto React mejorada
function checkReactContext() {
  console.log('\n=== VERIFICANDO CONTEXTO REACT ===');
  
  // Verificar localStorage para token
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ Token de autenticación presente');
    console.log(`   Token (primeros 20 chars): ${token.substring(0, 20)}...`);
    
    // Decodificar el token JWT para ver información
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📋 Info del token:');
      console.log(`   - Usuario ID: ${payload.userId || payload.id || 'No disponible'}`);
      console.log(`   - Rol: ${payload.role || 'No disponible'}`);
      console.log(`   - Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
    } catch (e) {
      console.warn('⚠️ No se pudo decodificar el token JWT');
    }
  } else {
    console.log('❌ No hay token de autenticación');
  }
  
  // Verificar variables de entorno
  console.log('\n📊 Variables de entorno:');
  console.log(`   - VITE_API_URL: ${import.meta?.env?.VITE_API_URL || 'No disponible'}`);
  
  // Verificar si podemos acceder a algún estado de React
  const reactFiberNodes = document.querySelectorAll('[data-reactroot] *');
  if (reactFiberNodes.length > 0) {
    console.log(`✅ Elementos React encontrados: ${reactFiberNodes.length}`);
  } else {
    console.log('❌ No se encontraron elementos React');
  }
}

// Función para hacer un test completo del avatar
function fullAvatarTest() {
  console.log('\n=== TEST COMPLETO DE AVATAR ===');
  
  // 1. Verificar estado actual
  checkReactContext();
  
  // 2. Iniciar debugging
  const session = debugAvatarUpload();
  
  // 3. Si estamos en la página de perfil, simular subida
  if (window.location.pathname === '/profile') {
    setTimeout(() => {
      console.log('\n🚀 Iniciando test automático en 3 segundos...');
      setTimeout(() => {
        if (window.simulateAvatarUpload) {
          window.simulateAvatarUpload();
        }
      }, 3000);
    }, 1000);
  } else {
    console.log('💡 Ve a /profile para hacer el test completo');
  }
  
  return session;
}

// Ejecutar debugging automáticamente
const debugSession = debugAvatarUpload();
checkReactContext();

// Hacer funciones disponibles globalmente
window.debugAvatarUpload = debugAvatarUpload;
window.checkReactContext = checkReactContext;
window.fullAvatarTest = fullAvatarTest;

console.log('\n💡 FUNCIONES DISPONIBLES:');
console.log('   - fullAvatarTest() - Test completo automático');
console.log('   - debugAvatarUpload() - Iniciar nuevo debugging');
console.log('   - checkReactContext() - Verificar estado React');
console.log('   - simulateAvatarUpload() - Simular subida (solo en /profile)');
console.log('   - stopAvatarDebug() - Detener debugging actual');

console.log('\n🎯 DEBUG CONFIGURADO v2.0 - Listo para probar subida de avatar');
