import { pool as db } from '../config/database.js';
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';

// Obtener la configuración actual del sistema de limpieza
export const getCleaningConfig = async (req, res) => {
  try {
    const [config] = await db.query('SELECT * FROM cleaning_config LIMIT 1');
    
    if (config.length === 0) {
      return res.status(404).json({ message: 'Configuración de limpieza no encontrada' });
    }
    
    res.json(config[0]);
  } catch (error) {
    console.error('Error al obtener configuración de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar configuración del sistema de limpieza
export const updateCleaningConfig = async (req, res) => {
  try {
    const { usersPerWeek, rotationComplete } = req.body;
    
    const [result] = await db.query(
      'UPDATE cleaning_config SET users_per_week = ?, rotation_complete = ?, updated_at = CURRENT_TIMESTAMP',
      [usersPerWeek, rotationComplete]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Configuración de limpieza no encontrada' });
    }
    
    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar configuración de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener asignaciones actuales de limpieza
export const getCurrentCleaningAssignments = async (req, res) => {
  try {
    const today = new Date();
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    const [assignments] = await db.query(
      `SELECT ch.id, ch.user_id, ch.week_start_date, ch.week_end_date, ch.status,
              u.name, u.email
       FROM cleaning_history ch
       JOIN users u ON ch.user_id = u.id
       WHERE ch.week_start_date <= ? AND ch.week_end_date >= ?`,
      [weekEnd, weekStart]
    );
    
    res.json(assignments);
  } catch (error) {
    console.error('Error al obtener asignaciones actuales de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener historial de asignaciones de limpieza
export const getCleaningHistory = async (req, res) => {
  try {
    const [history] = await db.query(
      `SELECT ch.id, ch.user_id, ch.week_start_date, ch.week_end_date, ch.status, ch.feedback,
              u.name, u.email
       FROM cleaning_history ch
       JOIN users u ON ch.user_id = u.id
       ORDER BY ch.week_start_date DESC, u.name ASC`
    );
    
    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener historial de un usuario específico
export const getUserCleaningHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [history] = await db.query(
      `SELECT ch.id, ch.week_start_date, ch.week_end_date, ch.status, ch.feedback
       FROM cleaning_history ch
       WHERE ch.user_id = ?
       ORDER BY ch.week_start_date DESC`,
      [userId]
    );
    
    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial de limpieza del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar estado de una asignación de limpieza
export const updateCleaningStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, feedback } = req.body;
    
    const [result] = await db.query(
      'UPDATE cleaning_history SET status = ?, feedback = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, feedback || null, assignmentId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asignación de limpieza no encontrada' });
    }
    
    res.json({ message: 'Estado de limpieza actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Generar nuevas asignaciones de limpieza para la próxima semana
export const assignCleaningDuty = async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Obtener la configuración actual
      const [configRows] = await connection.query('SELECT * FROM cleaning_config LIMIT 1');
      const config = configRows[0];
      
      if (!config) {
        await connection.rollback();
        return res.status(404).json({ message: 'Configuración de limpieza no encontrada' });
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
        await connection.rollback();
        return res.status(400).json({ 
          message: `No hay suficientes usuarios elegibles. Se necesitan ${config.users_per_week}, pero solo hay ${users.length}.` 
        });
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
        await connection.rollback();
        return res.status(400).json({ 
          message: 'Ya existen asignaciones para la próxima semana' 
        });
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
      
      res.json({
        message: 'Asignaciones de limpieza generadas correctamente',
        assignments: eligibleUsers.map(user => ({
          userId: user.id,
          name: user.name,
          weekStartDate: formattedWeekStart,
          weekEndDate: formattedWeekEnd
        }))
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al asignar turnos de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Gestionar exenciones de limpieza
export const addCleaningExemption = async (req, res) => {
  try {
    const { userId, startDate, endDate, reason, isPermanent } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO cleaning_exemptions (user_id, start_date, end_date, reason, is_permanent)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, startDate, endDate || null, reason, isPermanent || false]
    );
    
    res.status(201).json({ 
      message: 'Exención de limpieza agregada correctamente',
      exemptionId: result.insertId
    });
  } catch (error) {
    console.error('Error al agregar exención de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener todas las exenciones
export const getCleaningExemptions = async (req, res) => {
  try {
    const [exemptions] = await db.query(`
      SELECT e.id, e.user_id, e.start_date, e.end_date, e.reason, e.is_permanent,
             u.name, u.email
      FROM cleaning_exemptions e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.start_date DESC
    `);
    
    res.json(exemptions);
  } catch (error) {
    console.error('Error al obtener exenciones de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar exención
export const deleteCleaningExemption = async (req, res) => {
  try {
    const { exemptionId } = req.params;
    
    const [result] = await db.query(
      'DELETE FROM cleaning_exemptions WHERE id = ?',
      [exemptionId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Exención de limpieza no encontrada' });
    }
    
    res.json({ message: 'Exención de limpieza eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar exención de limpieza:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
