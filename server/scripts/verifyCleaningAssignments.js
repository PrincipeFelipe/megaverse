// Archivo para verificar asignaciones de limpieza actuales
import { pool as db } from '../config/database.js';

async function verifyCleaningAssignments() {
  try {
    // Consultar asignaciones actuales
    const [assignments] = await db.query(`
      SELECT ch.id, ch.user_id, ch.week_start_date, ch.week_end_date, ch.status,
             u.name, u.email
      FROM cleaning_history ch
      JOIN users u ON ch.user_id = u.id
      ORDER BY ch.week_start_date DESC
    `);

    console.log('Asignaciones de limpieza encontradas:', assignments.length);
    console.log('Asignaciones:', JSON.stringify(assignments, null, 2));

  } catch (error) {
    console.error('Error al verificar asignaciones de limpieza:', error);
  } finally {
    db.end();
  }
}

verifyCleaningAssignments();
