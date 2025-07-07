import { pool } from '../config/database.js';
import { isValidISODate, logDateDetails } from '../utils/dateUtils.js';

/**
 * Verifica si dos rangos de tiempo se solapan
 * @param {Date} start1 - Inicio del primer rango
 * @param {Date} end1 - Fin del primer rango
 * @param {Date} start2 - Inicio del segundo rango
 * @param {Date} end2 - Fin del segundo rango
 * @returns {boolean} - true si hay solapamiento, false en caso contrario
 */
const isOverlapping = (start1, end1, start2, end2) => {
  return (
    (start1 < end2 && end1 > start2) || // Solapamiento parcial o total
    (start2 < end1 && end2 > start1)    // Solapamiento inverso
  );
};

/**
 * Calcula la diferencia en milisegundos entre dos fechas
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {number} - Diferencia en milisegundos (siempre positiva)
 */
const getTimeDifference = (date1, date2) => {
  return Math.abs(date1.getTime() - date2.getTime());
};

export const getAllReservations = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    let query = `
      SELECT r.*, u.name as user_name, t.name as table_name 
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN tables t ON r.table_id = t.id
    `;
    
    let params = [];
    
    // Si no es admin, filtrar solo las reservas del usuario actual
    if (req.user.role !== 'admin') {
      query += ' WHERE r.user_id = ?';
      params.push(req.user.id);
    }
    
    // Ordenar por fecha
    query += ' ORDER BY r.start_time DESC';
    
    const [reservations] = await connection.query(query, params);
    connection.release();
    
    return res.status(200).json(reservations);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener reservas' });
  }
};

export const getReservationById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await pool.getConnection();
    
    const [reservations] = await connection.query(
      `SELECT r.*, u.name as user_name, t.name as table_name 
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`,
      [id]
    );
    
    connection.release();
    
    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    const reservation = reservations[0];
    
    // Verificar permisos: solo el propio usuario o un admin pueden ver sus reservas
    if (req.user.id !== reservation.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta reserva' });
    }
    
    return res.status(200).json(reservation);
  } catch (error) {
    console.error('Error al obtener reserva por ID:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener reserva' });
  }
};

export const createReservation = async (req, res) => {
  const { 
    tableId, 
    startTime, 
    endTime, 
    durationHours, 
    numMembers, 
    numGuests, 
    allDay, 
    reason 
  } = req.body;
  const userId = req.user.id;
  
  if (!tableId || !startTime || !endTime) {
    return res.status(400).json({ error: 'Se requieren todos los campos básicos (mesa, hora inicio, hora fin)' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Obtener la configuración de reservas
    console.log('Consultando la configuración de reservas...');
    const [configResult] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
    console.log('Resultado de la consulta:', JSON.stringify(configResult, null, 2));
    
    const config = configResult.length > 0 ? configResult[0] : {
      max_hours_per_reservation: 4,
      max_reservations_per_user_per_day: 1,
      min_hours_in_advance: 0,
      allowed_start_time: '08:00',
      allowed_end_time: '22:00',
      requires_approval_for_all_day: true,
      allow_consecutive_reservations: true,
      min_time_between_reservations: 30
    };
    
    // Log para depuración: mostrar valores de configuración
    console.log('=========== DEPURACIÓN RESERVAS ===========');
    console.log('Configuración cargada de la base de datos:');
    console.log('- allow_consecutive_reservations:', config.allow_consecutive_reservations);
    console.log('- min_time_between_reservations:', config.min_time_between_reservations);
    console.log('- Tipo de allow_consecutive_reservations:', typeof config.allow_consecutive_reservations);
    
    // Verificar que la mesa existe
    const [tables] = await connection.query('SELECT * FROM tables WHERE id = ?', [tableId]);
    
    if (tables.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
      // Verificar duración máxima según configuración
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    console.log("Datos recibidos:");
    console.log(`- startTime: ${startTime}`);
    console.log(`- endTime: ${endTime}`);
    console.log(`- durationHours: ${durationHours}`);
    
    // Registrar detalles completos de las fechas para depuración
    logDateDetails("Start Date", startDate);
    logDateDetails("End Date", endDate);
    
    const durationInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    
    console.log(`- Duración calculada: ${durationInHours} horas`);
    
    // Verificar que las fechas no estén invertidas
    if (startDate >= endDate) {
      connection.release();
      return res.status(400).json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
    }
    
    // Verificar que la duración es consistente
    if (Math.abs(durationInHours - durationHours) > 0.1) {
      console.log("Advertencia: La duración indicada no coincide con la duración calculada");
    }
    
    // Verificar fecha pasada
    const now = new Date();
    if (startDate < now) {
      connection.release();
      return res.status(400).json({ error: 'No se pueden realizar reservas en fechas u horas pasadas' });
    }
    
    // Verificar horas mínimas de antelación
    if (config.min_hours_in_advance > 0) {
      const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < config.min_hours_in_advance) {
        connection.release();
        return res.status(400).json({ 
          error: `Las reservas deben realizarse con al menos ${config.min_hours_in_advance} horas de antelación` 
        });
      }
    }
    
    // Verificar duración máxima de la reserva
    if (!allDay && durationInHours > config.max_hours_per_reservation) {
      connection.release();
      return res.status(400).json({ 
        error: `La reserva no puede durar más de ${config.max_hours_per_reservation} horas` 
      });
    }
      // Verificar que el usuario no supere el límite diario de reservas
    if (config.max_reservations_per_user_per_day > 0) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
        const [userReservationsToday] = await connection.query(
        `SELECT * FROM reservations 
         WHERE user_id = ? 
         AND status = 'active' 
         AND start_time >= ?
         AND start_time < ?`,
        [userId, startOfDay.toISOString(), endOfDay.toISOString()]
      );
      
      if (userReservationsToday.length >= config.max_reservations_per_user_per_day) {
        connection.release();
        return res.status(400).json({ 
          error: `Has alcanzado el límite de ${config.max_reservations_per_user_per_day} reservas por día` 
        });
      }
      
      // Si existen reservas previas para el mismo día, verificamos si hay restricciones adicionales
      if (userReservationsToday.length > 0) {
        // Para informar al usuario, calculamos las horas ya reservadas
        const totalReservedHours = userReservationsToday.reduce((total, res) => {
          const resStart = new Date(res.start_time);
          const resEnd = new Date(res.end_time);
          return total + ((resEnd.getTime() - resStart.getTime()) / (1000 * 60 * 60));
        }, 0);
        
        // Loguear información sobre las reservas existentes para depuración
        console.log(`Usuario ${userId} ya tiene ${userReservationsToday.length} reservas hoy con un total de ${totalReservedHours.toFixed(1)} horas`);
      }
    }
    
    // *** SOLUCIÓN DEFINITIVA: Verificar reservas consecutivas para la misma mesa ***
    console.log(`Valor de allow_consecutive_reservations: ${config.allow_consecutive_reservations}`);
    console.log(`Tipo de allow_consecutive_reservations: ${typeof config.allow_consecutive_reservations}`);
    
    // Si allow_consecutive_reservations es 0 (falso) o false, no se permiten reservas consecutivas
    if (config.allow_consecutive_reservations === 0 || config.allow_consecutive_reservations === false) {
      console.log('Verificando restricción de reservas consecutivas directamente en SQL para la mesa:', tableId);
      
      // SOLUCIÓN DEFINITIVA: Hacer la verificación directamente en SQL usando TIME() para extraer las horas
      // y compararlas exactamente sin problemas de conversión de fecha/hora
      const [consecutiveReservations] = await connection.query(
        `SELECT r.* 
         FROM reservations r
         WHERE r.table_id = ? 
         AND r.status = 'active'
         AND (
           -- Verificar si la hora de fin de una reserva existente coincide con la hora de inicio de la nueva
           TIME(r.end_time) = TIME(?)
           OR
           -- Verificar si la hora de fin de la nueva coincide con la hora de inicio de una existente
           TIME(r.start_time) = TIME(?)
         )
         -- Verificar que las fechas sean del mismo día
         AND DATE(r.start_time) = DATE(?)
         LIMIT 1`,
        [tableId, startTime, endTime, startTime]
      );
      
      console.log(`Consulta SQL para reservas consecutivas devolvió: ${consecutiveReservations.length} resultados`);
      
      // Si encontramos alguna reserva consecutiva, rechazamos la solicitud
      if (consecutiveReservations.length > 0) {
        console.log('¡RESERVA CONSECUTIVA DETECTADA POR SQL!');
        console.log('Reserva encontrada:', JSON.stringify(consecutiveReservations[0], null, 2));
        console.log(`Reserva existente: ${new Date(consecutiveReservations[0].start_time).toLocaleTimeString()} - ${new Date(consecutiveReservations[0].end_time).toLocaleTimeString()}`);
        console.log(`Nueva reserva: ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`);
        
        connection.release();
        return res.status(400).json({
          error: `No se permiten reservas consecutivas según la configuración actual. Debe haber un tiempo de separación entre reservas en la misma mesa.`
        });
      }
    }
    
    // Verificar tiempo mínimo entre reservas si está configurado
    // Asegurarnos de que esta validación también se aplique a todas las reservas de la mesa
    if (config.min_time_between_reservations > 0) {
      console.log(`Verificando tiempo mínimo entre reservas (${config.min_time_between_reservations} minutos)`);
      
      const minTime = config.min_time_between_reservations;
      
      // SOLUCIÓN DEFINITIVA: Usar SQL para verificar directamente si hay reservas que no cumplen con el tiempo mínimo
      const [reservationsWithInsufficientTime] = await connection.query(
        `SELECT r.* 
         FROM reservations r
         WHERE r.table_id = ? 
         AND r.status = 'active'
         AND DATE(r.start_time) = DATE(?)
         AND (
           -- Caso 1: La nueva reserva comienza después de una existente
           (
             r.end_time < ?  -- La reserva existente termina antes de que comience la nueva
             AND 
             TIMESTAMPDIFF(MINUTE, r.end_time, ?) < ?  -- Diferencia menor que el mínimo
           )
           OR
           -- Caso 2: La nueva reserva termina antes de una existente
           (
             r.start_time > ?  -- La reserva existente comienza después de que termine la nueva
             AND
             TIMESTAMPDIFF(MINUTE, ?, r.start_time) < ?  -- Diferencia menor que el mínimo
           )
         )
         LIMIT 1`,
        [tableId, startTime, startTime, startTime, minTime, endTime, endTime, minTime]
      );
      
      console.log(`SQL para tiempo mínimo devolvió: ${reservationsWithInsufficientTime.length} resultados`);
      
      // Si encontramos alguna reserva que no cumpla con el tiempo mínimo, rechazamos la solicitud
      if (reservationsWithInsufficientTime.length > 0) {
        console.log('¡TIEMPO INSUFICIENTE ENTRE RESERVAS DETECTADO!');
        console.log('Reserva encontrada:', JSON.stringify(reservationsWithInsufficientTime[0], null, 2));
        
        const resStart = new Date(reservationsWithInsufficientTime[0].start_time);
        const resEnd = new Date(reservationsWithInsufficientTime[0].end_time);
        
        // Calcular cuántos minutos faltan para cumplir el mínimo
        let minutesBetween = 0;
        if (resEnd < startDate) {
          // La reserva existente termina antes de que comience la nueva
          minutesBetween = Math.floor((startDate - resEnd) / (1000 * 60));
        } else {
          // La nueva reserva termina antes de que comience la existente
          minutesBetween = Math.floor((resStart - endDate) / (1000 * 60));
        }
        
        connection.release();
        return res.status(400).json({ 
          error: `Debe haber al menos ${config.min_time_between_reservations} minutos entre reservas de la misma mesa. Actualmente hay ${minutesBetween} minutos.` 
        });
      }
    }
      // Verificar que la mesa no está ya reservada en ese horario
    const [existingReservations] = await connection.query(
      `SELECT * FROM reservations 
       WHERE table_id = ? 
       AND status = 'active' 
       AND (
         (start_time < ? AND end_time > ?) OR
         (? >= start_time AND ? < end_time) OR
         (start_time >= ? AND end_time <= ?)
       )`,
      [tableId, endTime, startTime, startTime, startTime, startTime, endTime]
    );
    
    if (existingReservations.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'La mesa ya está reservada en ese horario' });
    }
      // Para reservas de todo el día, comprobar si requiere aprobación según configuración
    let approved = true;
    if (allDay && config.requires_approval_for_all_day && req.user.role !== 'admin') {
      approved = false; // Requiere aprobación de admin
      
      if (!reason) {
        connection.release();
        return res.status(400).json({ error: 'Se requiere un motivo para reservas de todo el día' });
      }
    }
    
    // Crear la reserva con los nuevos campos
    const [result] = await connection.query(
      `INSERT INTO reservations 
       (user_id, table_id, start_time, end_time, duration_hours, num_members, num_guests, all_day, reason, approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, tableId, startTime, endTime, durationHours || 1, 
       numMembers || 1, numGuests || 0, allDay || false, reason || null, approved]
    );
    
    // Obtener la reserva creada
    const [newReservation] = await connection.query(
      `SELECT r.*, u.name as user_name, t.name as table_name 
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    
    connection.release();
    
    return res.status(201).json({
      message: allDay && !approved ? 
        'Reserva enviada para aprobación de un administrador' : 
        'Reserva creada correctamente',
      reservation: newReservation[0]
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al crear reserva' });
  }
};

export const updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['active', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Estado de reserva inválido' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que la reserva existe
    const [reservations] = await connection.query('SELECT * FROM reservations WHERE id = ?', [id]);
    
    if (reservations.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    const reservation = reservations[0];
    
    // Verificar permisos: solo el propio usuario o un admin pueden modificar la reserva
    if (req.user.id !== reservation.user_id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: 'No tienes permiso para modificar esta reserva' });
    }
    
    // Actualizar el estado
    await connection.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      [status, id]
    );
    
    // Obtener la reserva actualizada
    const [updatedReservation] = await connection.query(
      `SELECT r.*, u.name as user_name, t.name as table_name 
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`,
      [id]
    );
    
    connection.release();
    
    return res.status(200).json({
      message: 'Estado de reserva actualizado correctamente',
      reservation: updatedReservation[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado de reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al actualizar reserva' });
  }
};

export const deleteReservation = async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que la reserva existe
    const [reservations] = await connection.query('SELECT * FROM reservations WHERE id = ?', [id]);
    
    if (reservations.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    const reservation = reservations[0];
    
    // Verificar permisos: solo el propio usuario o un admin pueden eliminar la reserva
    if (req.user.id !== reservation.user_id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reserva' });
    }
    
    // Eliminar la reserva
    await connection.query('DELETE FROM reservations WHERE id = ?', [id]);
    connection.release();
    
    return res.status(200).json({
      message: 'Reserva eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al eliminar reserva' });
  }
};

// Controlador para actualizar una reserva existente
export const updateReservation = async (req, res) => {
  const { id } = req.params;
  const { tableId, startTime, endTime, durationHours, numMembers, numGuests, allDay, reason } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que la reserva existe
    const [reservations] = await connection.query('SELECT * FROM reservations WHERE id = ?', [id]);
    
    if (reservations.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    const reservation = reservations[0];
    
    // Verificar permisos: solo el propio usuario o un admin pueden modificar la reserva
    if (req.user.id !== reservation.user_id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: 'No tienes permiso para modificar esta reserva' });
    }
    
    // Validar fechas
    if (startTime && !isValidISODate(startTime)) {
      connection.release();
      return res.status(400).json({ 
        error: 'Formato de fecha de inicio inválido. Debe ser ISO 8601' 
      });
    }
    
    if (endTime && !isValidISODate(endTime)) {
      connection.release();
      return res.status(400).json({ 
        error: 'Formato de fecha de fin inválido. Debe ser ISO 8601' 
      });
    }
    
    // Validar que la mesa está disponible para el nuevo horario
    if (tableId && startTime && endTime) {
      // Validación similar a la de creación de reservas
    }
    
    // Actualizar la reserva
    // Resto del código para actualizar la reserva...
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al actualizar reserva' });
  }
};
