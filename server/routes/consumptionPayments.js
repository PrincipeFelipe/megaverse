import express from 'express';
import * as consumptionPaymentsController from '../controllers/consumptionPayments.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { check } from 'express-validator';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener la deuda actual del usuario autenticado
router.get('/debt', consumptionPaymentsController.getUserDebt);

// Obtener la deuda de un usuario específico (para administradores)
router.get('/debt/:userId', consumptionPaymentsController.getUserDebt);

// Registrar un nuevo pago de consumiciones
router.post('/', [
  check('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser un número positivo'),
  check('paymentMethod').isIn(['efectivo', 'transferencia', 'bizum']).withMessage('El método de pago debe ser efectivo, transferencia o bizum'),
  check('referenceNumber').optional().isString().withMessage('El número de referencia debe ser un texto'),
  check('notes').optional().isString().withMessage('Las notas deben ser un texto')
], consumptionPaymentsController.createConsumptionPayment);

// Obtener historial de pagos
router.get('/', consumptionPaymentsController.getConsumptionPayments);

// Obtener detalles de un pago específico
router.get('/:id', consumptionPaymentsController.getPaymentDetails);

// Aprobar un pago de consumiciones (solo admin)
router.put('/:id/approve', isAdmin, consumptionPaymentsController.approveConsumptionPayment);

// Rechazar un pago de consumiciones (solo admin)
router.put('/:id/reject', isAdmin, [
  check('rejectionReason').isString().notEmpty().withMessage('La razón de rechazo es obligatoria')
], consumptionPaymentsController.rejectConsumptionPayment);

// Reintentar un pago rechazado
router.put('/:id/retry', [
  check('paymentMethod').isIn(['efectivo', 'transferencia', 'bizum']).withMessage('El método de pago debe ser efectivo, transferencia o bizum'),
  check('referenceNumber').optional().isString().withMessage('El número de referencia debe ser un texto'),
  check('notes').optional().isString().withMessage('Las notas deben ser un texto')
], consumptionPaymentsController.retryConsumptionPayment);

export default router;
