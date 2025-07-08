import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createTestAllDayReservation() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_megaverse'
  });

  try {
    // Obtener un usuario y una mesa existentes
    const [users] = await connection.execute('SELECT id, name FROM users LIMIT 1');
    const [tables] = await connection.execute('SELECT id, name FROM tables LIMIT 1');

    if (users.length === 0 || tables.length === 0) {
      console.log('No hay usuarios o mesas disponibles para crear la reserva de prueba');
      return;
    }

    const user = users[0];
    const table = tables[0];

    // Crear una fecha para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const startTime = tomorrow.toISOString().slice(0, 19).replace('T', ' ');
    
    const endOfDay = new Date(tomorrow);
    endOfDay.setHours(23, 59, 59, 999);
    const endTime = endOfDay.toISOString().slice(0, 19).replace('T', ' ');

    // Crear la reserva de todo el día aprobada
    const [result] = await connection.execute(`
      INSERT INTO reservations (
        user_id, 
        table_id, 
        start_time, 
        end_time, 
        status, 
        duration_hours, 
        num_members, 
        num_guests, 
        all_day, 
        approved,
        reason,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, 'active', 14, 1, 0, 1, 1, 'Reserva de prueba para todo el día', NOW(), NOW())
    `, [user.id, table.id, startTime, endTime]);

    console.log('✅ Reserva de todo el día aprobada creada exitosamente:');
    console.log(`   - ID: ${result.insertId}`);
    console.log(`   - Usuario: ${user.name} (ID: ${user.id})`);
    console.log(`   - Mesa: ${table.name} (ID: ${table.id})`);
    console.log(`   - Fecha: ${tomorrow.toDateString()}`);
    console.log(`   - Horas: Todo el día (00:00 - 23:59)`);
    console.log(`   - Estado: Aprobada`);
    
  } catch (error) {
    console.error('❌ Error creando reserva de prueba:', error.message);
  } finally {
    await connection.end();
  }
}

createTestAllDayReservation();
