/**
 * Controlador para gestionar los gastos (pagos realizados por la asociación)
 */

import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Obtener todos los gastos (con opciones de filtrado)
export const getExpenses = async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT e.*, 
             u.name as created_by_name
      FROM association_expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Aplicar filtros si se proporcionan
    if (category) {
      query += " AND e.category = ?";
      queryParams.push(category);
    }
    
    if (startDate) {
      query += " AND e.expense_date >= ?";
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += " AND e.expense_date <= ?";
      queryParams.push(endDate);
    }
    
    // Ordenar por fecha de gasto descendente (más recientes primero)
    query += " ORDER BY e.expense_date DESC, e.id DESC LIMIT ? OFFSET ?";
    queryParams.push(Number(limit), Number(offset));
    
    const connection = await pool.getConnection();
    const [expenses] = await connection.query(query, queryParams);
    
    // Obtener el total de registros para la paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM association_expenses e
      WHERE 1=1
    `;
    
    // Replicar los mismos filtros excepto limit y offset
    const countParams = [];
    
    if (category) {
      countQuery += " AND e.category = ?";
      countParams.push(category);
    }
    
    if (startDate) {
      countQuery += " AND e.expense_date >= ?";
      countParams.push(startDate);
    }
    
    if (endDate) {
      countQuery += " AND e.expense_date <= ?";
      countParams.push(endDate);
    }
    
    const [countResult] = await connection.query(countQuery, countParams);
    connection.release();
    
    res.json({
      expenses,
      total: countResult[0].total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error al obtener los gastos:', error);
    res.status(500).json({ error: 'Error al obtener los gastos.' });
  }
};

// Crear un nuevo gasto
export const createExpense = async (req, res) => {
  try {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      amount,
      expense_date,
      concept,
      category,
      payment_method,
      recipient,
      reference,
      attachment_url,
      notes
    } = req.body;
    
    // El usuario que crea el gasto es el autenticado
    const created_by = req.user.id;
    
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      `INSERT INTO association_expenses (
        amount, expense_date, concept, category, payment_method, 
        recipient, reference, attachment_url, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [amount, expense_date, concept, category, payment_method, 
       recipient, reference, attachment_url, notes, created_by]
    );
    
    // Obtener el gasto recién creado
    const [expenses] = await connection.query(
      'SELECT e.*, u.name as created_by_name FROM association_expenses e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?',
      [result.insertId]
    );
    
    connection.release();
    
    res.status(201).json({
      expense: expenses[0],
      message: 'Gasto registrado correctamente.'
    });
  } catch (error) {
    console.error('Error al crear el gasto:', error);
    res.status(500).json({ error: 'Error al crear el gasto.' });
  }
};

// Actualizar un gasto existente
export const updateExpense = async (req, res) => {
  try {
    // Validar los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    
    const {
      amount,
      expense_date,
      concept,
      category,
      payment_method,
      recipient,
      reference,
      attachment_url,
      notes
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Verificar que el gasto existe
    const [existingExpense] = await connection.query(
      'SELECT * FROM association_expenses WHERE id = ?',
      [id]
    );
    
    if (existingExpense.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Gasto no encontrado.' });
    }
    
    // Actualizar el gasto
    await connection.query(
      `UPDATE association_expenses SET
        amount = ?, expense_date = ?, concept = ?, category = ?, payment_method = ?,
        recipient = ?, reference = ?, attachment_url = ?, notes = ?
        WHERE id = ?`,
      [amount, expense_date, concept, category, payment_method, 
       recipient, reference, attachment_url, notes, id]
    );
    
    // Obtener el gasto actualizado
    const [expenses] = await connection.query(
      'SELECT e.*, u.name as created_by_name FROM association_expenses e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?',
      [id]
    );
    
    connection.release();
    
    res.json({
      expense: expenses[0],
      message: 'Gasto actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error al actualizar el gasto:', error);
    res.status(500).json({ error: 'Error al actualizar el gasto.' });
  }
};

// Eliminar un gasto
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    // Verificar que el gasto existe
    const [existingExpense] = await connection.query(
      'SELECT * FROM association_expenses WHERE id = ?',
      [id]
    );
    
    if (existingExpense.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Gasto no encontrado.' });
    }
    
    // Eliminar el archivo adjunto si existe
    if (existingExpense[0].attachment_url) {
      const filePath = path.join(__dirname, '..', existingExpense[0].attachment_url.replace('/uploads', 'uploads'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Eliminar el gasto
    await connection.query(
      'DELETE FROM association_expenses WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    res.json({
      message: 'Gasto eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error al eliminar el gasto:', error);
    res.status(500).json({ error: 'Error al eliminar el gasto.' });
  }
};

// Obtener un gasto específico
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    const [expenses] = await connection.query(
      'SELECT e.*, u.name as created_by_name FROM association_expenses e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?',
      [id]
    );
    
    connection.release();
    
    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado.' });
    }
    
    res.json(expenses[0]);
  } catch (error) {
    console.error('Error al obtener el gasto:', error);
    res.status(500).json({ error: 'Error al obtener el gasto.' });
  }
};

// Generar reporte de gastos
export const generateExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    let query = `
      SELECT e.*, 
             u.name as created_by_name
      FROM association_expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (startDate) {
      query += " AND e.expense_date >= ?";
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += " AND e.expense_date <= ?";
      queryParams.push(endDate);
    }
    
    if (category) {
      query += " AND e.category = ?";
      queryParams.push(category);
    }
    
    query += " ORDER BY e.expense_date DESC, e.id DESC";
    
    const connection = await pool.getConnection();
    const [expenses] = await connection.query(query, queryParams);
    
    // Calcular totales por categoría
    let totalsQuery = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM association_expenses
      WHERE 1=1
    `;
    
    const totalsParams = [];
    
    if (startDate) {
      totalsQuery += " AND expense_date >= ?";
      totalsParams.push(startDate);
    }
    
    if (endDate) {
      totalsQuery += " AND expense_date <= ?";
      totalsParams.push(endDate);
    }
    
    if (category) {
      totalsQuery += " AND category = ?";
      totalsParams.push(category);
    }
    
    totalsQuery += " GROUP BY category";
    
    const [totals] = await connection.query(totalsQuery, totalsParams);
    
    connection.release();
    
    res.json({
      expenses,
      totals,
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Error al generar el informe de gastos:', error);
    res.status(500).json({ error: 'Error al generar el informe de gastos.' });
  }
};
