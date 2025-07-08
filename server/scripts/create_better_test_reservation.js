import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createBetterTestReservation() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_megaverse'
  });

  try {
    // Crear una fecha para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Establecer hora de inicio a las 8:00 AM
    const startDate = new Date(tomorrow);
    startDate.setHours(8, 0, 0, 0);
    
    // Establecer hora de fin a las 10:00 PM (22:00)
    const endDate = new Date(tomorrow);
    endDate.setHours(22, 0, 0, 0);

    const startTime = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const endTime = endDate.toISOString().slice(0, 19).replace('T', ' ');

    // Obtener un usuario y una mesa diferentes
    const [users] = await connection.execute('SELECT id, name FROM users WHERE id != 1 LIMIT 1');
    const [tables] = await connection.execute('SELECT id, name FROM tables WHERE id != 1 LIMIT 1');

    if (users.length === 0 || tables.length === 0) {
      console.log('No hay usuarios o mesas disponibles');
      return;
    }

    const user = users[0];
    const table = tables[0];

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
      ) VALUES (?, ?, ?, ?, 'active', 14, 1, 0, 1, 1, 'Evento especial - Mesa reservada todo el día', NOW(), NOW())
    `, [user.id, table.id, startTime, endTime]);

    console.log('✅ Reserva de todo el día aprobada creada exitosamente:');
    console.log(`   - ID: ${result.insertId}`);
    console.log(`   - Usuario: ${user.name} (ID: ${user.id})`);
    console.log(`   - Mesa: ${table.name} (ID: ${table.id})`);
    console.log(`   - Fecha: ${tomorrow.toDateString()}`);
    console.log(`   - Inicio: ${startDate.toLocaleTimeString()}`);
    console.log(`   - Fin: ${endDate.toLocaleTimeString()}`);
    console.log(`   - Estado: Aprobada`);
    console.log('\n🎯 Esta reserva debería aparecer ocupando todas las horas desde las 8:00 hasta las 22:00');
    
  } catch (error) {
    console.error('❌ Error creando reserva:', error.message);
  } finally {
    await connection.end();
  }
}

createBetterTestReservation();
