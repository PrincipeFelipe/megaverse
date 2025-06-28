import express from 'express';
import { 
  blogPostsController,
  blogCategoriesController, 
  blogTagsController,
  blogCommentsController
} from '../controllers/blog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas para posts del blog
router.get('/posts', authenticateToken, blogPostsController.getAllPosts);
router.get('/posts/:id', authenticateToken, blogPostsController.getPostById);
router.get('/posts/slug/:slug', authenticateToken, blogPostsController.getPostBySlug);
router.post('/posts', authenticateToken, blogPostsController.createPost);
router.put('/posts/:id', authenticateToken, blogPostsController.updatePost);
router.delete('/posts/:id', authenticateToken, blogPostsController.deletePost);

// Rutas para categorías
router.get('/categories', authenticateToken, blogCategoriesController.getAllCategories);
router.post('/categories', authenticateToken, blogCategoriesController.createCategory);
router.put('/categories/:id', authenticateToken, blogCategoriesController.updateCategory);
router.delete('/categories/:id', authenticateToken, blogCategoriesController.deleteCategory);

// Rutas para tags
router.get('/tags', authenticateToken, blogTagsController.getAllTags);
router.post('/tags', authenticateToken, blogTagsController.createTag);
router.put('/tags/:id', authenticateToken, blogTagsController.updateTag);
router.delete('/tags/:id', authenticateToken, blogTagsController.deleteTag);

// Rutas para comentarios
router.get('/posts/:postId/comments', authenticateToken, blogCommentsController.getCommentsByPostId);
router.post('/posts/:postId/comments', authenticateToken, blogCommentsController.createComment);
router.patch('/comments/:commentId/status', authenticateToken, blogCommentsController.updateCommentStatus);
router.delete('/comments/:commentId', authenticateToken, blogCommentsController.deleteComment);

export default router;
