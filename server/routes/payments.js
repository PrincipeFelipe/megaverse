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
  check('payment_type').isIn(['normal', 'maintenance', 'entrance']).withMessage('El tipo de pago debe ser normal, maintenance o entrance'),
  check('month').custom((value, { req }) => {
    // month es obligatorio solo para tipos 'normal' y 'maintenance'
    if (['normal', 'maintenance'].includes(req.body.payment_type)) {
      if (!value || value < 1 || value > 12) {
        throw new Error('El mes debe ser un número entre 1 y 12 para pagos mensuales');
      }
    }
    return true;
  }),
  check('year').custom((value, { req }) => {
    // year es obligatorio solo para tipos 'normal' y 'maintenance'
    if (['normal', 'maintenance'].includes(req.body.payment_type)) {
      if (!value || value < 2000 || value > 2100) {
        throw new Error('El año debe ser válido para pagos mensuales');
      }
    }
    return true;
  }),
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
  check('payment_type').optional().isIn(['normal', 'maintenance', 'entrance']).withMessage('El tipo de pago debe ser normal, maintenance o entrance'),
  check('month').optional().custom((value, { req }) => {
    // month es obligatorio solo para tipos 'normal' y 'maintenance'
    if (req.body.payment_type && ['normal', 'maintenance'].includes(req.body.payment_type)) {
      if (!value || value < 1 || value > 12) {
        throw new Error('El mes debe ser un número entre 1 y 12 para pagos mensuales');
      }
    }
    return true;
  }),
  check('year').optional().custom((value, { req }) => {
    // year es obligatorio solo para tipos 'normal' y 'maintenance'
    if (req.body.payment_type && ['normal', 'maintenance'].includes(req.body.payment_type)) {
      if (!value || value < 2000 || value > 2100) {
        throw new Error('El año debe ser válido para pagos mensuales');
      }
    }
    return true;
  }),
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
