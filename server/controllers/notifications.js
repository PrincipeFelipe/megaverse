import { pool } from '../config/database.js';

// Crear una nueva notificación
export const createNotification = async (userId, title, message, type = 'info', relatedEntityType = null, relatedEntityId = null) => {
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type, relatedEntityType, relatedEntityId]
    );
    
    connection.release();
    
    console.log(`✅ Notificación creada para usuario ${userId}: ${title}`);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
    throw error;
  }
};

// Obtener notificaciones de un usuario
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only = false, limit = 50 } = req.query;
    
    const connection = await pool.getConnection();
    
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    let params = [userId];
    
    if (unread_only === 'true') {
      query += ' AND read_status = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [notifications] = await connection.query(query, params);
    
    connection.release();
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener notificaciones' });
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    // Verificar que la notificación pertenece al usuario
    const [notifications] = await connection.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (notifications.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    // Marcar como leída
    await connection.query(
      'UPDATE notifications SET read_status = TRUE, read_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    return res.status(200).json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return res.status(500).json({ error: 'Error del servidor al marcar notificación como leída' });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE notifications SET read_status = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_status = FALSE',
      [userId]
    );
    
    connection.release();
    
    return res.status(200).json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return res.status(500).json({ error: 'Error del servidor al marcar notificaciones como leídas' });
  }
};

// Obtener conteo de notificaciones no leídas
export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND read_status = FALSE',
      [userId]
    );
    
    connection.release();
    
    return res.status(200).json({ unread_count: result[0].unread_count });
  } catch (error) {
    console.error('Error al obtener conteo de notificaciones no leídas:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener conteo de notificaciones' });
  }
};

// Eliminar notificación
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    // Verificar que la notificación pertenece al usuario
    const [notifications] = await connection.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (notifications.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    // Eliminar notificación
    await connection.query('DELETE FROM notifications WHERE id = ?', [id]);
    
    connection.release();
    
    return res.status(200).json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return res.status(500).json({ error: 'Error del servidor al eliminar notificación' });
  }
};
