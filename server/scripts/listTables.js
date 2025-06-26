import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listTables() {
  try {
    // Configuración de la conexión
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'db_megaverse',
      connectTimeout: 10000
    });
    
    console.log('Conexión a la base de datos establecida correctamente');
    
    // Mostrar todas las tablas
    console.log('Lista de tablas en la base de datos:');
    const [tables] = await connection.query('SHOW TABLES');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });
    
    // Verificar específicamente la tabla documents
    const [documentsTable] = await connection.query('SHOW TABLES LIKE "documents"');
    if (documentsTable.length > 0) {
      console.log('\nLa tabla "documents" existe.');
      
      // Mostrar estructura de la tabla documents
      console.log('\nEstructura de la tabla documents:');
      const [columns] = await connection.query('DESCRIBE documents');
      columns.forEach(column => {
        console.log(`- ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
      });
      
      // Contar registros en la tabla
      const [count] = await connection.query('SELECT COUNT(*) as total FROM documents');
      console.log(`\nLa tabla tiene ${count[0].total} registros.`);
    } else {
      console.log('\nLa tabla "documents" NO existe.');
    }
    
    connection.end();
  } catch (error) {
    console.error('Error al listar las tablas:', error);
  }
}

listTables();
