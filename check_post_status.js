const { pool } = require('./server/config/database.js');

async function checkPostStatus() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DISTINCT status FROM blog_posts');
    console.log('Estados únicos encontrados en la tabla blog_posts:');
    rows.forEach(row => {
      console.log(- '' (tipo: ));
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

checkPostStatus();
