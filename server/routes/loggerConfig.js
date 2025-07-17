/**
 * Rutas para la configuración del logger
 */

import express from 'express';
import { getLoggerConfig, updateLoggerConfig } from '../controllers/loggerConfig.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación de administrador
router.use(authenticateToken);
router.use(isAdmin);

// GET /api/logger/config - Obtener configuración del logger
router.get('/config', getLoggerConfig);

// PUT /api/logger/config - Actualizar configuración del logger
router.put('/config', updateLoggerConfig);

export default router;
