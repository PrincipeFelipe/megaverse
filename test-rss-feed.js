// Script para probar el feed RSS del blog
const testRSSFeed = async () => {
  console.log('🔄 Probando feed RSS del blog...');
  
  const API_URL = 'http://localhost:8090/api';
  const rssUrl = `${API_URL}/rss/blog`;
  
  try {
    console.log(`📡 Haciendo petición a: ${rssUrl}`);
    
    const response = await fetch(rssUrl);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rssContent = await response.text();
    console.log(`📊 Tamaño del contenido: ${rssContent.length} caracteres`);
    
    // Verificar que es XML válido
    if (rssContent.startsWith('<?xml')) {
      console.log('✅ El contenido es XML válido');
    } else {
      console.log('❌ El contenido no parece ser XML');
    }
    
    // Verificar elementos RSS básicos
    const hasRSSTag = rssContent.includes('<rss');
    const hasChannelTag = rssContent.includes('<channel>');
    const hasItemTags = rssContent.includes('<item>');
    
    console.log(`📊 Elementos RSS encontrados:`);
    console.log(`  - RSS tag: ${hasRSSTag ? '✅' : '❌'}`);
    console.log(`  - Channel tag: ${hasChannelTag ? '✅' : '❌'}`);
    console.log(`  - Item tags: ${hasItemTags ? '✅' : '❌'}`);
    
    // Contar número de items
    const itemMatches = rssContent.match(/<item>/g);
    const itemCount = itemMatches ? itemMatches.length : 0;
    console.log(`📊 Número de items encontrados: ${itemCount}`);
    
    // Mostrar una muestra del contenido
    console.log('\n📋 Muestra del contenido RSS:');
    console.log(rssContent.substring(0, 500) + '...');
    
    console.log('\n✅ Test del RSS completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error al probar el RSS:', error);
  }
};

// Ejecutar el test
testRSSFeed();
