import { pool } from '../config/database.js';

async function checkPostStatus() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Consultar todos los posts con su estado
    const [posts] = await connection.query(`
      SELECT id, title, status, CHAR_LENGTH(status) as length
      FROM blog_posts
    `);
    
    console.log('===== ESTADOS DE LOS POSTS EN LA BASE DE DATOS =====');
    posts.forEach(post => {
      console.log(`ID: ${post.id}, Título: ${post.title}`);
      console.log(`Status: '${post.status}', Tipo: ${typeof post.status}, Longitud: ${post.length}`);
      console.log(`Status en hex: ${Buffer.from(post.status).toString('hex')}`);
      console.log('---------------------------------------------------');
    });
    
    // Probar la consulta con filtro de status='published'
    const [publishedPosts] = await connection.query(`
      SELECT id, title
      FROM blog_posts 
      WHERE LOWER(status) = LOWER(?)
    `, ['published']);
    
    console.log(`\nPosts con status 'published': ${publishedPosts.length}`);
    publishedPosts.forEach(post => {
      console.log(`- ID: ${post.id}, Título: ${post.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

checkPostStatus();
