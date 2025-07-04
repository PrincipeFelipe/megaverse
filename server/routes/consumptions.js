import express from 'express';
import * as consumptionController from '../controllers/consumptions.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de consumos requieren autenticación
router.use(authenticateToken);

router.get('/', consumptionController.getAllConsumptions);
router.get('/user/:userId', consumptionController.getUserConsumptions);
router.post('/', consumptionController.createConsumption);

export default router;
