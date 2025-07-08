import express from 'express';
import * as consumptionController from '../controllers/consumptions.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de consumos requieren autenticación
router.use(authenticateToken);

router.get('/', consumptionController.getAllConsumptions);
router.get('/user/:userId', consumptionController.getUserConsumptions);
// Ruta para obtener consumos pendientes de pago por usuario
router.get('/user/:userId/pending', consumptionController.getPendingConsumptions);
// Ruta para obtener consumos no pagados de un usuario (nueva interfaz)
router.get('/unpaid/:userId', consumptionController.getUnpaidConsumptions);
// Ruta para obtener todos los consumos no pagados (para administradores)
router.get('/all-unpaid', isAdmin, consumptionController.getAllUnpaidConsumptions);
router.post('/', consumptionController.createConsumption);

export default router;
