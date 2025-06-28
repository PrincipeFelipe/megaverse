import { BlogPost, BlogComment, BlogCategory, BlogTag, BlogFilters } from '../types/blog';
import { normalizeNumericValues } from './api';

// Asegurarnos de que la URL base sea consistente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';

export const blogService = {
  /**
   * Obtener todas las entradas del blog con filtros opcionales
   * @param filters Filtros opcionales para las entradas del blog
   */
  getAllPosts: async (filters?: BlogFilters): Promise<BlogPost[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder al blog');
      }
      
      // Construir URL con filtros
      let url = `${API_URL}/blog/posts`;
      
      // Agregar filtros como parámetros de consulta si existen
      if (filters) {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.tag) params.append('tag', filters.tag);
        if (filters.author_id) params.append('author_id', filters.author_id.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener entradas del blog: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.posts || []);
    } catch (error: any) {
      console.error('Error en getAllPosts:', error);
      throw new Error(error.message || 'Error al obtener entradas del blog');
    }
  },
  
  /**
   * Obtener una entrada del blog por su ID
   * @param id ID de la entrada del blog
   */
  getPostById: async (id: number): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder al blog');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener la entrada del blog: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.post);
    } catch (error: any) {
      console.error('Error en getPostById:', error);
      throw new Error(error.message || 'Error al obtener la entrada del blog');
    }
  },
  
  /**
   * Obtener una entrada del blog por su slug
   * @param slug Slug de la entrada del blog
   */
  getPostBySlug: async (slug: string): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder al blog');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/slug/${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener la entrada del blog: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.post);
    } catch (error: any) {
      console.error('Error en getPostBySlug:', error);
      throw new Error(error.message || 'Error al obtener la entrada del blog');
    }
  },
  
  /**
   * Crear una nueva entrada de blog
   * @param post Datos de la entrada del blog
   */
  createPost: async (post: Partial<BlogPost>): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para crear una entrada del blog');
      }
      
      const response = await fetch(`${API_URL}/blog/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(post)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear la entrada del blog: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.post);
    } catch (error: any) {
      console.error('Error en createPost:', error);
      throw new Error(error.message || 'Error al crear la entrada del blog');
    }
  },
  
  /**
   * Actualizar una entrada del blog existente
   * @param id ID de la entrada del blog
   * @param post Datos actualizados de la entrada del blog
   */
  updatePost: async (id: number, post: Partial<BlogPost>): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para actualizar una entrada del blog');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(post)
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar la entrada del blog: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.post);
    } catch (error: any) {
      console.error('Error en updatePost:', error);
      throw new Error(error.message || 'Error al actualizar la entrada del blog');
    }
  },
  
  /**
   * Eliminar una entrada del blog
   * @param id ID de la entrada del blog a eliminar
   */
  deletePost: async (id: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para eliminar una entrada del blog');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar la entrada del blog: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error en deletePost:', error);
      throw new Error(error.message || 'Error al eliminar la entrada del blog');
    }
  },
  
  /**
   * Obtener todas las categorías del blog
   */
  getAllCategories: async (): Promise<BlogCategory[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder a las categorías del blog');
      }
      
      const response = await fetch(`${API_URL}/blog/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener categorías del blog: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.categories || []);
    } catch (error: any) {
      console.error('Error en getAllCategories:', error);
      throw new Error(error.message || 'Error al obtener categorías del blog');
    }
  },
  
  /**
   * Obtener todos los tags del blog
   */
  getAllTags: async (): Promise<BlogTag[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder a los tags del blog');
      }
      
      const response = await fetch(`${API_URL}/blog/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener tags del blog: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.tags || []);
    } catch (error: any) {
      console.error('Error en getAllTags:', error);
      throw new Error(error.message || 'Error al obtener tags del blog');
    }
  },
  
  /**
   * Obtener comentarios de una entrada del blog
   * @param postId ID de la entrada del blog
   */
  getCommentsByPostId: async (postId: number): Promise<BlogComment[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder a los comentarios');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener comentarios: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.comments || []);
    } catch (error: any) {
      console.error('Error en getCommentsByPostId:', error);
      throw new Error(error.message || 'Error al obtener comentarios');
    }
  },
  
  /**
   * Crear un nuevo comentario en una entrada del blog
   * @param postId ID de la entrada del blog
   * @param content Contenido del comentario
   */
  createComment: async (postId: number, content: string): Promise<BlogComment> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para crear un comentario');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear el comentario: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.comment);
    } catch (error: any) {
      console.error('Error en createComment:', error);
      throw new Error(error.message || 'Error al crear el comentario');
    }
  },
  
  /**
   * Eliminar un comentario
   * @param commentId ID del comentario a eliminar
   */
  deleteComment: async (commentId: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para eliminar un comentario');
      }
      
      const response = await fetch(`${API_URL}/blog/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar el comentario: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error en deleteComment:', error);
      throw new Error(error.message || 'Error al eliminar el comentario');
    }
  }
};
