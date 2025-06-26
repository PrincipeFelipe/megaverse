import express from 'express';
import * as reservationController from '../controllers/reservations.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de reservas requieren autenticación
router.use(authenticateToken);

router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.put('/:id/status', reservationController.updateReservationStatus);
router.put('/:id/approve', reservationController.approveReservation);
router.delete('/:id', reservationController.deleteReservation);

export default router;
