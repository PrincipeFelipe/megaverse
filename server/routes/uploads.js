import express from 'express';
import { 
  uploadAvatar, 
  uploadUserAvatar, 
  deleteUserAvatar, 
  uploadBlogImage, 
  uploadBlogImageHandler,
  deleteBlogImage
} from '../controllers/uploads.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para avatar de usuario
router.post('/avatar', uploadAvatar, uploadUserAvatar);
router.delete('/avatar', deleteUserAvatar);

// Rutas para imágenes del blog
router.post('/blog', uploadBlogImageHandler);
router.delete('/blog/:filename', deleteBlogImage);

export default router;
