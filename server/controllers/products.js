import { pool } from '../config/database.js';

export const getAllProducts = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query('SELECT * FROM products');
    connection.release();
    
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener productos' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [id]);
    connection.release();
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    return res.status(200).json(products[0]);
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener producto' });
  }
};

export const createProduct = async (req, res) => {
  const { name, price, stock, category } = req.body;
  
  if (!name || !price || stock === undefined || !category) {
    return res.status(400).json({ error: 'Se requieren todos los campos' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)',
      [name, price, stock, category]
    );
    
    const [newProduct] = await connection.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    connection.release();
    
    return res.status(201).json({
      message: 'Producto creado correctamente',
      product: newProduct[0]
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ error: 'Error del servidor al crear producto' });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que el producto existe
    const [existingProducts] = await connection.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (existingProducts.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Preparar los campos a actualizar
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (stock !== undefined) updates.stock = stock;
    if (category !== undefined) updates.category = category;
    
    if (Object.keys(updates).length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }
    
    // Construir la consulta SQL dinámicamente
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await connection.query(
      `UPDATE products SET ${fields} WHERE id = ?`,
      [...values, id]
    );
    
    const [updatedProduct] = await connection.query('SELECT * FROM products WHERE id = ?', [id]);
    connection.release();
    
    return res.status(200).json({
      message: 'Producto actualizado correctamente',
      product: updatedProduct[0]
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({ error: 'Error del servidor al actualizar producto' });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que el producto existe
    const [existingProducts] = await connection.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (existingProducts.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    await connection.query('DELETE FROM products WHERE id = ?', [id]);
    connection.release();
    
    return res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'No se puede eliminar este producto porque tiene registros asociados' 
      });
    }
    
    return res.status(500).json({ error: 'Error del servidor al eliminar producto' });
  }
};
