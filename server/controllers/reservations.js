import { pool } from '../config/database.js';
import { isValidISODate, logDateDetails, isValidDate, safeParseDate } from '../utils/dateUtils.js';
import { createNotification } from './notifications.js';

export const getAllReservations = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Todos los usuarios pueden ver todas las reservas
    let query = `
      SELECT r.*, u.name as user_name, t.name as table_name 
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN tables t ON r.table_id = t.id
      ORDER BY r.start_time DESC
    `;
    
    const [reservations] = await connection.query(query);
    
    // Debug: Verificar si el campo reason está presente
    console.log('Debug - Reservations sample:', reservations.slice(0, 1).map(r => ({
      id: r.id,
      reason: r.reason,
      all_day: r.all_day,
      approved: r.approved,
      hasReason: r.reason !== null && r.reason !== undefined
    })));
    
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
    
    // Todos los usuarios pueden ver cualquier reserva
    return res.status(200).json(reservation);
  } catch (error) {
    console.error('Error al obtener reserva por ID:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener reserva' });
  }
};

export const createReservation = async (req, res) => {
  try {
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
    
    console.log('\n=== NUEVA SOLICITUD DE RESERVA ===');
    console.log('Datos recibidos del cliente:');
    console.log(JSON.stringify({
      tableId,
      startTime,
      endTime,
      durationHours,
      numMembers,
      numGuests,
      allDay,
      reason,
      userId
    }, null, 2));
    
    // 1. VALIDACIÓN BÁSICA DE DATOS REQUERIDOS
    if (!tableId) {
      return res.status(400).json({ error: 'Se requiere el ID de la mesa' });
    }
    
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Se requieren las horas de inicio y fin' });
    }
    
    // 2. ESTABLECER CONEXIÓN Y CARGAR CONFIGURACIÓN
    const connection = await pool.getConnection();
    
    try {
      // Obtener la configuración de reservas
      const [configResult] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
      const config = configResult.length > 0 ? configResult[0] : {
        max_hours_per_reservation: 4,
        max_reservations_per_user_per_day: 1,
        min_hours_in_advance: 0,
        allowed_start_time: '08:00',
        allowed_end_time: '22:00',
        requires_approval_for_all_day: true
      };
      
      console.log('Configuración de reservas:', JSON.stringify(config, null, 2));
      
      // 3. VALIDAR QUE LA MESA EXISTE
      const [tables] = await connection.query('SELECT * FROM tables WHERE id = ?', [tableId]);
      
      if (tables.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }
      
      console.log(`Mesa encontrada: ${tables[0].name} (ID: ${tables[0].id})`);
      
      // 4. PROCESAMIENTO Y VALIDACIÓN DE FECHAS
      let startDate, endDate, durationInHours;
      
      try {
        // Usar las nuevas utilidades para procesar las fechas de forma segura
        startDate = safeParseDate(startTime);
        endDate = safeParseDate(endTime);
        
        if (!startDate || !endDate) {
          throw new Error('No se pudieron parsear las fechas correctamente');
        }
        
        console.log('Fechas parseadas:');
        console.log(`- startDate (original): ${startTime}`);
        console.log(`- startDate (parseada): ${startDate.toISOString()}`);
        console.log(`- endDate (original): ${endTime}`);
        console.log(`- endDate (parseada): ${endDate.toISOString()}`);
        
        // Registrar información detallada para depuración
        logDateDetails("Start Date (Details)", startDate);
        logDateDetails("End Date (Details)", endDate);
        
        durationInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        console.log(`- Duración calculada: ${durationInHours.toFixed(2)} horas`);
      } catch (dateError) {
        console.error('Error procesando fechas:', dateError);
        connection.release();
        return res.status(400).json({ 
          error: 'Error al procesar las fechas. Asegúrate de enviar fechas ISO válidas.',
          details: dateError.message
        });
      }
      
      // 5. NORMALIZACIÓN DE VALORES
      const normalizedValues = {
        durationHours: typeof durationHours === 'string' ? parseFloat(durationHours) : (durationHours || durationInHours),
        numMembers: typeof numMembers === 'string' ? parseInt(numMembers, 10) : (numMembers || 1),
        numGuests: typeof numGuests === 'string' ? parseInt(numGuests, 10) : (numGuests || 0),
        allDay: typeof allDay === 'string' ? (allDay === 'true') : Boolean(allDay)
      };
      
      console.log('Valores normalizados:', JSON.stringify(normalizedValues, null, 2));
      
      // 6. VALIDACIONES DE REGLAS DE NEGOCIO
      
      // 6.1 Verificar que las fechas no estén invertidas
      if (startDate >= endDate) {
        connection.release();
        return res.status(400).json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
      }
      
      // 6.2 Verificar fecha pasada
      const now = new Date();
      if (startDate < now) {
        connection.release();
        return res.status(400).json({ error: 'No se pueden realizar reservas en fechas u horas pasadas' });
      }
      
      // 6.3 Verificar horas mínimas de antelación
      if (config.min_hours_in_advance > 0) {
        const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < config.min_hours_in_advance) {
          connection.release();
          return res.status(400).json({ 
            error: `Las reservas deben realizarse con al menos ${config.min_hours_in_advance} horas de antelación` 
          });
        }
      }
      
      // 6.4 Verificar duración máxima de la reserva
      if (!normalizedValues.allDay && durationInHours > config.max_hours_per_reservation) {
        connection.release();
        return res.status(400).json({ 
          error: `La reserva no puede durar más de ${config.max_hours_per_reservation} horas` 
        });
      }
      // 7. VERIFICAR LÍMITE DIARIO DE RESERVAS POR USUARIO
      if (config.max_reservations_per_user_per_day > 0) {
        const startOfDay = new Date(startDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(startOfDay);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        console.log(`Verificando límite diario para fecha: ${startDate.toISOString()}`);
        console.log(`Rango de búsqueda: ${startOfDay.toISOString()} a ${endOfDay.toISOString()}`);
        
        const [userReservationsToday] = await connection.query(
          `SELECT * FROM reservations 
           WHERE user_id = ? 
           AND status = 'active' 
           AND start_time >= ?
           AND start_time < ?`,
          [userId, startOfDay.toISOString(), endOfDay.toISOString()]
        );
        
        console.log(`Reservas encontradas hoy: ${userReservationsToday.length}`);
        
        if (userReservationsToday.length >= config.max_reservations_per_user_per_day) {
          connection.release();
          return res.status(400).json({ 
            error: `Has alcanzado el límite de ${config.max_reservations_per_user_per_day} reservas por día` 
          });
        }
        
        // Si existen reservas previas para el mismo día, calcular horas ya reservadas
        if (userReservationsToday.length > 0) {
          const totalReservedHours = userReservationsToday.reduce((total, res) => {
            const resStart = new Date(res.start_time);
            const resEnd = new Date(res.end_time);
            return total + ((resEnd.getTime() - resStart.getTime()) / (1000 * 60 * 60));
          }, 0);
          
          console.log(`Usuario ${userId} ya tiene ${userReservationsToday.length} reservas hoy con un total de ${totalReservedHours.toFixed(1)} horas`);
        }
      }
      
      // 8. VERIFICAR DISPONIBILIDAD DE LA MESA
      console.log(`Verificando disponibilidad de mesa ${tableId} entre ${startDate.toISOString()} y ${endDate.toISOString()}`);
      
      const [existingReservations] = await connection.query(
        `SELECT * FROM reservations 
         WHERE table_id = ? 
         AND status = 'active' 
         AND (
           (start_time < ? AND end_time > ?) OR
           (? >= start_time AND ? < end_time) OR
           (start_time >= ? AND start_time < ?)
         )`,
        [tableId, endTime, startTime, startTime, startTime, startTime, endTime]
      );
      
      if (existingReservations.length > 0) {
        console.log(`Mesa ${tableId} ya está reservada. Conflictos:`, 
                    existingReservations.map(r => `ID: ${r.id}, Inicio: ${r.start_time}, Fin: ${r.end_time}`));
        connection.release();
        return res.status(400).json({ error: 'La mesa ya está reservada en ese horario' });
      }
      
      // 9. VERIFICAR SI REQUIERE APROBACIÓN
      let approved = true;
      if (normalizedValues.allDay && config.requires_approval_for_all_day && req.user.role !== 'admin') {
        approved = false; // Requiere aprobación de admin
        
        if (!reason) {
          connection.release();
          return res.status(400).json({ error: 'Se requiere un motivo para reservas de todo el día' });
        }
      }
    
      // 10. INSERCIÓN EN LA BASE DE DATOS
      console.log('Procediendo a crear la reserva en la base de datos...');
      
      try {
        // Preparar las fechas ISO para inserción, asegurando que sean strings válidos
        const startTimeIso = startDate.toISOString();
        const endTimeIso = endDate.toISOString();
        
        console.log('Fechas para inserción SQL:');
        console.log(`- startTimeIso: ${startTimeIso}`);
        console.log(`- endTimeIso: ${endTimeIso}`);
        
        // Insertar en la base de datos con valores normalizados
        const [result] = await connection.query(
          `INSERT INTO reservations 
           (user_id, table_id, start_time, end_time, duration_hours, num_members, num_guests, all_day, reason, approved, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [
            userId, 
            tableId, 
            startTimeIso,
            endTimeIso, 
            parseFloat(normalizedValues.durationHours) || durationInHours || 1, 
            parseInt(normalizedValues.numMembers) || 1, 
            parseInt(normalizedValues.numGuests) || 0, 
            normalizedValues.allDay ? 1 : 0,  // Asegurar que sea 1 o 0 para MySQL
            reason || null, 
            approved ? 1 : 0  // Asegurar que sea 1 o 0 para MySQL
          ]
        );
        
        console.log(`Reserva creada con éxito. ID: ${result.insertId}`);
        
        // 11. OBTENER LA RESERVA CREADA
        const [newReservation] = await connection.query(
          `SELECT r.*, u.name as user_name, t.name as table_name 
           FROM reservations r
           JOIN users u ON r.user_id = u.id
           JOIN tables t ON r.table_id = t.id
           WHERE r.id = ?`,
          [result.insertId]
        );
        
        if (newReservation.length === 0) {
          throw new Error('No se pudo recuperar la reserva recién creada');
        }
        
        connection.release();
        
        // 12. ENVIAR RESPUESTA
        return res.status(201).json({
          message: normalizedValues.allDay && !approved ? 
            'Reserva enviada para aprobación de un administrador' : 
            'Reserva creada correctamente',
          reservation: newReservation[0]
        });
        
      } catch (sqlError) {
        console.error('Error SQL al insertar/recuperar la reserva:', sqlError);
        connection.release();
        return res.status(500).json({ 
          error: 'Error al crear la reserva en la base de datos',
          details: sqlError.message 
        });
      }
    } catch (error) {
      console.error('Error al procesar reserva:', error);
      if (connection) connection.release();
      return res.status(500).json({ 
        error: 'Error del servidor al crear reserva',
        details: error.message 
      });
    }
  } catch (globalError) {
    console.error('Error crítico al crear reserva:', globalError);
    return res.status(500).json({ 
      error: 'Error del servidor al procesar la solicitud',
      details: globalError.message
    });
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
    
    return res.status(200).json({ message: 'Reserva eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al eliminar reserva' });
  }
};

// Controlador para actualizar una reserva existente
export const updateReservation = async (req, res) => {
  const { id } = req.params;
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
    
    // Validar fechas y horas
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
      const [existingReservations] = await connection.query(
        `SELECT * FROM reservations 
         WHERE table_id = ?
         AND id != ?
         AND status = 'active'
         AND (
           (start_time < ? AND end_time > ?) OR
           (? >= start_time AND ? < end_time) OR
           (start_time >= ? AND end_time <= ?)
         )`,
        [tableId, id, endTime, startTime, startTime, startTime, startTime, endTime]
      );
      
      if (existingReservations.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'La mesa ya está reservada en ese horario' });
      }
    }
    
    // Obtener la configuración de reservas
    const [configResult] = await connection.query('SELECT * FROM reservation_config LIMIT 1');
    const config = configResult[0] || {};
    
    // Para reservas de todo el día, comprobar si requiere aprobación según configuración
    let approved = reservation.approved;
    if (allDay && allDay !== reservation.all_day && config.requires_approval_for_all_day && req.user.role !== 'admin') {
      approved = false; // Requiere aprobación de admin si se cambia a reserva de todo el día
      
      if (!reason) {
        connection.release();
        return res.status(400).json({ error: 'Se requiere un motivo para reservas de todo el día' });
      }
    }
    
    // Actualizar la reserva con los campos proporcionados
    await connection.query(
      `UPDATE reservations SET 
       ${tableId ? 'table_id = ?,' : ''}
       ${startTime ? 'start_time = ?,' : ''}
       ${endTime ? 'end_time = ?,' : ''}
       ${durationHours !== undefined ? 'duration_hours = ?,' : ''}
       ${numMembers !== undefined ? 'num_members = ?,' : ''}
       ${numGuests !== undefined ? 'num_guests = ?,' : ''}
       ${allDay !== undefined ? 'all_day = ?,' : ''}
       ${reason !== undefined ? 'reason = ?,' : ''}
       approved = ?,
       updated_at = NOW()
       WHERE id = ?`,
      [
        ...(tableId ? [tableId] : []),
        ...(startTime ? [startTime] : []),
        ...(endTime ? [endTime] : []),
        ...(durationHours !== undefined ? [durationHours] : []),
        ...(numMembers !== undefined ? [numMembers] : []),
        ...(numGuests !== undefined ? [numGuests] : []),
        ...(allDay !== undefined ? [allDay] : []),
        ...(reason !== undefined ? [reason] : []),
        approved,
        id
      ]
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
      message: allDay && !approved ? 
        'Cambios enviados para aprobación de un administrador' : 
        'Reserva actualizada correctamente',
      reservation: updatedReservation[0]
    });
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al actualizar reserva' });
  }
};

// Controlador para aprobar reservas de todo el día
export const approveReservation = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Solo los administradores pueden aprobar reservas
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden aprobar reservas' });
    }

    const connection = await pool.getConnection();
    
    // Verificar que la reserva existe
    const [reservations] = await connection.query(
      `SELECT r.*, u.name as user_name, t.name as table_name 
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`, 
      [id]
    );
    
    if (reservations.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    const reservation = reservations[0];
    
    // Verificar que la reserva es de todo el día
    if (!reservation.all_day) {
      connection.release();
      return res.status(400).json({ error: 'Solo se pueden aprobar reservas de todo el día' });
    }
    
    // Actualizar el estado de aprobación
    await connection.query(
      'UPDATE reservations SET approved = TRUE WHERE id = ?',
      [id]
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
      message: 'Reserva aprobada correctamente',
      reservation: updatedReservation[0]
    });
  } catch (error) {
    console.error('Error al aprobar reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al aprobar la reserva' });
  }
};

// Controlador para denegar reservas de todo el día
export const rejectReservation = async (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  
  console.log(`🔴 rejectReservation llamado - ID: ${id}, rejection_reason: ${rejection_reason}`);
  console.log('🔴 req.body completo:', req.body);
  console.log('🔴 req.user:', req.user);
  
  try {
    // Solo los administradores pueden denegar reservas
    if (req.user.role !== 'admin') {
      console.log('🔴 Error: Usuario no es admin');
      return res.status(403).json({ error: 'Solo los administradores pueden denegar reservas' });
    }

    // Validar que se proporcione un motivo
    if (!rejection_reason || rejection_reason.trim() === '') {
      console.log('🔴 Error: No se proporcionó motivo');
      return res.status(400).json({ error: 'El motivo de denegación es obligatorio' });
    }

    const connection = await pool.getConnection();
    
    // Verificar que la reserva existe
    const [reservations] = await connection.query(
      `SELECT r.*, u.name as user_name, t.name as table_name 
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN tables t ON r.table_id = t.id
       WHERE r.id = ?`, 
      [id]
    );
    
    if (reservations.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    const reservation = reservations[0];
    
    // Verificar que la reserva es de todo el día
    if (!reservation.all_day) {
      connection.release();
      return res.status(400).json({ error: 'Solo se pueden denegar reservas de todo el día' });
    }
    
    // Actualizar el estado cancelado y agregar motivo de denegación
    await connection.query(
      'UPDATE reservations SET status = "cancelled", rejection_reason = ? WHERE id = ?',
      [rejection_reason.trim(), id]
    );
    
    // Crear notificación para el usuario
    await createNotification(
      reservation.user_id,
      'Reserva Denegada',
      `Su reserva de todo el día para la mesa "${reservation.table_name}" ha sido denegada. Motivo: ${rejection_reason.trim()}`,
      'warning',
      'reservation',
      reservation.id
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
      message: 'Reserva denegada correctamente',
      reservation: updatedReservation[0]
    });
  } catch (error) {
    console.error('Error al denegar reserva:', error);
    return res.status(500).json({ error: 'Error del servidor al denegar la reserva' });
  }
};
