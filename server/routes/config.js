/**
 * Rutas para la gestión de configuración del sistema
 */

import express from 'express';
import { check } from 'express-validator';
import * as configController from '../controllers/config.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware para verificar que el usuario es administrador
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

// Ruta para obtener la configuración de reservas
// GET /api/config/reservation - No necesita autenticación para consultar
router.get('/reservation', configController.getReservationConfig);

// Ruta para actualizar la configuración de reservas (solo administradores)
// PUT /api/config/reservation
router.put('/reservation', [
  authMiddleware,
  isAdmin,
  check('max_hours_per_reservation').optional().isInt({ min: 1 }).withMessage('Las horas máximas deben ser un número entero mayor que 0'),
  check('max_reservations_per_user_per_day').optional().isInt({ min: 0 }).withMessage('El máximo de reservas por usuario debe ser un número entero no negativo'),
  check('min_hours_in_advance').optional().isInt({ min: 0 }).withMessage('Las horas mínimas de antelación deben ser un número no negativo'),
  check('allowed_start_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('El formato de hora de inicio debe ser HH:MM'),
  check('allowed_end_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('El formato de hora de fin debe ser HH:MM'),
  check('requires_approval_for_all_day').optional().isBoolean().withMessage('El campo de aprobación debe ser booleano'),
  check('normal_fee').optional().isFloat({ min: 0 }).withMessage('La cuota normal debe ser un número mayor o igual a 0'),
  check('maintenance_fee').optional().isFloat({ min: 0 }).withMessage('La cuota de mantenimiento debe ser un número mayor o igual a 0')
], configController.updateReservationConfig);

export default router;
