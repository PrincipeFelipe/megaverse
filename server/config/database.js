import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';

// Configurar dotenv para buscar el archivo .env en el directorio server
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('Database - Variables de entorno cargadas desde:', path.resolve(process.cwd(), '.env'));
console.log('Database - JWT_SECRET está configurado:', !!process.env.JWT_SECRET);

// Detectar si estamos usando XAMPP (Windows) o el comando mysql está disponible directamente
const mysqlPath = process.env.MYSQL_PATH || 'mysql';
console.log(`Usando MySQL desde: ${mysqlPath}`);

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse',
  // Aumentamos el timeout para sistemas más lentos
  connectTimeout: 10000
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función helper para ejecutar comandos SQL shell (útil para XAMPP)
function executeSql(sql, database = null) {
  try {
    const dbOption = database ? `-D ${database}` : '';
    const command = `"${mysqlPath}" -u ${process.env.DB_USER || 'root'} ${process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : ''} ${dbOption} -e "${sql}"`;
    console.log(`Ejecutando comando: ${command}`);
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error ejecutando SQL: ${error.message}`);
    return null;
  }
}

// Función para comprobar la conexión
async function testConnection() {
  try {
    // Intentar conectar con mysql2 primero
    try {
      const connection = await pool.getConnection();
      console.log('Conexión a la base de datos establecida correctamente');
      connection.release();
      return true;
    } catch (error) {
      console.warn('Error al conectar con mysql2:', error.message);
      
      // Si falla, intentar con shell command como fallback
      console.log('Intentando conectar usando comando shell...');
      const result = executeSql('SELECT 1');
      if (result !== null) {
        console.log('Conexión a la base de datos establecida correctamente (shell)');
        return true;
      }
      throw new Error('No se pudo conectar a la base de datos');
    }
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    return false;
  }
}

export { pool, testConnection };
