// Archivo para insertar asignaciones de limpieza actuales manualmente
import { pool as db } from '../config/database.js';
import { format, addDays } from 'date-fns';

async function insertCurrentCleaningAssignment() {
  try {
    // Obtener el usuario con ID 8 (Álvaro Martín Hernández)
    const [user] = await db.query('SELECT * FROM users WHERE id = 8');
    
    if (user.length === 0) {
      console.error('Usuario con ID 8 no encontrado');
      return;
    }
    
    console.log('Usuario encontrado:', user[0].name);
    
    // Obtener la fecha de inicio de la semana actual (lunes)
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    // Fechas para la semana actual
    const weekStart = format(now, 'yyyy-MM-dd');
    const weekEnd = format(addDays(now, 6), 'yyyy-MM-dd');
    
    console.log(`Insertando asignación para la semana del ${weekStart} al ${weekEnd}`);
    
    // Verificar si ya existe una asignación para este usuario en esta semana
    const [existingAssignment] = await db.query(
      `SELECT * FROM cleaning_history 
       WHERE user_id = ? AND DATE(week_start_date) <= ? AND DATE(week_end_date) >= ?`,
      [8, today, today]
    );
    
    if (existingAssignment.length > 0) {
      console.log('Ya existe una asignación para este usuario en la semana actual:', existingAssignment[0]);
      return;
    }
    
    // Insertar nueva asignación
    const [result] = await db.query(
      `INSERT INTO cleaning_history (user_id, week_start_date, week_end_date, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
      [8, weekStart, weekEnd]
    );
    
    console.log('Asignación insertada correctamente, ID:', result.insertId);
    
    // Verificar que se insertó correctamente
    const [inserted] = await db.query(
      'SELECT * FROM cleaning_history WHERE id = ?', 
      [result.insertId]
    );
    
    console.log('Asignación insertada:', inserted[0]);
    
  } catch (error) {
    console.error('Error al insertar asignación de limpieza:', error);
  } finally {
    db.end();
  }
}

insertCurrentCleaningAssignment();
