/**
 * Rutas para la gestión de gastos (pagos realizados por la asociación)
 */

import express from 'express';
import { check } from 'express-validator';
import * as expensesController from '../controllers/expenses.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware para verificar que el usuario es administrador
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

// Todas las rutas requieren autenticación y rol de administrador
// ya que solo los administradores pueden gestionar los gastos de la asociación

// Obtener todos los gastos (con filtros)
// GET /api/expenses
router.get('/', 
  authMiddleware, 
  isAdmin, 
  expensesController.getExpenses
);

// Crear un nuevo gasto
// POST /api/expenses
router.post('/', [
  authMiddleware,
  isAdmin,
  check('amount').isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  check('expense_date').isDate().withMessage('La fecha de gasto debe tener formato YYYY-MM-DD'),
  check('concept').notEmpty().withMessage('El concepto es obligatorio'),
  check('category').optional(),
  check('payment_method').optional(),
  check('recipient').optional(),
  check('reference').optional(),
  check('attachment_url').optional(),
  check('notes').optional()
], expensesController.createExpense);

// Actualizar un gasto existente
// PUT /api/expenses/:id
router.put('/:id', [
  authMiddleware,
  isAdmin,
  check('id').isInt().withMessage('El ID del gasto debe ser un número entero'),
  check('amount').optional().isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  check('expense_date').optional().isDate().withMessage('La fecha de gasto debe tener formato YYYY-MM-DD'),
  check('concept').optional().notEmpty().withMessage('El concepto es obligatorio'),
  check('category').optional(),
  check('payment_method').optional(),
  check('recipient').optional(),
  check('reference').optional(),
  check('attachment_url').optional(),
  check('notes').optional()
], expensesController.updateExpense);

// Eliminar un gasto
// DELETE /api/expenses/:id
router.delete('/:id', 
  authMiddleware,
  isAdmin,
  check('id').isInt().withMessage('El ID del gasto debe ser un número entero'),
  expensesController.deleteExpense
);

// Generar informe de gastos
// GET /api/expenses/report
router.get('/report',
  authMiddleware,
  isAdmin,
  expensesController.generateExpenseReport
);

// Obtener detalles de un gasto específico
// GET /api/expenses/:id
router.get('/:id',
  authMiddleware,
  isAdmin,
  check('id').isInt().withMessage('El ID del gasto debe ser un número entero'),
  expensesController.getExpenseById
);

export default router;
