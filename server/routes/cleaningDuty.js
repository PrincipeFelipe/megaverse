import express from 'express';
import * as cleaningDutyController from '../controllers/cleaningDuty.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas - Ninguna

// Rutas protegidas - Solo para usuarios autenticados
router.get('/config', authenticateToken, cleaningDutyController.getCleaningConfig);
router.get('/current', authenticateToken, cleaningDutyController.getCurrentCleaningAssignments);
router.get('/history', authenticateToken, cleaningDutyController.getCleaningHistory);
router.get('/user/:userId', authenticateToken, cleaningDutyController.getUserCleaningHistory);

// Rutas para administradores - Verificar que el usuario sea administrador
router.put('/config', authenticateToken, cleaningDutyController.updateCleaningConfig);
router.post('/assign', authenticateToken, cleaningDutyController.assignCleaningDuty);
router.put('/status/:assignmentId', authenticateToken, cleaningDutyController.updateCleaningStatus);

// Gestión de exenciones
router.get('/exemptions', authenticateToken, cleaningDutyController.getCleaningExemptions);
router.post('/exemptions', authenticateToken, cleaningDutyController.addCleaningExemption);
router.delete('/exemptions/:exemptionId', authenticateToken, cleaningDutyController.deleteCleaningExemption);

export default router;
