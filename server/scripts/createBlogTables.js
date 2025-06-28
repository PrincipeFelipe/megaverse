import { pool } from '../config/database.js';

/**
 * Script para crear las tablas necesarias para la funcionalidad del blog
 * Crea las tablas:
 * - blog_categories: Para categorías de posts
 * - blog_tags: Para etiquetas de posts
 * - blog_posts: Para publicaciones del blog
 * - blog_posts_tags: Tabla pivote para relación muchos a muchos entre posts y tags
 * - blog_comments: Para comentarios en los posts
 */

async function createBlogTables() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('Creando tablas para el blog...');
    
    // Tabla de categorías
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_blog_category_slug (slug)
      )
    `);
    console.log('Tabla blog_categories creada o ya existente');
    
    // Tabla de tags
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_blog_tag_slug (slug)
      )
    `);
    console.log('Tabla blog_tags creada o ya existente');
    
    // Tabla de posts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        content LONGTEXT NOT NULL,
        excerpt TEXT,
        image_url VARCHAR(255),
        author_id INT NOT NULL,
        category_id INT NOT NULL,
        status ENUM('draft', 'published') DEFAULT 'draft',
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE RESTRICT,
        INDEX idx_blog_post_slug (slug),
        INDEX idx_blog_post_status (status),
        INDEX idx_blog_post_featured (featured)
      )
    `);
    console.log('Tabla blog_posts creada o ya existente');
    
    // Tabla pivote para relación muchos a muchos entre posts y tags
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_posts_tags (
        post_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla blog_posts_tags creada o ya existente');
    
    // Tabla de comentarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blog_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        status ENUM('pending', 'approved', 'spam') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_blog_comment_status (status)
      )
    `);
    console.log('Tabla blog_comments creada o ya existente');
    
    // Insertar algunas categorías de ejemplo
    await connection.query(`
      INSERT IGNORE INTO blog_categories (name, slug, description) VALUES 
      ('General', 'general', 'Publicaciones generales de la asociación'),
      ('Eventos', 'eventos', 'Eventos organizados por la asociación'),
      ('Noticias', 'noticias', 'Noticias relacionadas con la asociación y sus actividades'),
      ('Tutoriales', 'tutoriales', 'Guías y tutoriales para socios')
    `);
    console.log('Categorías de ejemplo insertadas');
    
    // Insertar algunos tags de ejemplo
    await connection.query(`
      INSERT IGNORE INTO blog_tags (name, slug) VALUES 
      ('Importante', 'importante'),
      ('Comunidad', 'comunidad'),
      ('Actividades', 'actividades'),
      ('Reuniones', 'reuniones'),
      ('Consejos', 'consejos')
    `);
    console.log('Tags de ejemplo insertados');
    
    console.log('Todas las tablas del blog han sido creadas exitosamente');
  } catch (error) {
    console.error('Error al crear las tablas del blog:', error);
  } finally {
    if (connection) connection.release();
  }
}

// Ejecutar la función directamente
createBlogTables()
  .then(() => {
    console.log('Script de creación de tablas para blog completado');
  })
  .catch(error => {
    console.error('Error en el script de creación de tablas para blog:', error);
    process.exit(1);
  });

export default createBlogTables;
