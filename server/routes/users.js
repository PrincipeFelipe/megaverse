import express from 'express';
import * as userController from '../controllers/users.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Ruta pública para registro administrativo (sin autenticación)
router.post('/public-register', userController.registerUser);

// El resto de rutas requieren autenticación
router.use(authenticateToken);

router.get('/', isAdmin, userController.getAllUsers);
router.get('/list-for-selection', userController.getUsersForSelection); // Nueva ruta para selección sin requerir admin
router.post('/register', isAdmin, userController.registerUser); // Nueva ruta para registro administrativo con autenticación
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/toggle-active', isAdmin, userController.toggleUserActive); // Nueva ruta para activar/desactivar usuarios
router.delete('/:id', isAdmin, userController.deleteUser);

export default router;
