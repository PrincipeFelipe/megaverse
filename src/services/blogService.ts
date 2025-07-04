import { BlogPost, BlogCategory, BlogTag, BlogFilters } from '../types/blog';
import { normalizeNumericValues } from './api';

// Asegurarnos de que la URL base sea consistente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';

export const blogService = {
  /**
   * Obtener todas las entradas del blog con filtros opcionales
   * @param filters Filtros opcionales para las entradas del blog
   * @param isPublicPage Si es true, solo muestra posts publicados (para la página pública)
   */
  getAllPosts: async (filters?: BlogFilters, isPublicPage = false): Promise<BlogPost[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      console.log('blogService.getAllPosts - isPublicPage:', isPublicPage);
      
      // Construir URL con filtros
      let url = `${API_URL}/blog/posts`;
      
      // Agregar filtros como parámetros de consulta si existen
      if (filters || isPublicPage) {
        const params = new URLSearchParams();
        
        // Si estamos en la página pública, siempre filtrar por status='published'
        if (isPublicPage) {
          console.log('Añadiendo filtro status=published para la página pública');
          // Forzar el parámetro de status a 'published' para páginas públicas
          params.append('status', 'published');
          // Eliminar cualquier otro filtro de status que pudiera existir
          if (filters?.status) {
            console.log('Ignorando filtro de status existente:', filters.status);
          }
        } else if (filters?.status) {
          params.append('status', filters.status);
        }
        
        // Resto de filtros
        if (filters?.category) params.append('category', filters.category);
        if (filters?.tag) params.append('tag', filters.tag);
        if (filters?.author_id) params.append('author_id', filters.author_id.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.sort_by) params.append('sort_by', filters.sort_by);
        if (filters?.sort_order) params.append('sort_order', filters.sort_order);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      // Log para mostrar la URL completa de la solicitud
      console.log('Enviando solicitud a:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener posts: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Log para mostrar cuántos posts se han recibido y sus estados
      if (data.posts) {
        console.log(`Recibidos ${data.posts.length} posts del servidor`);
        console.log('Estados de los posts recibidos:', data.posts.map((p: any) => p.status));
        
        // Si estamos en la página pública, asegurarnos de que sólo se devuelven posts publicados
        if (isPublicPage) {
          console.log('Filtrando posts para mostrar sólo publicados en el frontend');
          data.posts = data.posts.filter((post: any) => 
            post.status && post.status.toLowerCase() === 'published'
          );
          console.log(`Después del filtrado: ${data.posts.length} posts`);
        }
      }
      
      return normalizeNumericValues(data.posts || []);
    } catch (error: unknown) {
      console.error('Error en getAllPosts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Obtener un post por su ID
   * @param id ID del post
   */
  getPostById: async (id: number): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener el post: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.post);
    } catch (error: unknown) {
      console.error('Error en getPostById:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Obtener un post por su slug
   * @param slug Slug del post
   */
  getPostBySlug: async (slug: string, isPublicPage = false): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      // Añadimos el parámetro publicOnly cuando estamos en la página pública
      let url = `${API_URL}/blog/posts/slug/${slug}`;
      if (isPublicPage) {
        url += '?publicOnly=true';
      }
      
      console.log(`Obteniendo post por slug: ${slug}, isPublicPage: ${isPublicPage}`);
      console.log(`URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener el post: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Si los tags son objetos, aseguramos que BlogPostPage los pueda manejar
      if (data.post && data.post.tags && Array.isArray(data.post.tags)) {
        console.log('Tags recibidos:', data.post.tags);
      }
      
      return normalizeNumericValues(data.post);
    } catch (error: unknown) {
      console.error('Error en getPostBySlug:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Crear un nuevo post
   * @param post Datos del post
   */
  createPost: async (post: Partial<BlogPost>): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
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
        throw new Error(`Error al crear el post: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Mostrar información sobre publicación en redes sociales si está disponible
      if (data.socialMediaResults && data.socialMediaResults.length > 0) {
        console.log('Resultados de publicación en redes sociales:', data.socialMediaResults);
        
        // Verificar errores en las publicaciones
        const errors = data.socialMediaResults.filter((result: {success: boolean}) => !result.success);
        if (errors.length > 0) {
          console.warn('Algunas publicaciones en redes sociales fallaron:', errors);
        }
      }
      
      return normalizeNumericValues(data.post);
    } catch (error: unknown) {
      console.error('Error en createPost:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Actualizar un post existente
   * @param id ID del post
   * @param post Datos actualizados del post
   */
  updatePost: async (id: number, post: Partial<BlogPost>): Promise<BlogPost> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      // Asegurar que socialMedia sea un array si está definido
      if (post.socialMedia && !Array.isArray(post.socialMedia)) {
        post.socialMedia = [];
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
        throw new Error(`Error al actualizar el post: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Mostrar información sobre publicación en redes sociales si está disponible
      if (data.socialMediaResults && data.socialMediaResults.length > 0) {
        console.log('Resultados de publicación en redes sociales:', data.socialMediaResults);
        
        // Verificar errores en las publicaciones
        const errors = data.socialMediaResults.filter((result: {success: boolean}) => !result.success);
        if (errors.length > 0) {
          console.warn('Algunas publicaciones en redes sociales fallaron:', errors);
        }
      }
      
      return normalizeNumericValues(data.post);
    } catch (error: unknown) {
      console.error('Error en updatePost:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Eliminar un post
   * @param id ID del post a eliminar
   */
  deletePost: async (id: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar el post: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error('Error en deletePost:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Obtener todas las categorías del blog
   */
  getAllCategories: async (): Promise<BlogCategory[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener categorías: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.categories || []);
    } catch (error: unknown) {
      console.error('Error en getAllCategories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Crear una nueva categoría
   * @param category Datos de la categoría
   */
  createCategory: async (category: Partial<BlogCategory>): Promise<BlogCategory> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(category)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear la categoría: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.category);
    } catch (error: unknown) {
      console.error('Error en createCategory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Actualizar una categoría existente
   * @param id ID de la categoría
   * @param category Datos actualizados de la categoría
   */
  updateCategory: async (id: number, category: Partial<BlogCategory>): Promise<BlogCategory> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(category)
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar la categoría: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.category);
    } catch (error: unknown) {
      console.error('Error en updateCategory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Eliminar una categoría
   * @param id ID de la categoría a eliminar
   */
  deleteCategory: async (id: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar la categoría: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error('Error en deleteCategory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Obtener todos los tags del blog
   */
  getAllTags: async (): Promise<BlogTag[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener etiquetas: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.tags || []);
    } catch (error: unknown) {
      console.error('Error en getAllTags:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Crear un nuevo tag
   * @param tag Datos del tag
   */
  createTag: async (tag: Partial<BlogTag>): Promise<BlogTag> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tag)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear la etiqueta: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.tag);
    } catch (error: unknown) {
      console.error('Error en createTag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Actualizar un tag existente
   * @param id ID del tag
   * @param tag Datos actualizados del tag
   */
  updateTag: async (id: number, tag: Partial<BlogTag>): Promise<BlogTag> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tag)
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar la etiqueta: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.tag);
    } catch (error: unknown) {
      console.error('Error en updateTag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Eliminar un tag
   * @param id ID del tag a eliminar
   */
  deleteTag: async (id: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      const response = await fetch(`${API_URL}/blog/tags/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar la etiqueta: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error('Error en deleteTag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  },
  

  
  /**
   * Obtener posts paginados con filtros opcionales
   * @param filters Filtros opcionales para las entradas del blog
   */
  getPosts: async (filters?: BlogFilters): Promise<{posts: BlogPost[], totalPages: number}> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
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
        throw new Error(`Error al obtener posts: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        posts: normalizeNumericValues(data.posts || []),
        totalPages: data.totalPages || 1
      };
    } catch (error: unknown) {
      console.error('Error en getPosts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  }
};
