import express from 'express';
import * as tableController from '../controllers/tables.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', tableController.getAllTables);
router.get('/:id', tableController.getTableById);

// Rutas protegidas para administradores
router.post('/', authenticateToken, isAdmin, tableController.createTable);
router.put('/:id', authenticateToken, isAdmin, tableController.updateTable);
router.delete('/:id', authenticateToken, isAdmin, tableController.deleteTable);

export default router;
