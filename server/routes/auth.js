import express from 'express';
import * as authController from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.get('/debug-jwt', authController.debugJwt);

export default router;
