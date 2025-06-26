import express from 'express';
import * as productController from '../controllers/products.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Rutas protegidas para administradores
router.post('/', authenticateToken, isAdmin, productController.createProduct);
router.put('/:id', authenticateToken, isAdmin, productController.updateProduct);
router.delete('/:id', authenticateToken, isAdmin, productController.deleteProduct);

export default router;
