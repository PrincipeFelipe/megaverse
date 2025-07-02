import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { format, startOfWeek, endOfWeek, addWeeks, formatISO } from 'date-fns';

dotenv.config();

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

async function assignCleaningDuty() {
  let connection;
  
  try {
    // Conectar a MySQL
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener la configuración actual
    const [configRows] = await connection.query('SELECT * FROM cleaning_config LIMIT 1');
    const config = configRows[0];
    
    if (!config) {
      console.error('Error: Configuración de limpieza no encontrada');
      return;
    }
    
    // Determinar la próxima semana
    const today = new Date();
    const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    const formattedWeekStart = format(nextWeekStart, 'yyyy-MM-dd');
    const formattedWeekEnd = format(nextWeekEnd, 'yyyy-MM-dd');
    
    // Verificar si ya existen asignaciones para la próxima semana
    const [existingAssignments] = await connection.query(
      'SELECT COUNT(*) AS count FROM cleaning_history WHERE week_start_date = ?',
      [formattedWeekStart]
    );
    
    if (existingAssignments[0].count > 0) {
      console.log('Ya existen asignaciones para la próxima semana');
      return;
    }
    
    // Obtener todos los usuarios elegibles (no exentos)
    const [users] = await connection.query(`
      SELECT u.id, u.name
      FROM users u
      WHERE u.id NOT IN (
        SELECT e.user_id 
        FROM cleaning_exemptions e 
        WHERE e.is_permanent = TRUE 
          OR (e.start_date <= CURRENT_DATE() AND (e.end_date IS NULL OR e.end_date >= CURRENT_DATE()))
      )
      ORDER BY u.id
    `);
    
    if (users.length < config.users_per_week) {
      console.error(`No hay suficientes usuarios elegibles. Se necesitan ${config.users_per_week}, pero solo hay ${users.length}.`);
      return;
    }
    
    // Obtener usuarios que no han sido asignados recientemente
    const [recentlyAssigned] = await connection.query(`
      SELECT user_id
      FROM cleaning_history
      WHERE week_start_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 4 WEEK)
      ORDER BY week_start_date DESC
    `);
    
    const recentlyAssignedIds = recentlyAssigned.map(row => row.user_id);
    
    // Filtrar usuarios que no han sido asignados recientemente
    let eligibleUsers = users.filter(user => !recentlyAssignedIds.includes(user.id));
    
    // Si no hay suficientes usuarios elegibles, tomar los que hace más tiempo que fueron asignados
    if (eligibleUsers.length < config.users_per_week) {
      // Obtener todos los usuarios ordenados por la fecha de su última asignación
      const [usersByLastAssignment] = await connection.query(`
        SELECT u.id, u.name, MAX(ch.week_start_date) as last_assignment
        FROM users u
        LEFT JOIN cleaning_history ch ON u.id = ch.user_id
        WHERE u.id NOT IN (
          SELECT e.user_id 
          FROM cleaning_exemptions e 
          WHERE e.is_permanent = TRUE 
            OR (e.start_date <= CURRENT_DATE() AND (e.end_date IS NULL OR e.end_date >= CURRENT_DATE()))
        )
        GROUP BY u.id, u.name
        ORDER BY last_assignment ASC NULLS FIRST, u.id ASC
      `);
      
      eligibleUsers = usersByLastAssignment.slice(0, config.users_per_week);
    } else {
      // Shuffle para aleatorizar la selección
      for (let i = eligibleUsers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligibleUsers[i], eligibleUsers[j]] = [eligibleUsers[j], eligibleUsers[i]];
      }
      eligibleUsers = eligibleUsers.slice(0, config.users_per_week);
    }
    
    // Iniciar transacción
    await connection.beginTransaction();
    
    try {
      // Crear nuevas asignaciones
      for (const user of eligibleUsers) {
        await connection.query(
          `INSERT INTO cleaning_history (user_id, week_start_date, week_end_date)
           VALUES (?, ?, ?)`,
          [user.id, formattedWeekStart, formattedWeekEnd]
        );
      }
      
      // Actualizar la fecha de última asignación
      await connection.query(
        'UPDATE cleaning_config SET last_assignment_date = CURRENT_TIMESTAMP WHERE id = ?',
        [config.id]
      );
      
      await connection.commit();
      
      console.log(`Asignaciones de limpieza para la semana del ${formattedWeekStart} al ${formattedWeekEnd} generadas correctamente:`);
      eligibleUsers.forEach(user => {
        console.log(`- ${user.name} (ID: ${user.id})`);
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error al asignar turnos de limpieza:', error);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// Ejecutar el script
assignCleaningDuty();
