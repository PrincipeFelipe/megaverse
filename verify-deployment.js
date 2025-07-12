// Script para verificar que el despliegue en producción funciona correctamente
// Uso: node verify-deployment.js https://tudominio.com

const fetch = require('node-fetch');

const verifyDeployment = async (baseUrl) => {
  console.log(`🔍 Verificando despliegue en: ${baseUrl}`);
  
  const tests = [
    {
      name: 'Frontend',
      url: baseUrl,
      expectedStatus: 200,
      checkContent: (text) => text.includes('<title>MEGAVERSE')
    },
    {
      name: 'API Health',
      url: `${baseUrl}/api/health`,
      expectedStatus: 200,
      checkContent: (text) => {
        try {
          const data = JSON.parse(text);
          return data.status === 'OK';
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Blog Público',
      url: `${baseUrl}/api/blog/posts`,
      expectedStatus: 200,
      checkContent: (text) => {
        try {
          const data = JSON.parse(text);
          return Array.isArray(data.posts);
        } catch {
          return false;
        }
      }
    },
    {
      name: 'RSS Feed',
      url: `${baseUrl}/api/rss/blog`,
      expectedStatus: 200,
      checkContent: (text) => text.includes('<?xml') && text.includes('<rss')
    },
    {
      name: 'Categorías Públicas',
      url: `${baseUrl}/api/blog/categories`,
      expectedStatus: 200,
      checkContent: (text) => {
        try {
          const data = JSON.parse(text);
          return Array.isArray(data);
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Tags Públicos',
      url: `${baseUrl}/api/blog/tags`,
      expectedStatus: 200,
      checkContent: (text) => {
        try {
          const data = JSON.parse(text);
          return Array.isArray(data);
        } catch {
          return false;
        }
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n📡 Probando: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await fetch(test.url, {
        headers: {
          'User-Agent': 'MEGAVERSE-Deployment-Checker/1.0'
        }
      });
      
      const responseText = await response.text();
      
      console.log(`   Status: ${response.status}`);
      
      if (response.status === test.expectedStatus) {
        if (test.checkContent && !test.checkContent(responseText)) {
          console.log(`   ❌ Contenido inválido`);
          failed++;
        } else {
          console.log(`   ✅ OK`);
          passed++;
        }
      } else {
        console.log(`   ❌ Status incorrecto (esperado: ${test.expectedStatus})`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Resumen de Verificación:`);
  console.log(`   ✅ Pasaron: ${passed}`);
  console.log(`   ❌ Fallaron: ${failed}`);
  console.log(`   📈 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log(`\n🎉 ¡Despliegue verificado exitosamente!`);
    console.log(`\n🌐 URLs de Producción:`);
    console.log(`   Frontend: ${baseUrl}`);
    console.log(`   Blog: ${baseUrl}/blog`);
    console.log(`   RSS: ${baseUrl}/api/rss/blog`);
    console.log(`   Admin: ${baseUrl}/admin`);
  } else {
    console.log(`\n⚠️  Hay ${failed} problemas que necesitan atención.`);
  }
  
  console.log(`\n📋 Próximos pasos:`);
  console.log(`   1. Configurar automatización con Make usando: ${baseUrl}/api/rss/blog`);
  console.log(`   2. Configurar monitoreo y alertas`);
  console.log(`   3. Configurar backups automáticos`);
  console.log(`   4. Documentar procedimientos de mantenimiento`);
};

// Obtener URL de los argumentos de línea de comandos
const url = process.argv[2];

if (!url) {
  console.log('❌ Error: Debes proporcionar la URL base');
  console.log('Uso: node verify-deployment.js https://tudominio.com');
  process.exit(1);
}

// Ejecutar verificación
verifyDeployment(url).catch(error => {
  console.error('❌ Error durante la verificación:', error);
  process.exit(1);
});
