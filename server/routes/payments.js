/**
 * Rutas para la gestión de pagos de cuotas de usuarios
 */

import express from 'express';
import { check } from 'express-validator';
import * as paymentsController from '../controllers/payments.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware para verificar que el usuario es administrador
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

// Obtener todos los pagos (con filtros)
// GET /api/payments
router.get('/', 
  authMiddleware, 
  isAdmin, 
  paymentsController.getPayments
);

// Crear un nuevo pago
// POST /api/payments
router.post('/', [
  authMiddleware,
  isAdmin,
  check('user_id').isInt().withMessage('El ID de usuario debe ser un número entero'),
  check('amount').isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  check('payment_date').isDate().withMessage('La fecha de pago debe tener formato YYYY-MM-DD'),
  check('payment_type').isIn(['normal', 'maintenance']).withMessage('El tipo de pago debe ser normal o maintenance'),
  check('month').isInt({ min: 1, max: 12 }).withMessage('El mes debe ser un número entre 1 y 12'),
  check('year').isInt({ min: 2000, max: 2100 }).withMessage('El año debe ser válido'),
  check('payment_method').optional().isString().withMessage('El método de pago debe ser un texto'),
  check('reference').optional().isString().withMessage('La referencia debe ser un texto'),
  check('notes').optional().isString().withMessage('Las notas deben ser un texto')
], paymentsController.createPayment);

// Actualizar un pago existente
// PUT /api/payments/:id
router.put('/:id', [
  authMiddleware,
  isAdmin,
  check('id').isInt().withMessage('El ID del pago debe ser un número entero'),
  check('amount').optional().isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  check('payment_date').optional().isDate().withMessage('La fecha de pago debe tener formato YYYY-MM-DD'),
  check('payment_type').optional().isIn(['normal', 'maintenance']).withMessage('El tipo de pago debe ser normal o maintenance'),
  check('month').optional().isInt({ min: 1, max: 12 }).withMessage('El mes debe ser un número entre 1 y 12'),
  check('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('El año debe ser válido'),
  check('payment_method').optional().isString().withMessage('El método de pago debe ser un texto'),
  check('reference').optional().isString().withMessage('La referencia debe ser un texto'),
  check('notes').optional().isString().withMessage('Las notas deben ser un texto')
], paymentsController.updatePayment);

// Eliminar un pago
// DELETE /api/payments/:id
router.delete('/:id', 
  authMiddleware,
  isAdmin,
  check('id').isInt().withMessage('El ID del pago debe ser un número entero'),
  paymentsController.deletePayment
);

// Obtener estadísticas de pagos
// GET /api/payments/stats
router.get('/stats',
  authMiddleware,
  isAdmin,
  paymentsController.getPaymentStats
);

// Generar informe de pagos
// GET /api/payments/report
router.get('/report',
  authMiddleware,
  isAdmin,
  paymentsController.generatePaymentReport
);

// Obtener pagos del usuario actual (sin necesidad de ser admin)
// GET /api/payments/user
router.get('/user', 
  authMiddleware, 
  paymentsController.getUserPayments
);

// Obtener detalles de un pago específico
// GET /api/payments/:id
router.get('/:id',
  authMiddleware,
  isAdmin,
  check('id').isInt().withMessage('El ID del pago debe ser un número entero'),
  paymentsController.getPaymentById
);

export default router;
