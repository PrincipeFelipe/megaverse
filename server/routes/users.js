import express from 'express';
import * as userController from '../controllers/users.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', isAdmin, userController.getAllUsers);
router.get('/list-for-selection', userController.getUsersForSelection); // Nueva ruta para selección sin requerir admin
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', isAdmin, userController.deleteUser);

export default router;
