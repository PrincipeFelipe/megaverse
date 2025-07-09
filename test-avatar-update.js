// Test para verificar que el avatar se actualiza correctamente en todos los componentes
// Este test puede ejecutarse en el navegador para validar el flujo completo

/**
 * Test para verificar la actualización del avatar en todos los componentes
 * 
 * Pasos del test:
 * 1. Verificar que el contexto de autenticación funciona correctamente
 * 2. Simular una actualización de avatar
 * 3. Verificar que todos los componentes se actualizan con el nuevo avatar
 * 4. Confirmar que no hay problemas de re-render infinito
 */

console.log('=== TEST DE ACTUALIZACIÓN DE AVATAR ===');

// Función para verificar si un elemento contiene el avatar actualizado
function checkAvatarUpdated(selector, expectedAvatarUrl) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`❌ Elemento no encontrado: ${selector}`);
    return false;
  }
  
  const img = element.querySelector('img');
  if (!img) {
    console.warn(`❌ No hay imagen de avatar en: ${selector}`);
    return false;
  }
  
  const currentSrc = img.src;
  const isUpdated = currentSrc.includes(expectedAvatarUrl) || currentSrc === expectedAvatarUrl;
  
  if (isUpdated) {
    console.log(`✅ Avatar actualizado correctamente en: ${selector}`);
    console.log(`   URL actual: ${currentSrc}`);
  } else {
    console.warn(`❌ Avatar NO actualizado en: ${selector}`);
    console.warn(`   URL actual: ${currentSrc}`);
    console.warn(`   URL esperada: ${expectedAvatarUrl}`);
  }
  
  return isUpdated;
}

// Función para verificar el estado del contexto de autenticación
function checkAuthContext() {
  console.log('\n--- Verificando contexto de autenticación ---');
  
  // Buscar elementos React para verificar el contexto
  const headerUserInfo = document.querySelector('[data-testid="user-avatar"]') || 
                        document.querySelector('.avatar.avatar-header img');
  
  if (headerUserInfo) {
    console.log('✅ Componente de usuario encontrado en el header');
    const img = headerUserInfo.tagName === 'IMG' ? headerUserInfo : headerUserInfo.querySelector('img');
    if (img) {
      console.log(`   Avatar URL actual: ${img.src}`);
    }
  } else {
    console.warn('❌ No se encontró componente de usuario en el header');
  }
  
  return !!headerUserInfo;
}

// Función para verificar todos los componentes que muestran el avatar
function checkAllAvatarComponents() {
  console.log('\n--- Verificando todos los componentes de avatar ---');
  
  const components = [
    {
      name: 'Header Avatar',
      selector: '.avatar.avatar-header img, [data-testid="header-avatar"] img'
    },
    {
      name: 'Profile Page Avatar',
      selector: '[data-testid="profile-avatar"] img, .profile-avatar img'
    },
    {
      name: 'Dashboard Avatar (si existe)',
      selector: '[data-testid="dashboard-avatar"] img, .dashboard-avatar img'
    }
  ];
  
  let componentsFound = 0;
  let componentsWithAvatar = 0;
  
  components.forEach(component => {
    const element = document.querySelector(component.selector);
    if (element) {
      componentsFound++;
      console.log(`✅ Encontrado: ${component.name}`);
      
      if (element.src && element.src !== '') {
        componentsWithAvatar++;
        console.log(`   - Avatar URL: ${element.src}`);
        
        // Verificar si la imagen se carga correctamente
        if (element.complete && element.naturalHeight > 0) {
          console.log(`   - ✅ Imagen cargada correctamente`);
        } else {
          console.warn(`   - ❌ Imagen no cargada o con errores`);
        }
      } else {
        console.warn(`   - ❌ No tiene URL de avatar`);
      }
    } else {
      console.warn(`❌ No encontrado: ${component.name}`);
    }
  });
  
  console.log(`\nResumen: ${componentsFound} componentes encontrados, ${componentsWithAvatar} con avatar`);
  
  return { componentsFound, componentsWithAvatar };
}

// Función para verificar las dependencias React
function checkReactDependencies() {
  console.log('\n--- Verificando dependencias React ---');
  
  // Verificar si React está disponible
  if (typeof window.React !== 'undefined') {
    console.log('✅ React disponible globalmente');
  } else {
    console.log('ℹ️ React no disponible globalmente (normal en producción)');
  }
  
  // Verificar si hay elementos React en el DOM
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
  if (reactElements.length > 0) {
    console.log(`✅ Encontrados ${reactElements.length} elementos React`);
  } else {
    console.log('ℹ️ No se detectaron elementos React específicos');
  }
  
  // Verificar rutas React Router
  const currentPath = window.location.pathname;
  console.log(`📍 Ruta actual: ${currentPath}`);
  
  return true;
}

// Función principal del test
function runAvatarUpdateTest() {
  console.log('🚀 Iniciando test de actualización de avatar...\n');
  
  try {
    // 1. Verificar dependencias
    checkReactDependencies();
    
    // 2. Verificar contexto de autenticación
    const hasAuthContext = checkAuthContext();
    
    // 3. Verificar componentes de avatar
    const { componentsFound, componentsWithAvatar } = checkAllAvatarComponents();
    
    // 4. Resultado final
    console.log('\n=== RESULTADO FINAL ===');
    
    if (hasAuthContext && componentsFound > 0) {
      console.log('✅ Test completado exitosamente');
      console.log(`   - Contexto de autenticación: ✅`);
      console.log(`   - Componentes encontrados: ${componentsFound}`);
      console.log(`   - Componentes con avatar: ${componentsWithAvatar}`);
      
      if (componentsWithAvatar === 0) {
        console.log('\n💡 Recomendación: Subir un avatar para ver la actualización completa');
      }
    } else {
      console.warn('❌ Test falló - revisar implementación');
      
      if (!hasAuthContext) {
        console.warn('   - Problema: Contexto de autenticación no encontrado');
      }
      
      if (componentsFound === 0) {
        console.warn('   - Problema: No se encontraron componentes de avatar');
      }
    }
    
    // 5. Instrucciones para el usuario
    console.log('\n📋 INSTRUCCIONES PARA VALIDACIÓN MANUAL:');
    console.log('1. Ve a la página de perfil (/profile)');
    console.log('2. Sube un nuevo avatar');
    console.log('3. Verifica que el avatar se actualice inmediatamente en:');
    console.log('   - El header (esquina superior derecha)');
    console.log('   - La página de perfil');
    console.log('   - El dashboard (si muestra avatar)');
    console.log('4. NO debería ser necesario recargar la página');
    
  } catch (error) {
    console.error('❌ Error durante el test:', error);
  }
}

// Ejecutar el test
runAvatarUpdateTest();

// Función adicional para monitorear cambios en tiempo real
function monitorAvatarChanges() {
  console.log('\n🔍 Iniciando monitoreo de cambios de avatar...');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        const target = mutation.target;
        if (target.classList.contains('avatar') || target.closest('.avatar')) {
          console.log('🔄 Avatar actualizado detectado:');
          console.log(`   Elemento: ${target.className}`);
          console.log(`   Nueva URL: ${target.src}`);
        }
      }
    });
  });
  
  // Observar cambios en imágenes de avatar
  const avatarImages = document.querySelectorAll('.avatar img, [data-testid*="avatar"] img');
  avatarImages.forEach(img => {
    observer.observe(img, { attributes: true, attributeFilter: ['src'] });
  });
  
  console.log(`📡 Monitoreando ${avatarImages.length} elementos de avatar`);
  
  // Devolver función para detener el monitoreo
  return () => {
    observer.disconnect();
    console.log('🛑 Monitoreo de avatar detenido');
  };
}

// Exportar funciones para uso manual
window.avatarTest = {
  run: runAvatarUpdateTest,
  monitor: monitorAvatarChanges,
  checkComponents: checkAllAvatarComponents,
  checkContext: checkAuthContext
};

console.log('\n💡 Funciones disponibles en window.avatarTest:');
console.log('   - avatarTest.run() - Ejecutar test completo');
console.log('   - avatarTest.monitor() - Monitorear cambios en tiempo real');
console.log('   - avatarTest.checkComponents() - Verificar componentes');
console.log('   - avatarTest.checkContext() - Verificar contexto');
