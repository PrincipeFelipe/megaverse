import { pool } from '../config/database.js';

export const getAllTables = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [tables] = await connection.query('SELECT * FROM tables');
    connection.release();
    
    return res.status(200).json(tables);
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener mesas' });
  }
};

export const getTableById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await pool.getConnection();
    const [tables] = await connection.query('SELECT * FROM tables WHERE id = ?', [id]);
    connection.release();
    
    if (tables.length === 0) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    
    return res.status(200).json(tables[0]);
  } catch (error) {
    console.error('Error al obtener mesa por ID:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener mesa' });
  }
};

export const createTable = async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nombre de la mesa es requerido' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'INSERT INTO tables (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    
    const [newTable] = await connection.query('SELECT * FROM tables WHERE id = ?', [result.insertId]);
    connection.release();
    
    return res.status(201).json({
      message: 'Mesa creada correctamente',
      table: newTable[0]
    });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    return res.status(500).json({ error: 'Error del servidor al crear mesa' });
  }
};

export const updateTable = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que la mesa existe
    const [existingTables] = await connection.query('SELECT * FROM tables WHERE id = ?', [id]);
    
    if (existingTables.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    
    // Preparar los campos a actualizar
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    
    if (Object.keys(updates).length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }
    
    // Construir la consulta SQL dinámicamente
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await connection.query(
      `UPDATE tables SET ${fields} WHERE id = ?`,
      [...values, id]
    );
    
    const [updatedTable] = await connection.query('SELECT * FROM tables WHERE id = ?', [id]);
    connection.release();
    
    return res.status(200).json({
      message: 'Mesa actualizada correctamente',
      table: updatedTable[0]
    });
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    return res.status(500).json({ error: 'Error del servidor al actualizar mesa' });
  }
};

export const deleteTable = async (req, res) => {
  const { id } = req.params;
  const { force } = req.query;
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que la mesa existe
    const [existingTables] = await connection.query('SELECT * FROM tables WHERE id = ?', [id]);
    
    if (existingTables.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    
    // Si se especifica force=true, intentar eliminar las reservas asociadas primero
    if (force === 'true') {
      try {
        // Verificar si hay reservas asociadas
        const [reservations] = await connection.query('SELECT id FROM reservations WHERE table_id = ?', [id]);
        
        if (reservations.length > 0) {
          console.log(`Eliminando ${reservations.length} reservas asociadas a la mesa ${id}`);
          // Eliminar todas las reservas asociadas
          await connection.query('DELETE FROM reservations WHERE table_id = ?', [id]);
        }
      } catch (reservationError) {
        console.error('Error al eliminar reservas asociadas:', reservationError);
        // Continuamos con el intento de eliminar la mesa
      }
    }
    
    // Ahora intentamos eliminar la mesa
    await connection.query('DELETE FROM tables WHERE id = ?', [id]);
    connection.release();
    
    return res.status(200).json({ message: 'Mesa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'No se puede eliminar esta mesa porque tiene reservas asociadas. Usa force=true para eliminar todas las reservas asociadas.' 
      });
    }
    
    return res.status(500).json({ error: 'Error del servidor al eliminar mesa' });
  }
};
