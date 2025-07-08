import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkAllDayReservations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_megaverse'
  });

  try {
    console.log('🔍 Verificando reservas de todo el día...\n');

    // Consultar todas las reservas de todo el día
    const [allDayReservations] = await connection.execute(`
      SELECT 
        r.id,
        r.user_id,
        u.name as user_name,
        r.table_id,
        t.name as table_name,
        r.start_time,
        r.end_time,
        r.status,
        r.all_day,
        r.approved,
        r.duration_hours,
        r.reason
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN tables t ON r.table_id = t.id
      WHERE r.all_day = 1
      ORDER BY r.start_time DESC
    `);

    if (allDayReservations.length === 0) {
      console.log('❌ No se encontraron reservas de todo el día.');
      return;
    }

    console.log(`📋 Encontradas ${allDayReservations.length} reservas de todo el día:\n`);

    allDayReservations.forEach((reservation, index) => {
      const startDate = new Date(reservation.start_time);
      const endDate = new Date(reservation.end_time);
      
      console.log(`${index + 1}. Reserva ID: ${reservation.id}`);
      console.log(`   👤 Usuario: ${reservation.user_name} (ID: ${reservation.user_id})`);
      console.log(`   🪑 Mesa: ${reservation.table_name} (ID: ${reservation.table_id})`);
      console.log(`   📅 Fecha: ${startDate.toDateString()}`);
      console.log(`   ⏰ Horario: ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`);
      console.log(`   ⏱️  Duración: ${reservation.duration_hours} horas`);
      console.log(`   📋 Estado: ${reservation.status}`);
      console.log(`   ✅ Aprobada: ${reservation.approved ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   📝 Motivo: ${reservation.reason || 'Sin motivo especificado'}`);
      
      if (reservation.approved) {
        console.log('   🎯 Esta reserva debería mostrar TODAS las horas ocupadas en el calendario');
      } else {
        console.log('   ⏳ Esta reserva está pendiente de aprobación');
      }
      
      console.log('');
    });

    // Mostrar información específica sobre cómo se deberían mostrar en el calendario
    const approvedReservations = allDayReservations.filter(r => r.approved);
    const pendingReservations = allDayReservations.filter(r => !r.approved);

    console.log('📊 RESUMEN:');
    console.log(`   • Reservas aprobadas (mostrar por horas): ${approvedReservations.length}`);
    console.log(`   • Reservas pendientes (mostrar como evento de día completo): ${pendingReservations.length}`);
    
  } catch (error) {
    console.error('❌ Error consultando reservas:', error.message);
  } finally {
    await connection.end();
  }
}

checkAllDayReservations();
