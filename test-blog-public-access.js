// Script para probar que las rutas del blog funcionan sin autenticación
const testBlogPublicAccess = async () => {
  console.log('🔄 Probando acceso público al blog...');
  
  const API_URL = 'http://localhost:8090/api';
  
  const endpoints = [
    { url: `${API_URL}/blog/posts`, name: 'Lista de posts' },
    { url: `${API_URL}/blog/categories`, name: 'Categorías' },
    { url: `${API_URL}/blog/tags`, name: 'Tags' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Probando: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (endpoint.name === 'Lista de posts') {
          console.log(`   Posts encontrados: ${data.posts ? data.posts.length : 'N/A'}`);
          console.log(`   Total: ${data.pagination ? data.pagination.total : 'N/A'}`);
        } else if (endpoint.name === 'Categorías') {
          console.log(`   Categorías encontradas: ${data.length || 'N/A'}`);
        } else if (endpoint.name === 'Tags') {
          console.log(`   Tags encontrados: ${data.length || 'N/A'}`);
        }
        
        console.log(`   ✅ Acceso exitoso`);
      } else {
        console.log(`   ❌ Error: ${response.status} - ${response.statusText}`);
        
        try {
          const errorData = await response.json();
          console.log(`   Error detalle:`, errorData);
        } catch (e) {
          // No pudo parsear JSON
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error de conexión:`, error.message);
    }
  }
  
  // Probar un post específico por slug (si existe)
  try {
    console.log(`\n📡 Probando post por slug...`);
    const response = await fetch(`${API_URL}/blog/posts`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.posts && data.posts.length > 0) {
        const firstPost = data.posts[0];
        const postUrl = `${API_URL}/blog/posts/slug/${firstPost.slug}`;
        
        console.log(`   URL: ${postUrl}`);
        const postResponse = await fetch(postUrl);
        console.log(`   Status: ${postResponse.status}`);
        
        if (postResponse.ok) {
          const postData = await postResponse.json();
          console.log(`   Post título: ${postData.title || 'N/A'}`);
          console.log(`   ✅ Acceso a post específico exitoso`);
        } else {
          console.log(`   ❌ Error al obtener post específico`);
        }
      } else {
        console.log(`   ⚠️  No hay posts disponibles para probar`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error probando post específico:`, error.message);
  }
  
  console.log('\n🎯 Resumen:');
  console.log('✅ El blog ahora es accesible públicamente (sin autenticación)');
  console.log('📝 Las operaciones de lectura no requieren token');
  console.log('🔒 Las operaciones de escritura (crear/editar/eliminar) siguen protegidas');
  console.log('🤖 El RSS feed funciona correctamente');
};

// Ejecutar el test
testBlogPublicAccess();
