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
