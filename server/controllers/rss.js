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
      
      // Procesar posts (sin tags por ahora ya que la tabla no existe)
      const processedPosts = posts.map(post => ({
        ...post,
        tags: [] // Array vacío hasta que se implemente el sistema de tags
      }));
      
      // Configuración del feed
      const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
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
    
    // Limpiar contenido HTML para el RSS
    const cleanContent = post.content
      .replace(/<[^>]*>/g, '') // Eliminar tags HTML
      .replace(/&/g, '&amp;') // Escapar caracteres especiales
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    const cleanTitle = post.title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    const cleanExcerpt = post.excerpt
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    return `    <item>
      <title>${cleanTitle}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${cleanExcerpt}</description>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@megaverse.es (${post.author_name})</author>
      <category>${post.category}</category>
      ${post.tags && post.tags.length > 0 ? post.tags.map(tag => {
        const tagName = typeof tag === 'string' ? tag : (tag.name || tag);
        return `<category>${tagName}</category>`;
      }).join('\n      ') : ''}
    </item>`;
  }).join('\n');
  
  // Generar XML completo
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <description>${description}</description>
    <link>${link}</link>
    <language>${language}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>MEGAVERSE RSS Generator</generator>
    <atom:link href="${siteUrl}/api/rss/blog" rel="self" type="application/rss+xml"/>
    
${items}
  </channel>
</rss>`;
}
