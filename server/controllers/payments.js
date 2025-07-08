/**
 * Controlador para gestionar los pagos de cuotas de usuarios
 */

import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

// Obtener pagos del usuario autenticado
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id; // Usuario autenticado
    const {
      month,
      year,
      paymentType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT p.*, 
             u.name as user_name, 
             u.username as user_username,
             c.name as created_by_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users c ON p.created_by = c.id
      WHERE p.user_id = ?
    `;
    
    const queryParams = [userId];
    
    // Aplicar filtros si se proporcionan
    if (month) {
      query += " AND p.month = ?";
      queryParams.push(month);
    }
    
    if (year) {
      query += " AND p.year = ?";
      queryParams.push(year);
    }
    
    if (paymentType) {
      query += " AND p.payment_type = ?";
      queryParams.push(paymentType);
    }
    
    if (startDate) {
      query += " AND p.payment_date >= ?";
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += " AND p.payment_date <= ?";
      queryParams.push(endDate);
    }
    
    // Ordenar por fecha de pago descendente (más recientes primero)
    query += " ORDER BY p.payment_date DESC, p.id DESC LIMIT ? OFFSET ?";
    queryParams.push(Number(limit), Number(offset));
    
    const connection = await pool.getConnection();
    const [payments] = await connection.query(query, queryParams);
    
    // Obtener el total de registros para la paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      WHERE p.user_id = ?
    `;
    
    // Replicar los mismos filtros excepto limit y offset
    const countParams = [userId];
    
    if (month) {
      countQuery += " AND p.month = ?";
      countParams.push(month);
    }
    
    if (year) {
      countQuery += " AND p.year = ?";
      countParams.push(year);
    }
    
    if (paymentType) {
      countQuery += " AND p.payment_type = ?";
      countParams.push(paymentType);
    }
    
    if (startDate) {
      countQuery += " AND p.payment_date >= ?";
      countParams.push(startDate);
    }
    
    if (endDate) {
      countQuery += " AND p.payment_date <= ?";
      countParams.push(endDate);
    }
    
    const [countResult] = await connection.query(countQuery, countParams);
    connection.release();
    
    res.json({
      payments,
      total: countResult[0].total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error al obtener pagos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener pagos del usuario.' });
  }
};

// Obtener todos los pagos (con opciones de filtrado)
export const getPayments = async (req, res) => {
  try {
    const {
      userId,
      month,
      year,
      paymentType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT p.*, 
             u.name as user_name, 
             u.username as user_username,
             c.name as created_by_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users c ON p.created_by = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Aplicar filtros si se proporcionan
    if (userId) {
      query += " AND p.user_id = ?";
      queryParams.push(userId);
    }
    
    if (month) {
      query += " AND p.month = ?";
      queryParams.push(month);
    }
    
    if (year) {
      query += " AND p.year = ?";
      queryParams.push(year);
    }
    
    if (paymentType) {
      query += " AND p.payment_type = ?";
      queryParams.push(paymentType);
    }
    
    if (startDate) {
      query += " AND p.payment_date >= ?";
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += " AND p.payment_date <= ?";
      queryParams.push(endDate);
    }
    
    // Ordenar por fecha de pago descendente (más recientes primero)
    query += " ORDER BY p.payment_date DESC, p.id DESC LIMIT ? OFFSET ?";
    queryParams.push(Number(limit), Number(offset));
    
    const connection = await pool.getConnection();
    const [payments] = await connection.query(query, queryParams);
    
    // Obtener el total de registros para la paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      WHERE 1=1
    `;
    
    // Replicar los mismos filtros excepto limit y offset
    const countParams = [...queryParams];
    countParams.pop(); // remove offset
    countParams.pop(); // remove limit
    
    if (userId) {
      countQuery += " AND p.user_id = ?";
    }
    
    if (month) {
      countQuery += " AND p.month = ?";
    }
    
    if (year) {
      countQuery += " AND p.year = ?";
    }
    
    if (paymentType) {
      countQuery += " AND p.payment_type = ?";
    }
    
    if (startDate) {
      countQuery += " AND p.payment_date >= ?";
    }
    
    if (endDate) {
      countQuery += " AND p.payment_date <= ?";
    }
    
    const [totalCount] = await connection.query(countQuery, countParams);
    connection.release();
    
    res.status(200).json({
      payments,
      total: totalCount[0].total,
      limit: Number(limit),
      offset: Number(offset)
    });
    
  } catch (error) {
    console.error('Error al obtener los pagos:', error);
    res.status(500).json({ error: 'Error al obtener los pagos' });
  }
};

// Crear un nuevo pago
export const createPayment = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      user_id,
      amount,
      payment_date,
      payment_type = 'normal',
      month,
      year,
      payment_method = 'transferencia',
      reference,
      notes
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Verificar si el usuario existe
    const [userExists] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userExists.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'El usuario no existe' });
    }
    
    // Verificar duplicados según el tipo de pago
    if (payment_type === 'entrance') {
      // Para cuota de entrada: verificar si ya existe una cuota de entrada para este usuario
      const [existingEntrance] = await connection.query(
        'SELECT id FROM payments WHERE user_id = ? AND payment_type = ?',
        [user_id, 'entrance']
      );
      
      if (existingEntrance.length > 0) {
        connection.release();
        return res.status(400).json({ 
          error: 'Este usuario ya tiene registrada una cuota de entrada',
          paymentId: existingEntrance[0].id
        });
      }
    } else {
      // Para cuotas mensuales (normal/maintenance): verificar mes, año y tipo
      const [existingPayment] = await connection.query(
        'SELECT id FROM payments WHERE user_id = ? AND month = ? AND year = ? AND payment_type = ?',
        [user_id, month, year, payment_type]
      );
      
      if (existingPayment.length > 0) {
        connection.release();
        return res.status(400).json({ 
          error: 'Ya existe un pago para este usuario en el periodo seleccionado',
          paymentId: existingPayment[0].id
        });
      }
    }
    
    // Insertar el nuevo pago
    const [result] = await connection.query(
      `INSERT INTO payments 
       (user_id, amount, payment_date, payment_type, month, year, 
        payment_method, reference, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        amount,
        payment_date,
        payment_type,
        month,
        year,
        payment_method,
        reference || null,
        notes || null,
        req.user.id // El usuario que crea el pago (del token)
      ]
    );
    
    // Obtener el pago recién creado
    const [payment] = await connection.query(
      `SELECT p.*, u.name as user_name, u.username as user_username
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    
    connection.release();
    
    res.status(201).json({
      message: 'Pago registrado correctamente',
      payment: payment[0]
    });
    
  } catch (error) {
    console.error('Error al crear el pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
};

// Actualizar un pago existente
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      amount,
      payment_date,
      payment_type,
      month,
      year,
      payment_method,
      reference,
      notes
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Verificar si el pago existe
    const [paymentExists] = await connection.query(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );
    
    if (paymentExists.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'El pago no existe' });
    }
    
    // Si se cambian el user_id, mes, año o tipo, verificar si ya existe otro pago con esos datos
    if ((payment_type && payment_type !== paymentExists[0].payment_type) ||
        (month && month !== paymentExists[0].month) ||
        (year && year !== paymentExists[0].year)) {
      
      const [existingPayment] = await connection.query(
        'SELECT id FROM payments WHERE user_id = ? AND month = ? AND year = ? AND payment_type = ? AND id != ?',
        [
          paymentExists[0].user_id,
          month || paymentExists[0].month,
          year || paymentExists[0].year,
          payment_type || paymentExists[0].payment_type,
          id
        ]
      );
      
      if (existingPayment.length > 0) {
        connection.release();
        return res.status(400).json({ 
          error: 'Ya existe un pago para este usuario en el periodo seleccionado',
          paymentId: existingPayment[0].id
        });
      }
    }
    
    // Construir objeto para actualización con solo los campos proporcionados
    const updateFields = [];
    const updateValues = [];
    
    if (amount !== undefined) {
      updateFields.push('amount = ?');
      updateValues.push(amount);
    }
    
    if (payment_date !== undefined) {
      updateFields.push('payment_date = ?');
      updateValues.push(payment_date);
    }
    
    if (payment_type !== undefined) {
      updateFields.push('payment_type = ?');
      updateValues.push(payment_type);
    }
    
    if (month !== undefined) {
      updateFields.push('month = ?');
      updateValues.push(month);
    }
    
    if (year !== undefined) {
      updateFields.push('year = ?');
      updateValues.push(year);
    }
    
    if (payment_method !== undefined) {
      updateFields.push('payment_method = ?');
      updateValues.push(payment_method);
    }
    
    if (reference !== undefined) {
      updateFields.push('reference = ?');
      updateValues.push(reference);
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }
    
    // Si no hay campos para actualizar
    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    
    // Añadir campo updated_at
    updateFields.push('updated_at = NOW()');
    
    // Actualizar el pago
    await connection.query(
      `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues, id]
    );
    
    // Obtener el pago actualizado
    const [payment] = await connection.query(
      `SELECT p.*, u.name as user_name, u.username as user_username
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    
    connection.release();
    
    res.status(200).json({
      message: 'Pago actualizado correctamente',
      payment: payment[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    res.status(500).json({ error: 'Error al actualizar el pago' });
  }
};

// Eliminar un pago
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    // Verificar si el pago existe
    const [paymentExists] = await connection.query(
      'SELECT id FROM payments WHERE id = ?',
      [id]
    );
    
    if (paymentExists.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'El pago no existe' });
    }
    
    // Eliminar el pago
    await connection.query('DELETE FROM payments WHERE id = ?', [id]);
    connection.release();
    
    res.status(200).json({
      message: 'Pago eliminado correctamente',
      id: Number(id)
    });
    
  } catch (error) {
    console.error('Error al eliminar el pago:', error);
    res.status(500).json({ error: 'Error al eliminar el pago' });
  }
};

// Obtener estadísticas de pagos
export const getPaymentStats = async (req, res) => {
  try {
    const { year } = req.query;
    
    const connection = await pool.getConnection();
    
    // Si no se especifica año, usar el año actual
    const statsYear = year || new Date().getFullYear();
    
    // Estadísticas para el año seleccionado
    const [monthlyStats] = await connection.query(
      `SELECT 
         month, 
         payment_type,
         COUNT(*) as count, 
         SUM(amount) as total
       FROM payments 
       WHERE year = ? 
       GROUP BY month, payment_type 
       ORDER BY month, payment_type`,
      [statsYear]
    );
    
    // Total anual
    const [yearlyTotal] = await connection.query(
      `SELECT 
         SUM(amount) as total,
         COUNT(*) as count
       FROM payments 
       WHERE year = ?`,
      [statsYear]
    );
    
    // Cuotas pendientes (usuarios sin pagos en algún mes)
    // Esta consulta obtiene usuarios sin pagos de tipo 'normal' para los meses que ya han pasado
    const currentMonth = new Date().getMonth() + 1; // JavaScript meses son 0-11
    
    let pendingQuery = `
      SELECT 
        u.id, 
        u.name, 
        u.username,
        GROUP_CONCAT(m.month ORDER BY m.month) as pending_months
      FROM users u
      JOIN (
    `;
    
    // Generar subconsulta para los meses hasta el actual
    const monthSubqueries = [];
    for (let i = 1; i <= (year < new Date().getFullYear() ? 12 : currentMonth); i++) {
      monthSubqueries.push(`SELECT ${i} as month`);
    }
    
    pendingQuery += monthSubqueries.join(' UNION ALL ');
    
    pendingQuery += `
      ) m
      LEFT JOIN payments p ON 
        p.user_id = u.id AND 
        p.month = m.month AND 
        p.year = ? AND 
        p.payment_type = 'normal'
      WHERE p.id IS NULL
      GROUP BY u.id, u.name
      ORDER BY u.name
    `;
    
    const [pendingPayments] = await connection.query(pendingQuery, [statsYear]);
    
    connection.release();
    
    res.status(200).json({
      monthlyStats,
      yearlyTotal: yearlyTotal[0] || { total: 0, count: 0 },
      pendingPayments,
      year: Number(statsYear)
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas de pagos:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de pagos' });
  }
};

// Obtener detalles de un pago específico
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    // Obtener el pago con información adicional
    const [payment] = await connection.query(
      `SELECT p.*, 
              u.name as user_name, 
              u.username as user_username,
              c.name as created_by_name
       FROM payments p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN users c ON p.created_by = c.id
       WHERE p.id = ?`,
      [id]
    );
    
    if (payment.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    connection.release();
    
    res.status(200).json({
      payment: payment[0]
    });
    
  } catch (error) {
    console.error('Error al obtener el pago:', error);
    res.status(500).json({ error: 'Error al obtener el pago' });
  }
};

// Generar informe de pagos para un período
export const generatePaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, paymentType } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }
    
    const connection = await pool.getConnection();
    
    let query = `
      SELECT 
        p.*,
        u.name as user_name, 
        u.username as user_username
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.payment_date BETWEEN ? AND ?
    `;
    
    const queryParams = [startDate, endDate];
    
    if (paymentType) {
      query += " AND p.payment_type = ?";
      queryParams.push(paymentType);
    }
    
    query += " ORDER BY p.payment_date, u.name";
    
    const [payments] = await connection.query(query, queryParams);
    
    // Calcular totales
    const [totals] = await connection.query(
      `SELECT 
        COUNT(*) as count,
        SUM(amount) as total,
        payment_type,
        COUNT(DISTINCT user_id) as users_count
       FROM payments
       WHERE payment_date BETWEEN ? AND ?
       ${paymentType ? "AND payment_type = ?" : ""}
       GROUP BY payment_type`,
      queryParams
    );
    
    connection.release();
    
    res.status(200).json({
      payments,
      totals,
      period: {
        startDate,
        endDate
      }
    });
    
  } catch (error) {
    console.error('Error al generar informe de pagos:', error);
    res.status(500).json({ error: 'Error al generar informe de pagos' });
  }
};
