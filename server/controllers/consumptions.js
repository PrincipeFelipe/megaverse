import { pool } from '../config/database.js';

export const getAllConsumptions = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    let query = `
      SELECT c.*, p.name as product_name, u.name as user_name,
      CASE 
        WHEN c.paid = 0 THEN 'pendiente'
        WHEN c.paid = 1 THEN 'procesando'
        WHEN c.paid = 2 THEN 'pagado'
        ELSE 'desconocido'
      END as payment_status
      FROM consumptions c
      JOIN products p ON c.product_id = p.id
      JOIN users u ON c.user_id = u.id
    `;
    
    let params = [];
    
    // Si no es admin, filtrar solo los consumos del usuario actual
    if (req.user.role !== 'admin') {
      query += ' WHERE c.user_id = ?';
      params.push(req.user.id);
    }
    
    // Ordenar por fecha descendente
    query += ' ORDER BY c.created_at DESC';
    
    const [consumptions] = await connection.query(query, params);
    connection.release();
    
    return res.status(200).json(consumptions);
  } catch (error) {
    console.error('Error al obtener consumos:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener consumos' });
  }
};

export const getUserConsumptions = async (req, res) => {
  const { userId } = req.params;
  
  // Verificar permisos
  if (req.user.id != userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para ver estos consumos' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    const [consumptions] = await connection.query(
      `SELECT c.*, p.name as product_name,
       CASE 
         WHEN c.paid = 0 THEN 'pendiente'
         WHEN c.paid = 1 THEN 'procesando'
         WHEN c.paid = 2 THEN 'pagado'
         ELSE 'desconocido'
       END as payment_status
       FROM consumptions c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    connection.release();
    
    return res.status(200).json(consumptions);
  } catch (error) {
    console.error('Error al obtener consumos del usuario:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener consumos' });
  }
};

export const createConsumption = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.body.userId || req.user.id;
  
  // Si se especifica un userId diferente, solo un admin puede hacer esto
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos para crear consumos para otros usuarios' });
  }
  
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Se requieren productId y quantity válidos' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Iniciar transacción
    await connection.beginTransaction();
      try {
      // 1. Verificar si el producto existe y tiene stock suficiente
      const [products] = await connection.query(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );
      
      if (products.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const product = products[0];
      
      if (product.stock < quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'No hay suficiente stock disponible' });
      }
        // 2. Verificar que el usuario existe - Usamos FOR UPDATE para bloquear el registro
      // Esto evita el error "Record has changed since last read" cuando hay múltiples operaciones concurrentes
      const [users] = await connection.query(
        'SELECT * FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );
      
      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      const user = users[0];
      
      // 3. Calcular precio total
      const totalPrice = product.price * quantity;
      
      // NOTA: Ya NO verificamos saldo - permitimos consumo a crédito
      // El balance del usuario puede ser negativo (representa deuda a pagar)
      
      // 5. Actualizar stock del producto
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [quantity, productId]
      );
      
      // 6. Incrementar la deuda del usuario (aumentar el balance negativo)
      await connection.query(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [totalPrice, userId]
      );
      
      // 7. Registrar el consumo
      const [result] = await connection.query(
        'INSERT INTO consumptions (user_id, product_id, quantity, total_price, paid) VALUES (?, ?, ?, ?, 0)',
        [userId, productId, quantity, totalPrice]
      );
      
      // 8. Obtener el consumo recién creado
      const [newConsumption] = await connection.query(
        `SELECT c.*, p.name as product_name,
         CASE 
           WHEN c.paid = 0 THEN 'pendiente'
           WHEN c.paid = 1 THEN 'procesando'
           WHEN c.paid = 2 THEN 'pagado'
           ELSE 'desconocido'
         END as payment_status
         FROM consumptions c
         JOIN products p ON c.product_id = p.id
         WHERE c.id = ?`,
        [result.insertId]
      );
      
      // Confirmar transacción
      await connection.commit();
      connection.release();
      
      return res.status(201).json({
        message: 'Consumo registrado correctamente. Se ha añadido a tu cuenta para pagar posteriormente.',
        consumption: newConsumption[0]
      });
      
    } catch (error) {
      // Revertir transacción en caso de error
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error durante rollback:', rollbackError);
      }
      
      connection.release();
      console.error('Error en la transacción:', error);
      return res.status(500).json({ error: 'Error del servidor al crear consumo' });
    }  } catch (error) {
    console.error('Error al crear consumo:', error);
    // La conexión ya debería estar liberada por el bloque try-catch interior
    return res.status(500).json({ error: 'Error del servidor al crear consumo' });
  }
};

export const getPendingConsumptions = async (req, res) => {
  const { userId } = req.params;
  
  // Verificar permisos
  if (req.user.id != userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para ver estos consumos' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Obtener solo los consumos con paid=0 (no pagados)
    const [consumptions] = await connection.query(
      `SELECT c.*, p.name as product_name,
       CASE 
         WHEN c.paid = 0 THEN 'pendiente'
         WHEN c.paid = 1 THEN 'procesando'
         WHEN c.paid = 2 THEN 'pagado'
         ELSE 'desconocido'
       END as payment_status
       FROM consumptions c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ? AND c.paid = 0
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    // Calcular el total pendiente
    const [totalResult] = await connection.query(
      `SELECT SUM(total_price) as total_pending
       FROM consumptions
       WHERE user_id = ? AND paid = 0`,
      [userId]
    );
    
    connection.release();
    
    return res.status(200).json({
      consumptions,
      totalPending: totalResult[0].total_pending || 0
    });
  } catch (error) {
    console.error('Error al obtener consumos pendientes del usuario:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener consumos pendientes' });
  }
};
