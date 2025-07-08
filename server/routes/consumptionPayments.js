import express from 'express';
import * as consumptionPaymentsController from '../controllers/consumptionPayments.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { check, validationResult } from 'express-validator';

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
  check('notes').optional().isString().withMessage('Las notas deben ser un texto'),
  check('consumptionIds').optional().isArray().withMessage('Los IDs de consumo deben ser un array')
], consumptionPaymentsController.createConsumptionPayment);

// Aprobar un pago (solo administradores)
router.put('/:paymentId/approve', isAdmin, consumptionPaymentsController.approvePayment);

// Obtener historial de pagos
router.get('/', consumptionPaymentsController.getConsumptionPayments);

// Obtener pagos pendientes de aprobación (solo admin)
router.get('/pending', isAdmin, consumptionPaymentsController.getPendingPayments);

// Obtener detalles de un pago específico
router.get('/:id', consumptionPaymentsController.getPaymentDetails);

// Obtener detalles de un pago específico (ruta alternativa más explícita)
router.get('/:id/details', consumptionPaymentsController.getPaymentDetails);

// Aprobar un pago de consumiciones (solo admin)
router.put('/:id/approve', isAdmin, consumptionPaymentsController.approveConsumptionPayment);

// Rechazar un pago de consumiciones (solo admin)
router.put('/:id/reject', isAdmin, [
  check('rejection_reason').isString().notEmpty().withMessage('La razón de rechazo es obligatoria')
], (req, res, next) => {
  // Debug middleware para interceptar errores de validación
  console.log('🔍 [DEBUG] Reject route - Request body:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ [DEBUG] Validation errors:', errors.array());
    return res.status(400).json({ 
      error: 'Debe proporcionar una razón para rechazar el pago',
      details: errors.array() 
    });
  }
  next();
}, consumptionPaymentsController.rejectConsumptionPayment);

// Reintentar un pago rechazado
router.put('/:id/retry', [
  check('paymentMethod').isIn(['efectivo', 'transferencia', 'bizum']).withMessage('El método de pago debe ser efectivo, transferencia o bizum'),
  check('referenceNumber').optional().isString().withMessage('El número de referencia debe ser un texto'),
  check('notes').optional().isString().withMessage('Las notas deben ser un texto')
], consumptionPaymentsController.retryConsumptionPayment);

export default router;
