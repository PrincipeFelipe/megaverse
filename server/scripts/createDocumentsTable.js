/**
 * Script para crear la tabla de documentos en la base de datos
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a la base de datos - debe coincidir con la del servidor
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse',
  connectTimeout: 10000
};

async function createDocumentsTable() {
  console.log('Creando tabla de documentos...');
  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    // Verificar si la tabla ya existe
    const [rows] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = ? AND table_name = 'documents'
    `, [DB_CONFIG.database]);

    if (rows.length > 0) {
      console.log('La tabla "documents" ya existe. Omitiendo creación.');
      return;
    }

    // Crear la tabla
    await connection.execute(`
      CREATE TABLE documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        uploaded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabla "documents" creada correctamente');
    
    // Crear índices para mejorar la búsqueda
    await connection.execute(`CREATE INDEX idx_documents_title ON documents(title)`);
    await connection.execute(`CREATE INDEX idx_documents_category ON documents(category)`);
    await connection.execute(`CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by)`);
    
    console.log('✅ Índices para la tabla "documents" creados correctamente');
    
  } catch (error) {
    console.error('❌ Error al crear la tabla de documentos:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar el script
createDocumentsTable()
  .then(() => {
    console.log('Script finalizado con éxito');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en script:', error);
    process.exit(1);
  });

// Exportar la función para usar en otros scripts
export default createDocumentsTable;
