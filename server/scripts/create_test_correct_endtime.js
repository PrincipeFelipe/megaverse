import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createAllDayReservationWithCorrectEndTime() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_megaverse'
  });

  try {
    console.log('🔧 Creando reserva de todo el día con horario corregido...\n');

    // Obtener la configuración actual
    const [configResult] = await connection.execute('SELECT * FROM reservation_config WHERE id = 1');
    const config = configResult[0] || {
      allowed_start_time: '06:00',
      allowed_end_time: '23:00'
    };

    console.log('📋 Configuración actual:', {
      start: config.allowed_start_time,
      end: config.allowed_end_time
    });

    // Obtener un usuario y mesa válidos
    const [users] = await connection.execute('SELECT id, name FROM users LIMIT 1');
    const [tables] = await connection.execute('SELECT id, name FROM tables LIMIT 1');

    if (users.length === 0 || tables.length === 0) {
      console.log('❌ No hay usuarios o mesas disponibles');
      return;
    }

    const user = users[0];
    const table = tables[0];

    // Crear una fecha para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Configurar hora de inicio según la configuración
    const [startHours, startMinutes] = config.allowed_start_time.split(':').map(Number);
    const [endHours] = config.allowed_end_time.split(':').map(Number);

    // Hora de inicio
    const startTime = new Date(tomorrow);
    startTime.setHours(startHours, startMinutes, 0, 0);

    // Hora de fin: hasta el final de la última hora permitida
    // Si allowed_end_time es "23:00", la reserva termina a las "00:00" del día siguiente
    const endTime = new Date(tomorrow);
    let finalEndHour = endHours + 1;
    let nextDay = false;

    if (finalEndHour >= 24) {
      finalEndHour = 0;
      nextDay = true;
    }

    if (nextDay) {
      endTime.setDate(endTime.getDate() + 1);
    }

    endTime.setHours(finalEndHour, 0, 0, 0);

    // Calcular duración en horas
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    console.log('⏰ Horarios calculados:');
    console.log(`   📅 Fecha: ${startTime.toLocaleDateString()}`);
    console.log(`   🕰️  Inicio: ${startTime.toLocaleTimeString()}`);
    console.log(`   🕰️  Fin: ${endTime.toLocaleTimeString()}`);
    console.log(`   ⏱️  Duración: ${durationHours} horas`);
    console.log(`   📊 Configuración: ${config.allowed_start_time} - ${config.allowed_end_time}`);
    console.log(`   ✅ Fin corregido: Hasta el final de la hora ${config.allowed_end_time}\n`);

    // Crear la reserva de todo el día con horario correcto
    const [result] = await connection.execute(`
      INSERT INTO reservations (
        user_id, 
        table_id, 
        start_time, 
        end_time, 
        status, 
        all_day, 
        approved, 
        duration_hours,
        num_members,
        num_guests,
        reason,
        created_at
      ) VALUES (?, ?, ?, ?, 'active', 1, 1, ?, 1, 0, 'Prueba horario correcto', NOW())
    `, [
      user.id, 
      table.id, 
      startTime.toISOString(), 
      endTime.toISOString(),
      durationHours
    ]);

    console.log('✅ Reserva de todo el día creada exitosamente:');
    console.log(`   🆔 ID: ${result.insertId}`);
    console.log(`   👤 Usuario: ${user.name} (ID: ${user.id})`);
    console.log(`   🪑 Mesa: ${table.name} (ID: ${table.id})`);
    console.log(`   📅 Fecha: ${startTime.toLocaleDateString()}`);
    console.log(`   🕰️  Horario: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`   ⏱️  Duración: ${durationHours} horas`);
    console.log(`   🎯 Todo el día: ✅`);
    console.log(`   ✅ Aprobada: ✅`);
    console.log(`   📝 Motivo: Prueba horario correcto\n`);

    // Verificar que la reserva se guardó correctamente
    const [verification] = await connection.execute(`
      SELECT 
        r.*,
        u.name as user_name,
        t.name as table_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN tables t ON r.table_id = t.id
      WHERE r.id = ?
    `, [result.insertId]);

    const savedReservation = verification[0];
    console.log('🔍 Verificación de la reserva guardada:');
    console.log(`   📊 Hora inicio almacenada: ${savedReservation.start_time}`);
    console.log(`   📊 Hora fin almacenada: ${savedReservation.end_time}`);
    console.log(`   ⏱️  Duración almacenada: ${savedReservation.duration_hours} horas`);
    
    // Verificar que las horas son correctas
    const savedStart = new Date(savedReservation.start_time);
    const savedEnd = new Date(savedReservation.end_time);
    console.log(`   🔧 Hora inicio local: ${savedStart.toLocaleString()}`);
    console.log(`   🔧 Hora fin local: ${savedEnd.toLocaleString()}`);
    
    if (savedEnd.getHours() === finalEndHour && (nextDay ? savedEnd.getDate() === startTime.getDate() + 1 : savedEnd.getDate() === startTime.getDate())) {
      console.log('   ✅ ¡El horario de fin es CORRECTO! Termina al final de la última hora permitida.');
    } else {
      console.log('   ❌ El horario de fin NO es correcto.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

createAllDayReservationWithCorrectEndTime();
