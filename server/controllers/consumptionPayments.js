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
    
    // Obtener el balance del usuario
    const [users] = await connection.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Calcular la deuda total basada en consumos no pagados (paid = 0)
    const [unpaidConsumptions] = await connection.query(
      `SELECT SUM(total_price) as total_unpaid
       FROM consumptions
       WHERE user_id = ? AND paid = 0`,
      [userId]
    );
    
    // Calcular el total de consumos en proceso de pago (paid = 1)
    const [pendingApprovalConsumptions] = await connection.query(
      `SELECT SUM(total_price) as total_pending_approval
       FROM consumptions
       WHERE user_id = ? AND paid = 1`,
      [userId]
    );
    
    // Obtener el historial de pagos
    const [payments] = await connection.query(
      `SELECT cp.*, 
       u_created.name as created_by_name,
       u_approved.name as approved_by_name,
       (SELECT COUNT(*) FROM consumption_payments_details WHERE payment_id = cp.id) as consumptions_count
       FROM consumption_payments cp
       JOIN users u_created ON cp.created_by = u_created.id
       LEFT JOIN users u_approved ON cp.approved_by = u_approved.id
       WHERE cp.user_id = ? 
       ORDER BY cp.payment_date DESC`,
      [userId]
    );
    
    const { balance } = users[0];
    const totalUnpaid = parseFloat(unpaidConsumptions[0].total_unpaid || 0);
    const totalPendingApproval = parseFloat(pendingApprovalConsumptions[0].total_pending_approval || 0);
    
    // Calcular la deuda real considerando tanto el balance como los consumos pendientes
    const totalDebt = totalUnpaid + totalPendingApproval;
    
    connection.release();
    
    res.status(200).json({
      balance: balance,
      currentDebt: {
        unpaid: totalUnpaid,
        pendingApproval: totalPendingApproval,
        total: totalDebt
      },
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
      amount: originalAmount,
      paymentMethod,
      referenceNumber,
      notes,
      consumptionIds // Nuevo: Array con IDs de consumos a pagar
    } = req.body;
    
    let amount = originalAmount;
    
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
      
      // Si se especifican consumptionIds, verificar que existan y pertenezcan al usuario
      let consumptionsToPayIds = [];
      let totalConsumptionsAmount = 0;
      
      if (consumptionIds && consumptionIds.length > 0) {
        // Verificar que los consumos existen y pertenecen al usuario
        const [consumptions] = await connection.query(
          `SELECT id, total_price, paid FROM consumptions 
           WHERE id IN (?) AND user_id = ? AND paid = 0`,
          [consumptionIds, userIdToUpdate]
        );
        
        if (consumptions.length !== consumptionIds.length) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            error: 'Algunos consumos especificados no existen, no pertenecen al usuario o ya están pagados'
          });
        }
        
        // Guardar los IDs y calcular el total
        consumptionsToPayIds = consumptions.map(c => c.id);
        totalConsumptionsAmount = consumptions.reduce((sum, c) => sum + parseFloat(c.total_price), 0);
        
        // Siempre usar el monto calculado de los consumos seleccionados
        // Esto asegura que el monto sea exactamente igual al total de los consumos
        amount = totalConsumptionsAmount;
        
        // Log para depuración
        console.log(`Monto del pago ajustado al total de consumos seleccionados: ${amount}`);
      } else {
        // Si no se especifican consumos, obtener todos los consumos pendientes
        const [pendingConsumptions] = await connection.query(
          `SELECT id, total_price FROM consumptions 
           WHERE user_id = ? AND paid = 0 
           ORDER BY created_at ASC`,
          [userIdToUpdate]
        );
        
        // Determinar qué consumos se pueden pagar con el monto disponible
        let remainingAmount = amount;
        for (const consumption of pendingConsumptions) {
          if (remainingAmount >= parseFloat(consumption.total_price)) {
            consumptionsToPayIds.push(consumption.id);
            totalConsumptionsAmount += parseFloat(consumption.total_price);
            remainingAmount -= parseFloat(consumption.total_price);
          } else {
            break; // No hay suficiente monto para más consumos
          }
        }
      }
      
      const { balance } = users[0];
      
      // Actualizar el balance del usuario
      await connection.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, userIdToUpdate]
      );
      
      // Registrar el pago
      const [result] = await connection.query(
        `INSERT INTO consumption_payments 
         (user_id, amount, payment_method, reference_number, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userIdToUpdate,
          amount,
          paymentMethod,
          referenceNumber || null,
          notes || null,
          req.user.id // Quién registró el pago
        ]
      );
      
      const paymentId = result.insertId;
      
      // Marcar los consumos como pendientes de aprobación (paid = 1)
      if (consumptionsToPayIds.length > 0) {
        await connection.query(
          'UPDATE consumptions SET paid = 1 WHERE id IN (?)',
          [consumptionsToPayIds]
        );
        
        // Registrar los consumos en la tabla consumption_payments_details
        for (const consumptionId of consumptionsToPayIds) {
          await connection.query(
            'INSERT INTO consumption_payments_details (payment_id, consumption_id) VALUES (?, ?)',
            [paymentId, consumptionId]
          );
        }
      }
      
      // Obtener el pago recién creado
      const [paymentData] = await connection.query(
        `SELECT cp.*, u.name as user_name, u.username as user_username
         FROM consumption_payments cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.id = ?`,
        [paymentId]
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
        consumptionsPaid: consumptionsToPayIds.length,
        totalConsumptionsAmount,
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
    console.log('🔍 [DEBUG] rejectConsumptionPayment called');
    console.log('🔍 [DEBUG] Request params:', req.params);
    console.log('🔍 [DEBUG] Request body:', req.body);
    console.log('🔍 [DEBUG] User role:', req.user?.role);
    
    // Solo administradores pueden rechazar pagos
    if (req.user.role !== 'admin') {
      console.log('❌ [DEBUG] User is not admin');
      return res.status(403).json({ error: 'No tienes permisos para rechazar pagos' });
    }
    
    const { id } = req.params;
    const { rejection_reason } = req.body;
    
    console.log('🔍 [DEBUG] Payment ID:', id);
    console.log('🔍 [DEBUG] Rejection reason:', rejection_reason);
    
    // Validar que hay una razón de rechazo
    if (!rejection_reason) {
      console.log('❌ [DEBUG] No rejection reason provided');
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
        [req.user.id, rejection_reason, id]
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
    
    console.log(`🔍 [DEBUG] getPaymentDetails llamado para pago ID: ${id}`);
    
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
    
    if (payments.length === 0) {
      connection.release();
      console.log(`❌ [DEBUG] Pago ${id} no encontrado`);
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    const payment = payments[0];
    console.log(`✅ [DEBUG] Pago ${id} encontrado para usuario: ${payment.user_name}`);
    
    // Solo el usuario involucrado o un admin puede ver los detalles
    if (payment.user_id !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      console.log(`❌ [DEBUG] Sin permisos para ver pago ${id}`);
      return res.status(403).json({ error: 'No tienes permiso para ver este pago' });
    }
    
    // Obtener los consumos asociados a este pago
    const [consumptions] = await connection.query(
      `SELECT c.*, p.name as product_name, cpd.created_at as payment_detail_date
       FROM consumption_payments_details cpd
       JOIN consumptions c ON cpd.consumption_id = c.id
       JOIN products p ON c.product_id = p.id
       WHERE cpd.payment_id = ?
       ORDER BY c.created_at DESC`,
      [id]
    );
    
    console.log(`✅ [DEBUG] Encontrados ${consumptions.length} consumos para pago ${id}`);
    
    connection.release();
    
    // Devolver la estructura que espera el frontend
    res.status(200).json({
      payment: payment,
      consumptions: consumptions
    });
      } catch (error) {
    console.error('❌ [DEBUG] Error al obtener detalles del pago:', error);
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

// Aprobar un pago de consumiciones
export const approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Solo un admin puede aprobar pagos
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para aprobar pagos' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Verificar que el pago existe y está pendiente
      const [payments] = await connection.query(
        'SELECT * FROM consumption_payments WHERE id = ? AND status = ? FOR UPDATE',
        [paymentId, 'pendiente']
      );
      
      if (payments.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Pago no encontrado o ya procesado' });
      }
      
      // Actualizar el estado del pago a aprobado
      await connection.query(
        'UPDATE consumption_payments SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
        ['aprobado', req.user.id, paymentId]
      );
      
      // Obtener los consumos asociados a este pago
      const [paymentDetails] = await connection.query(
        'SELECT consumption_id FROM consumption_payments_details WHERE payment_id = ?',
        [paymentId]
      );
      
      const consumptionIds = paymentDetails.map(detail => detail.consumption_id);
      
      // Si hay consumos asociados, marcarlos como pagados (paid = 2)
      if (consumptionIds.length > 0) {
        await connection.query(
          'UPDATE consumptions SET paid = 2 WHERE id IN (?)',
          [consumptionIds]
        );
      } else {
        // Si no hay consumos asociados explícitamente, buscar consumos en estado "pendiente de aprobación"
        // del mismo usuario del pago y marcarlos como pagados hasta cubrir el monto del pago
        const payment = payments[0];
        
        const [pendingConsumptions] = await connection.query(
          `SELECT id, total_price FROM consumptions 
           WHERE user_id = ? AND paid = 1 
           ORDER BY created_at ASC`,
          [payment.user_id]
        );
        
        let remainingAmount = parseFloat(payment.amount);
        const consumptionsToUpdate = [];
        
        for (const consumption of pendingConsumptions) {
          if (remainingAmount >= parseFloat(consumption.total_price)) {
            consumptionsToUpdate.push(consumption.id);
            remainingAmount -= parseFloat(consumption.total_price);
            
            // Registrar en la tabla de detalles
            await connection.query(
              'INSERT INTO consumption_payments_details (payment_id, consumption_id) VALUES (?, ?)',
              [paymentId, consumption.id]
            );
          } else {
            break;
          }
        }
        
        if (consumptionsToUpdate.length > 0) {
          await connection.query(
            'UPDATE consumptions SET paid = 2 WHERE id IN (?)',
            [consumptionsToUpdate]
          );
        }
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener el pago actualizado
      const [updatedPayment] = await connection.query(
        `SELECT cp.*, 
         u_created.name as created_by_name, 
         u_approved.name as approved_by_name
         FROM consumption_payments cp
         JOIN users u ON cp.user_id = u.id
         JOIN users u_created ON cp.created_by = u_created.id
         LEFT JOIN users u_approved ON cp.approved_by = u_approved.id
         WHERE cp.id = ?`,
        [paymentId]
      );
      
      connection.release();
      
      return res.status(200).json({
        message: 'Pago aprobado correctamente',
        payment: updatedPayment[0]
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error al aprobar el pago:', error);
    return res.status(500).json({ error: 'Error del servidor al aprobar el pago' });
  }
};

// Obtener todos los pagos pendientes de aprobación (solo admin)
export const getPendingPayments = async (req, res) => {
  console.log('🔍 [DEBUG] getPendingPayments función ejecutada');
  
  // Solo administradores pueden ver todos los pagos pendientes
  if (req.user.role !== 'admin') {
    console.log('❌ [DEBUG] Usuario no es admin:', req.user.role);
    return res.status(403).json({ error: 'No tienes permisos para ver todos los pagos pendientes' });
  }
  
  console.log('✅ [DEBUG] Usuario es admin, procediendo...');
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ [DEBUG] Conexión a base de datos obtenida');
    
    console.log('🔍 [DEBUG] Ejecutando consulta de pagos pendientes...');
    
    // Obtener pagos pendientes (status = 'pendiente')
    const [payments] = await connection.query(
      `SELECT cp.*, 
       u.name as user_name,
       u_created.name as created_by_name,
       (SELECT COUNT(*) FROM consumption_payments_details WHERE payment_id = cp.id) as consumptions_count
       FROM consumption_payments cp
       JOIN users u ON cp.user_id = u.id
       JOIN users u_created ON cp.created_by = u_created.id
       WHERE cp.status = 'pendiente'
       ORDER BY cp.payment_date DESC`
    );
    
    console.log(`✅ [DEBUG] Consulta ejecutada. Encontrados ${payments.length} pagos pendientes`);
    
    if (payments.length > 0) {
      console.log('🔍 [DEBUG] Primer pago encontrado:', {
        id: payments[0].id,
        user_name: payments[0].user_name,
        amount: payments[0].amount,
        status: payments[0].status,
        payment_date: payments[0].payment_date
      });
    }
    
    // Devolver directamente los pagos por ahora, sin procesar detalles
    console.log(`📤 [DEBUG] Enviando respuesta con ${payments.length} pagos pendientes`);
    
    connection.release();
    
    return res.status(200).json(payments);
    
  } catch (error) {
    console.error('❌ [DEBUG] Error en getPendingPayments:', error);
    console.error('📍 [DEBUG] Stack trace:', error.stack);
    return res.status(500).json({ error: 'Error del servidor al obtener pagos pendientes' });
  }
};
