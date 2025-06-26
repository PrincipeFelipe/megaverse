/**
 * Controlador para gestionar los pagos de consumiciones
 */

import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

// Obtener la deuda actual de un usuario
export const getUserDebt = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Solo el propio usuario o un admin puede ver esta información
    if (req.user.id != userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta información' });
    }
    
    const connection = await pool.getConnection();
    
    // Obtener el balance del usuario y todos los pagos
    const [users] = await connection.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const { balance } = users[0];
    
    // Obtener el historial de pagos
    const [payments] = await connection.query(
      `SELECT * FROM consumption_payments 
       WHERE user_id = ? 
       ORDER BY payment_date DESC`,
      [userId]
    );
    
    // La lógica es:
    // 1. Cuando se crea un pago, se aumenta el balance del usuario (se reduce la deuda) 
    //    independientemente de si está aprobado o no
    // 2. Para mostrar la deuda real, debemos considerar que los pagos pendientes y rechazados 
    //    no deberían contar como pagados
    
    // Obtener la suma de todos los pagos pendientes y rechazados
    // Estos pagos deben ser "añadidos de nuevo" a la deuda
    const [nonApprovedPayments] = await connection.query(
      `SELECT SUM(amount) as totalAmount 
       FROM consumption_payments 
       WHERE user_id = ? AND status != 'aprobado'`,
      [userId]
    );
      // Imprimir información de debug
    console.log('Balance del usuario:', balance);
    console.log('Pagos no aprobados:', nonApprovedPayments[0]);
    
    // Cálculo de la deuda:
    // 1. Si el balance es negativo, esa es la deuda base
    // 2. A la deuda base se le suman los pagos pendientes y rechazados
    //    porque estos fueron "restados" de la deuda cuando se crearon pero no están confirmados
    const baseDebt = balance < 0 ? Math.abs(balance) : 0;
    const nonApprovedAmount = parseFloat(nonApprovedPayments[0].totalAmount || 0);
    
    console.log('Deuda base (balance negativo):', baseDebt);
    console.log('Cantidad no aprobada:', nonApprovedAmount);
    console.log('Deuda total calculada:', baseDebt + nonApprovedAmount);
    
    // La deuda mostrada al usuario debe incluir los pagos no aprobados
    connection.release();
      // Asegurarse de que la deuda nunca sea negativa
    const totalDebt = Math.max(0, baseDebt + nonApprovedAmount);
    
    console.log('Valor final totalDebt a devolver:', totalDebt);
    
    // Asegurarse de que estamos enviando un número y no un string
    res.status(200).json({
      currentDebt: Number(totalDebt), // Convertir explícitamente a número
      paymentHistory: payments
    });
    
  } catch (error) {
    console.error('Error al obtener la deuda del usuario:', error);
    res.status(500).json({ error: 'Error al obtener la deuda del usuario' });
  }
};

// Registrar un nuevo pago de consumiciones
export const createConsumptionPayment = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      userId,
      amount,
      paymentMethod,
      referenceNumber,
      notes
    } = req.body;
    
    // El usuario a pagar puede ser el que hace la petición o uno especificado por un admin
    const userIdToUpdate = userId || req.user.id;
    
    // Solo el propio usuario o un admin puede registrar un pago
    if (userIdToUpdate !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'No tienes permisos para registrar pagos de otros usuarios' 
      });
    }
    
    // Validar que el monto es positivo
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'El monto del pago debe ser positivo' });
    }
    
    // Validar método de pago
    const validMethods = ['efectivo', 'transferencia', 'bizum'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        error: 'El método de pago debe ser efectivo, transferencia o bizum'
      });
    }
    
    // Si el método es transferencia, requiere número de referencia
    if (paymentMethod === 'transferencia' && !referenceNumber) {
      return res.status(400).json({ 
        error: 'Para pagos por transferencia se requiere número de referencia'
      });
    }
    
    const connection = await pool.getConnection();
      try {
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Verificar que el usuario existe y obtener su deuda actual
      const [users] = await connection.query(
        'SELECT balance FROM users WHERE id = ? FOR UPDATE',
        [userIdToUpdate]
      );
      
      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const { balance } = users[0];
      
      // Obtener la suma de todos los pagos pendientes y rechazados
      const [nonApprovedPayments] = await connection.query(
        `SELECT SUM(amount) as totalAmount 
         FROM consumption_payments 
         WHERE user_id = ? AND status != 'aprobado'`,
        [userIdToUpdate]
      );
      
      // Calcular deuda total considerando el balance y los pagos no aprobados
      const baseDebt = balance < 0 ? Math.abs(balance) : 0;
      const nonApprovedAmount = parseFloat(nonApprovedPayments[0].totalAmount || 0);
      const totalDebt = baseDebt + nonApprovedAmount;
      
      console.log('Creación de pago - Balance del usuario:', balance);
      console.log('Creación de pago - Pagos no aprobados:', nonApprovedAmount);
      console.log('Creación de pago - Deuda total calculada:', totalDebt);
        // Verificar si hay un reintento de pago específicado en la solicitud
      const isRetry = req.body.isRetry === true;
      console.log('¿Es reintento de pago?', isRetry);
      
      // En caso de reintento de pago, no verificamos la deuda existente
      if (totalDebt <= 0 && !isRetry) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'El usuario no tiene deuda pendiente' });
      }
        
      // Determinar el monto a pagar:
      // - Si es un reintento, usar el monto especificado
      // - Si es un pago normal, ajustar al máximo de la deuda si es necesario
      let amountToPay = amount;
      if (!isRetry && amount > totalDebt) {
        amountToPay = totalDebt;
      }
      console.log('Monto a pagar final:', amountToPay, 'de un total de deuda de:', totalDebt);
      
      // Actualizar el balance del usuario
      await connection.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amountToPay, userIdToUpdate]
      );
      
      // Registrar el pago
      const [result] = await connection.query(
        `INSERT INTO consumption_payments 
         (user_id, amount, payment_method, reference_number, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userIdToUpdate,
          amountToPay,
          paymentMethod,
          referenceNumber || null,
          notes || null,
          req.user.id // Quién registró el pago
        ]
      );
      
      // Obtener el pago recién creado
      const [paymentData] = await connection.query(
        `SELECT cp.*, u.name as user_name, u.username as user_username
         FROM consumption_payments cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.id = ?`,
        [result.insertId]
      );
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener el nuevo balance
      const [updatedUser] = await connection.query(
        'SELECT balance FROM users WHERE id = ?',
        [userIdToUpdate]
      );
      
      connection.release();
      
      return res.status(201).json({
        message: 'Pago registrado correctamente',
        payment: paymentData[0],
        newBalance: updatedUser[0].balance,
        remainingDebt: updatedUser[0].balance < 0 ? Math.abs(updatedUser[0].balance) : 0
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error al registrar el pago:', error);
    return res.status(500).json({ error: 'Error del servidor al registrar el pago' });
  }
};

// Obtener historial de pagos de consumiciones
export const getConsumptionPayments = async (req, res) => {
  try {
    const { userId, startDate, endDate, status, limit = 50, offset = 0 } = req.query;
    
    // Solo un admin puede ver todos los pagos o los de otro usuario
    if (userId && userId != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver estos pagos' });
    }
    
    let query = `
      SELECT cp.*, 
             u.name as user_name, 
             u.username as user_username,
             c.name as created_by_name,
             a.name as approved_by_name
      FROM consumption_payments cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN users c ON cp.created_by = c.id
      LEFT JOIN users a ON cp.approved_by = a.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Aplicar filtros
    if (userId) {
      query += " AND cp.user_id = ?";
      queryParams.push(userId);
    } else if (req.user.role !== 'admin') {
      // Si no es admin, solo ve sus propios pagos
      query += " AND cp.user_id = ?";
      queryParams.push(req.user.id);
    }
    
    if (startDate) {
      query += " AND cp.payment_date >= ?";
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += " AND cp.payment_date <= ?";
      queryParams.push(endDate);
    }
    
    if (status) {
      query += " AND cp.status = ?";
      queryParams.push(status);
    }
    
    // Ordenar por fecha de pago descendente
    query += " ORDER BY cp.payment_date DESC LIMIT ? OFFSET ?";
    queryParams.push(Number(limit), Number(offset));
    
    const connection = await pool.getConnection();
    const [payments] = await connection.query(query, queryParams);
    
    // Obtener el total de registros para la paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM consumption_payments cp
      WHERE 1=1
    `;
    
    const countParams = [...queryParams];
    countParams.pop(); // remove offset
    countParams.pop(); // remove limit
    
    if (userId) {
      countQuery += " AND cp.user_id = ?";
    } else if (req.user.role !== 'admin') {
      countQuery += " AND cp.user_id = ?";
    }
    
    if (startDate) {
      countQuery += " AND cp.payment_date >= ?";
    }
    
    if (endDate) {
      countQuery += " AND cp.payment_date <= ?";
    }
    
    if (status) {
      countQuery += " AND cp.status = ?";
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

// Aprobar un pago de consumiciones
export const approveConsumptionPayment = async (req, res) => {
  try {
    // Solo administradores pueden aprobar pagos
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para aprobar pagos' });
    }

    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    try {
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Verificar que el pago existe y está pendiente
      const [payments] = await connection.query(
        `SELECT cp.*, u.balance
         FROM consumption_payments cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.id = ? 
         FOR UPDATE`,
        [id]
      );
      
      if (payments.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Pago no encontrado' });
      }
      
      const payment = payments[0];
      
      if (payment.status === 'aprobado') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Este pago ya ha sido aprobado' });
      }
      
      if (payment.status === 'rechazado') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'No se puede aprobar un pago rechazado' });
      }
        // Cuando un pago está pendiente y se aprueba, no necesitamos actualizar el balance
      // porque el balance ya se actualizó cuando se creó el pago inicialmente
      // Solo necesitamos cambiar el estado del pago
      
      // Marcar el pago como aprobado
      await connection.query(
        `UPDATE consumption_payments 
         SET status = 'aprobado', approved_by = ?, approved_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [req.user.id, id]
      );
      
      // Confirmar la transacción
      await connection.commit();
      
      // Obtener el pago actualizado
      const [updatedPayment] = await connection.query(
        `SELECT cp.*, u.name as user_name, u.username as user_username,
                au.name as approved_by_name, cu.name as created_by_name
         FROM consumption_payments cp
         JOIN users u ON cp.user_id = u.id
         LEFT JOIN users au ON cp.approved_by = au.id
         LEFT JOIN users cu ON cp.created_by = cu.id
         WHERE cp.id = ?`,
        [id]
      );
      
      connection.release();
      
      res.json({
        message: 'Pago aprobado correctamente',
        payment: updatedPayment[0]
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('Error al aprobar pago:', error);
    res.status(500).json({ error: 'Error al aprobar pago' });
  }
};

// Rechazar un pago de consumiciones
export const rejectConsumptionPayment = async (req, res) => {
  try {
    // Solo administradores pueden rechazar pagos
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para rechazar pagos' });
    }
    
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    // Validar que hay una razón de rechazo
    if (!rejectionReason) {
      return res.status(400).json({ error: 'Debe proporcionar una razón para rechazar el pago' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Verificar que el pago existe
      const [payments] = await connection.query(
        `SELECT cp.*, u.balance
         FROM consumption_payments cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.id = ? 
         FOR UPDATE`,
        [id]
      );
      
      if (payments.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Pago no encontrado' });
      }
      
      const payment = payments[0];
      
      if (payment.status === 'rechazado') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Este pago ya ha sido rechazado' });
      }
        // Si el pago estaba aprobado o pendiente, revertir el balance del usuario
      if (payment.status === 'aprobado' || payment.status === 'pendiente') {
        // Revertir el balance del usuario (añadir la deuda nuevamente)
        await connection.query(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [payment.amount, payment.user_id]
        );
      }
      
      // Marcar el pago como rechazado
      await connection.query(
        `UPDATE consumption_payments 
         SET status = 'rechazado', approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ? 
         WHERE id = ?`,
        [req.user.id, rejectionReason, id]
      );
      
      // Confirmar la transacción
      await connection.commit();
      
      // Obtener el pago actualizado
      const [updatedPayment] = await connection.query(
        `SELECT cp.*, u.name as user_name, u.username as user_username,
                au.name as approved_by_name, cu.name as created_by_name
         FROM consumption_payments cp
         JOIN users u ON cp.user_id = u.id
         LEFT JOIN users au ON cp.approved_by = au.id
         LEFT JOIN users cu ON cp.created_by = cu.id
         WHERE cp.id = ?`,
        [id]
      );
      
      connection.release();
      
      res.json({
        message: 'Pago rechazado correctamente',
        payment: updatedPayment[0]
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    res.status(500).json({ error: 'Error al rechazar pago' });
  }
};

// Obtener detalles de un pago específico
export const getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    // Obtener el pago y detalles
    const [payments] = await connection.query(
      `SELECT cp.*, 
              u.name as user_name, 
              u.username as user_username,
              au.name as approved_by_name, 
              cu.name as created_by_name
       FROM consumption_payments cp
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN users au ON cp.approved_by = au.id
       LEFT JOIN users cu ON cp.created_by = cu.id
       WHERE cp.id = ?`,
      [id]
    );
    
    connection.release();
    
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    const payment = payments[0];
    
    // Solo el usuario involucrado o un admin puede ver los detalles
    if (payment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver este pago' });
    }
    
    res.status(200).json(payment);
      } catch (error) {
    console.error('Error al obtener detalles del pago:', error);
    res.status(500).json({ error: 'Error al obtener detalles del pago' });
  }
};

// Controlador para reintentar un pago rechazado
export const retryConsumptionPayment = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    const { paymentMethod, referenceNumber, notes } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Obtener información del pago rechazado
      const [payments] = await connection.query(
        `SELECT * FROM consumption_payments WHERE id = ? FOR UPDATE`,
        [id]
      );
      
      if (payments.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Pago no encontrado' });
      }
      
      const payment = payments[0];
      
      // Verificar que el pago está rechazado
      if (payment.status !== 'rechazado') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          error: 'Solo se pueden reintentar pagos que hayan sido rechazados' 
        });
      }
      
      // Verificar que el usuario que intenta reintentar el pago es el mismo que lo creó o es admin
      if (payment.user_id !== req.user.id && req.user.role !== 'admin') {
        await connection.rollback();
        connection.release();
        return res.status(403).json({ 
          error: 'No tienes permiso para reintentar este pago' 
        });
      }
      
      // Actualizar el registro con la nueva información, marcándolo como pendiente
      await connection.query(
        `UPDATE consumption_payments 
         SET payment_method = ?, 
             reference_number = ?, 
             notes = ?, 
             status = 'pendiente', 
             updated_at = CURRENT_TIMESTAMP,
             rejection_reason = NULL,
             approved_by = NULL,
             approved_at = NULL
         WHERE id = ?`,
        [
          paymentMethod, 
          referenceNumber || null, 
          notes || null,
          id
        ]
      );
      
      // Al reiniciar el pago, no modificamos el balance del usuario porque ya se había 
      // revertido cuando el pago fue rechazado
      
      // Obtener el pago actualizado
      const [updatedPayments] = await connection.query(
        `SELECT * FROM consumption_payments WHERE id = ?`,
        [id]
      );
      
      // Obtener el saldo actualizado del usuario
      const [users] = await connection.query(
        `SELECT balance FROM users WHERE id = ?`,
        [payment.user_id]
      );
      
      const newBalance = users[0].balance;
      const remainingDebt = newBalance < 0 ? Math.abs(newBalance) : 0;
      
      // Commit de la transacción
      await connection.commit();
      connection.release();
      
      // Retornar éxito
      res.status(200).json({
        message: 'Pago reintentado exitosamente',
        payment: updatedPayments[0],
        newBalance,
        remainingDebt
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Error al reintentar el pago:', error);
      res.status(500).json({ error: 'Error al procesar el reintento del pago' });
    }
    
  } catch (error) {
    console.error('Error al reintentar el pago:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
