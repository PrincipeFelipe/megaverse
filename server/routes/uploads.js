import express from 'express';
import { uploadAvatar, uploadUserAvatar, deleteUserAvatar } from '../controllers/uploads.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Subir avatar
router.post('/avatar', uploadAvatar, uploadUserAvatar);

// Eliminar avatar
router.delete('/avatar', deleteUserAvatar);

export default router;
