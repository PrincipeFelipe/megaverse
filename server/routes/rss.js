import express from 'express';
import { rssController } from '../controllers/rss.js';

const router = express.Router();

// Ruta para el feed RSS del blog (sin autenticación requerida)
router.get('/blog', rssController.getBlogRSSFeed);

// Ruta alternativa para compatibilidad
router.get('/blog.xml', rssController.getBlogRSSFeed);

export default router;
