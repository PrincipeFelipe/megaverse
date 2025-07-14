import { pool } from '../config/database.js';

/**
 * Controlador para generar feeds RSS del blog
 */
export const rssController = {
  /**
   * Genera un feed RSS con los posts más recientes del blog
   */
  getBlogRSSFeed: async (req, res) => {
    let connection;
    try {
      console.log('🔄 Generando feed RSS del blog...');
      
      connection = await pool.getConnection();
      
      // Consulta directa para obtener posts publicados (sin tags por ahora)
      const query = `
        SELECT 
          p.id, 
          p.title, 
          p.slug, 
          p.content,
          p.excerpt,
          p.image_url,
          p.author_id,
          p.created_at,
          p.updated_at,
          p.status,
          p.featured,
          u.name as author_name,
          c.name as category
        FROM blog_posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN blog_categories c ON p.category_id = c.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
        LIMIT 20
      `;
      
      const [posts] = await connection.execute(query);
      
      console.log(`📊 Encontrados ${posts.length} posts para RSS`);
      
      // Configuración del feed
      const siteUrl = process.env.SITE_URL || 'http://localhost:8090';
      
      // Procesar posts y convertir URLs relativas a absolutas
      const processedPosts = posts.map(post => {
        // Convertir URLs relativas de imágenes a absolutas en el contenido HTML
        let processedContent = post.content;
        
        // Reemplazar URLs relativas de imágenes con URLs absolutas en src y href
        processedContent = processedContent.replace(
          /(src|href)=["'](\/?[^"':]+)["']/gi,
          (match, attr, url) => {
            if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
              return `${attr}="${url}"`;
            }
            // Normalizar URL (asegurarse de que comienza con /)
            const normalizedUrl = url.startsWith('/') ? url : '/' + url;
            return `${attr}="${siteUrl}${normalizedUrl}"`;
          }
        );
        
        // También procesar background-image: url(...) en estilos inline
        processedContent = processedContent.replace(
          /background-image\s*:\s*url\(['"]?(\/?[^'")]+)['"]?\)/gi,
          (match, url) => {
            if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
              return `background-image: url('${url}')`;
            }
            const normalizedUrl = url.startsWith('/') ? url : '/' + url;
            return `background-image: url('${siteUrl}${normalizedUrl}')`;
          }
        );
        
        // Normalizar URL de imagen principal
        const normalizedImageUrl = post.image_url ? 
          (post.image_url.startsWith('http') ? 
            post.image_url : 
            `${siteUrl}${post.image_url.startsWith('/') ? post.image_url : '/' + post.image_url}`
          ) : null;
        
        // Verificar que post.excerpt existe antes de usarlo
        const excerpt = post.excerpt || '';
        
        return {
          ...post,
          content: processedContent,
          excerpt: excerpt,
          image_url: normalizedImageUrl,
          tags: [] // Array vacío hasta que se implemente el sistema de tags
        };
      });
      
      console.log('🖼️ Procesadas URLs de imágenes para el feed RSS');
      const feedTitle = 'MEGAVERSE - Blog';
      const feedDescription = 'Últimas noticias y artículos sobre juegos de mesa, wargames y Warhammer 40.000';
      const feedLanguage = 'es-ES';
      
      // Generar XML del RSS
      const rssXml = generateRSSXML({
        title: feedTitle,
        description: feedDescription,
        link: `${siteUrl}/blog`,
        language: feedLanguage,
        posts: processedPosts,
        siteUrl: siteUrl
      });
      
      // Configurar headers para XML
      res.set({
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache por 1 hora
      });
      
      console.log('✅ Feed RSS generado exitosamente');
      res.send(rssXml);
      
    } catch (error) {
      console.error('❌ Error generando feed RSS:', error);
      res.status(500).json({ error: 'Error interno del servidor al generar RSS' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
};

/**
 * Función para generar el XML del RSS
 */
function generateRSSXML({ title, description, link, language, posts, siteUrl }) {
  const now = new Date().toUTCString();
  
  // Generar items del RSS
  const items = posts.map(post => {
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.created_at).toUTCString();
    
    // Preparar contenido HTML para CDATA (mantener HTML intacto para imágenes)
    const fullContent = post.content;
    
    // Buscar todas las URL de imágenes dentro del contenido
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    const contentImages = [];
    let match;
    while ((match = imgRegex.exec(fullContent)) !== null) {
      const imageUrl = match[1];
      if (imageUrl && !imageUrl.startsWith('data:')) { // No incluir imágenes en base64
        contentImages.push(imageUrl);
      }
    }
    
    // Preparar la imagen de cabecera (si existe)
    const headerImageUrl = post.image_url ? 
      (post.image_url.startsWith('http') ? post.image_url : `${siteUrl}${post.image_url.startsWith('/') ? post.image_url : '/' + post.image_url}`) : 
      null;
    
    // Escapar título y excerpt para texto plano
    const cleanTitle = post.title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    // Crear item RSS con contenido HTML completo e imágenes
    let itemXml = `    <item>
      <title>${cleanTitle}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@megaverse.es (${post.author_name})</author>`;
    
    // Añadir categoría si existe
    if (post.category) {
      itemXml += `\n      <category>${post.category}</category>`;
    }
    
    // Añadir tags si existen
    if (post.tags && post.tags.length > 0) {
      itemXml += '\n      ' + post.tags.map(tag => {
        const tagName = typeof tag === 'string' ? tag : (tag.name || tag);
        return `<category>${tagName}</category>`;
      }).join('\n      ');
    }
    
    // Preparar el contenido para lectores RSS y otras plataformas
    // Insertar imagen destacada al comienzo del contenido (si existe)
    let enhancedContent = fullContent;
    let featuredImageHtml = '';
    
    // Preparamos HTML con la imagen principal visible al comienzo
    if (headerImageUrl) {
      featuredImageHtml = `<div class="featured-image" style="text-align:center;margin-bottom:20px;">
        <img src="${headerImageUrl}" alt="${cleanTitle}" style="max-width:100%;height:auto;" />
        <p style="font-style:italic;margin-top:5px;font-size:0.9em;">Imagen destacada: ${cleanTitle}</p>
      </div>`;
      
      // Añadir la imagen al comienzo del contenido
      enhancedContent = featuredImageHtml + enhancedContent;
    }
    
    // Añadir descripción con excerpt y contenido completo con CDATA
    const excerpt = post.excerpt || '';
    const cleanExcerpt = excerpt
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    itemXml += `\n      <description>${cleanExcerpt}</description>`;
    itemXml += `\n      <content:encoded><![CDATA[${enhancedContent}]]></content:encoded>`;
    
    // Añadir imagen de cabecera como enclosure si existe (formato RSS estándar)
    if (headerImageUrl) {
      // Usar type correcto basado en la extensión de archivo
      const imgType = headerImageUrl.toLowerCase().endsWith('.png') ? 'image/png' : 
                      headerImageUrl.toLowerCase().endsWith('.gif') ? 'image/gif' : 
                      'image/jpeg';
      
      // Multiple formatos para garantizar compatibilidad
      itemXml += `\n      <enclosure url="${headerImageUrl}" type="${imgType}" length="150000" />`;
      itemXml += `\n      <media:content url="${headerImageUrl}" medium="image" type="${imgType}" />`;
      itemXml += `\n      <image>${headerImageUrl}</image>`;
      itemXml += `\n      <thumbnail>${headerImageUrl}</thumbnail>`;
      itemXml += `\n      <media:thumbnail url="${headerImageUrl}" />`;
    }
    
    // Añadir metadatos de imágenes dentro del contenido
    if (contentImages.length > 0) {
      contentImages.forEach((imgUrl, index) => {
        const fullImgUrl = imgUrl.startsWith('http') ? imgUrl : `${siteUrl}${imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl}`;
        const imgType = fullImgUrl.toLowerCase().endsWith('.png') ? 'image/png' : 
                        fullImgUrl.toLowerCase().endsWith('.gif') ? 'image/gif' : 
                        'image/jpeg';
                        
        // Añadir en formato estándar
        itemXml += `\n      <media:content url="${fullImgUrl}" medium="image" type="${imgType}" />`;
        
        // Para la primera imagen del contenido, también añadirla como thumbnail alternativo
        if (index === 0 && !headerImageUrl) {
          itemXml += `\n      <enclosure url="${fullImgUrl}" type="${imgType}" length="150000" />`;
          itemXml += `\n      <image>${fullImgUrl}</image>`;
          itemXml += `\n      <thumbnail>${fullImgUrl}</thumbnail>`;
          itemXml += `\n      <media:thumbnail url="${fullImgUrl}" />`;
        }
      });
    }
    
    // Información de depuración sobre imágenes encontradas
    console.log(`📸 Post "${post.title}": imagen cabecera=${!!headerImageUrl}, imágenes contenido=${contentImages.length}`);
    
    itemXml += `\n    </item>`;
    return itemXml;
  }).join('\n');
  
  // Generar XML completo con todos los namespaces necesarios
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${title}</title>
    <description>${description}</description>
    <link>${link}</link>
    <language>${language}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>MEGAVERSE RSS Generator</generator>
    <atom:link href="${siteUrl}/api/rss/blog" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/favicon.svg</url>
      <title>${title}</title>
      <link>${link}</link>
    </image>
${items}
  </channel>
</rss>`;
}
