import express from 'express';
import { 
  blogPostsController,
  blogCategoriesController, 
  blogTagsController
} from '../controllers/blog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas para posts del blog
// Rutas públicas (sin autenticación) - para lectura
router.get('/posts', blogPostsController.getAllPosts);
router.get('/posts/:id', blogPostsController.getPostById);
router.get('/posts/slug/:slug', blogPostsController.getPostBySlug);

// Rutas protegidas (con autenticación) - para administración
router.post('/posts', authenticateToken, blogPostsController.createPost);
router.put('/posts/:id', authenticateToken, blogPostsController.updatePost);
router.delete('/posts/:id', authenticateToken, blogPostsController.deletePost);

// Rutas para categorías
// Lectura pública
router.get('/categories', blogCategoriesController.getAllCategories);
// Administración protegida
router.post('/categories', authenticateToken, blogCategoriesController.createCategory);
router.put('/categories/:id', authenticateToken, blogCategoriesController.updateCategory);
router.delete('/categories/:id', authenticateToken, blogCategoriesController.deleteCategory);

// Rutas para tags
// Lectura pública
router.get('/tags', blogTagsController.getAllTags);
// Administración protegida
router.post('/tags', authenticateToken, blogTagsController.createTag);
router.put('/tags/:id', authenticateToken, blogTagsController.updateTag);
router.delete('/tags/:id', authenticateToken, blogTagsController.deleteTag);

// Las rutas para comentarios han sido eliminadas

export default router;
