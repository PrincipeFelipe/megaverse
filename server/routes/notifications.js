import express from 'express';
import * as notificationController from '../controllers/notifications.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener notificaciones del usuario actual
router.get('/', notificationController.getUserNotifications);

// Obtener conteo de notificaciones no leídas
router.get('/unread-count', notificationController.getUnreadNotificationsCount);

// Marcar notificación específica como leída
router.put('/:id/read', notificationController.markNotificationAsRead);

// Marcar todas las notificaciones como leídas
router.put('/mark-all-read', notificationController.markAllNotificationsAsRead);

// Eliminar notificación específica
router.delete('/:id', notificationController.deleteNotification);

export default router;
