import express from 'express';
import { 
  blogPostsController,
  blogCategoriesController, 
  blogTagsController,
  blogCommentsController
} from '../controllers/blog.js';
import { validateAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas para posts del blog
router.get('/posts', validateAuth, blogPostsController.getAllPosts);
router.get('/posts/:id', validateAuth, blogPostsController.getPostById);
router.get('/posts/slug/:slug', validateAuth, blogPostsController.getPostBySlug);
router.post('/posts', validateAuth, blogPostsController.createPost);
router.put('/posts/:id', validateAuth, blogPostsController.updatePost);
router.delete('/posts/:id', validateAuth, blogPostsController.deletePost);

// Rutas para categorías
router.get('/categories', validateAuth, blogCategoriesController.getAllCategories);
router.post('/categories', validateAuth, blogCategoriesController.createCategory);
router.put('/categories/:id', validateAuth, blogCategoriesController.updateCategory);
router.delete('/categories/:id', validateAuth, blogCategoriesController.deleteCategory);

// Rutas para tags
router.get('/tags', validateAuth, blogTagsController.getAllTags);
router.post('/tags', validateAuth, blogTagsController.createTag);
router.put('/tags/:id', validateAuth, blogTagsController.updateTag);
router.delete('/tags/:id', validateAuth, blogTagsController.deleteTag);

// Rutas para comentarios
router.get('/posts/:postId/comments', validateAuth, blogCommentsController.getCommentsByPostId);
router.post('/posts/:postId/comments', validateAuth, blogCommentsController.createComment);
router.patch('/comments/:commentId/status', validateAuth, blogCommentsController.updateCommentStatus);
router.delete('/comments/:commentId', validateAuth, blogCommentsController.deleteComment);

export default router;
