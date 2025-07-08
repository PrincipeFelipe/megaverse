import express from 'express';
import * as reservationController from '../controllers/reservations.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de reservas requieren autenticación
router.use(authenticateToken);

// Middleware de debugging para registrar todas las peticiones
router.use((req, res, next) => {
  console.log(`🟡 RESERVATIONS ROUTE: ${req.method} ${req.originalUrl} - Params:`, req.params, '- Body:', req.body);
  next();
});

router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/', reservationController.createReservation);
// Rutas más específicas primero
router.put('/:id/status', reservationController.updateReservationStatus);
router.put('/:id/approve', reservationController.approveReservation);
router.put('/:id/reject', reservationController.rejectReservation);
// Ruta más general al final
router.put('/:id', reservationController.updateReservation);
router.delete('/:id', reservationController.deleteReservation);

export default router;
