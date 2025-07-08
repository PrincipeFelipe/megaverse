/**
 * Controlador para gestionar la configuración de reservas
 */

import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

// Obtener la configuración actual
export const getReservationConfig = async (req, res) => {  try {
    const connection = await pool.getConnection();
    const [config] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
    
    if (config.length === 0) {      // Si no hay configuración, crear una por defecto
      await connection.query(`
        INSERT INTO reservation_config 
        (max_hours_per_reservation, max_reservations_per_user_per_day, min_hours_in_advance, 
        allowed_start_time, allowed_end_time, requires_approval_for_all_day, 
        normal_fee, maintenance_fee, entrance_fee, allow_consecutive_reservations, min_time_between_reservations) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [4, 1, 0, '08:00', '22:00', 1, 30, 15, 50, 1, 0]);
      
      const [defaultConfig] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
      connection.release();
      return res.status(200).json({ config: defaultConfig[0] });
    }
    connection.release();
    
    res.status(200).json({ config: config[0] });
  } catch (error) {
    console.error('Error al obtener la configuración de reservas:', error);
    res.status(500).json({ error: 'Error al obtener la configuración de reservas' });
  }
};

// Actualizar la configuración
export const updateReservationConfig = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Log para depuración
    console.log('Datos recibidos en el servidor:', req.body);
    console.log('entrance_fee recibido:', req.body.entrance_fee, 'tipo:', typeof req.body.entrance_fee);
    
    const {
      max_hours_per_reservation,
      max_reservations_per_user_per_day,
      min_hours_in_advance,
      allowed_start_time,
      allowed_end_time,
      requires_approval_for_all_day,
      normal_fee,
      maintenance_fee,
      entrance_fee,
      allow_consecutive_reservations,
      min_time_between_reservations
    } = req.body;
    
    // Construir objeto para actualización con solo los campos proporcionados
    const updateFields = [];
    const updateValues = [];
    
    if (max_hours_per_reservation !== undefined) {
      updateFields.push('max_hours_per_reservation = ?');
      updateValues.push(max_hours_per_reservation);
    }
    
    if (max_reservations_per_user_per_day !== undefined) {
      updateFields.push('max_reservations_per_user_per_day = ?');
      updateValues.push(max_reservations_per_user_per_day);
    }
    
    if (min_hours_in_advance !== undefined) {
      updateFields.push('min_hours_in_advance = ?');
      updateValues.push(min_hours_in_advance);
    }
    
    if (allowed_start_time !== undefined) {
      updateFields.push('allowed_start_time = ?');
      updateValues.push(allowed_start_time);
    }
    
    if (allowed_end_time !== undefined) {
      updateFields.push('allowed_end_time = ?');
      updateValues.push(allowed_end_time);
    }
      if (requires_approval_for_all_day !== undefined) {
      updateFields.push('requires_approval_for_all_day = ?');
      updateValues.push(requires_approval_for_all_day ? 1 : 0);
    }
    
    // Campos de cuotas
    if (normal_fee !== undefined) {
      updateFields.push('normal_fee = ?');
      updateValues.push(normal_fee);
    }
    
    if (maintenance_fee !== undefined) {
      updateFields.push('maintenance_fee = ?');
      updateValues.push(maintenance_fee);
    }

    if (entrance_fee !== undefined) {
      console.log('Procesando entrance_fee:', entrance_fee);
      updateFields.push('entrance_fee = ?');
      updateValues.push(entrance_fee);
    }

    // Campos de reservas consecutivas
    if (allow_consecutive_reservations !== undefined) {
      updateFields.push('allow_consecutive_reservations = ?');
      updateValues.push(allow_consecutive_reservations ? 1 : 0);
    }
    
    if (min_time_between_reservations !== undefined) {
      updateFields.push('min_time_between_reservations = ?');
      updateValues.push(min_time_between_reservations);
    }
    
    // Si no hay campos para actualizar, devolver error
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
      // Añadir campo updated_at
    updateFields.push('updated_at = NOW()');
    
    // Log para depuración de la consulta SQL
    console.log('Campos a actualizar:', updateFields);
    console.log('Valores a actualizar:', updateValues);
    
    // Realizar actualización
    const connection = await pool.getConnection();
    const querySQL = `UPDATE reservation_config SET ${updateFields.join(', ')} WHERE id = 1`;
    console.log('SQL Query:', querySQL);
    
    await connection.query(querySQL, [...updateValues]);
    
    // Obtener configuración actualizada
    const [config] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
    connection.release();
    
    res.status(200).json({
      message: 'Configuración actualizada correctamente',
      config: config[0]
    });
  } catch (error) {
    console.error('Error al actualizar la configuración de reservas:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración de reservas' });
  }
};
