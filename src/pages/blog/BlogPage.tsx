import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { blogService } from '../../services/blogService';
import { BlogPost, BlogCategory, BlogTag } from '../../types/blog';
import { BlogFilters } from '../../components/blog/BlogFilters';
import { BlogPostList } from '../../components/blog/BlogPostList';
import { createModuleLogger } from '../../utils/loggerExampleUsage';

const blogPageLogger = createModuleLogger('BLOG_PAGE');

const BlogPage: React.FC = () => {
  // Estado para los posts del blog
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para categorías y tags
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  
  // Estado para filtros y paginación
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    page: 1,
    limit: 10
  });
  
  // Estado para paginación
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  
  const navigate = useNavigate();
  
  // Cargar datos al iniciar
  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
  }, [filters.page]); // Recargar cuando cambie la página
  
  // Función para obtener los posts del blog
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      blogPageLogger.debug('Llamando a getAllPosts con isPublicPage=true');
      // Pasar true como segundo parámetro para indicar que es la página pública
      // y solo mostrar posts publicados
      const response = await blogService.getAllPosts(filters, true);
      
      if (response && 'posts' in response && 'pagination' in response) {
        // Si la API devuelve datos de paginación
        setPosts(response.posts);
        setPagination(response.pagination);
      } else {
        // Compatibilidad con la versión actual del servicio
        setPosts(response as BlogPost[]);
      }
    } catch (error: any) {
      console.error('Error al cargar los posts del blog:', error);
      setError('Error al cargar los posts del blog. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para obtener las categorías
  const fetchCategories = async () => {
    try {
      const data = await blogService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error al cargar las categorías:', error);
    }
  };
  
  // Función para obtener los tags
  const fetchTags = async () => {
    try {
      const data = await blogService.getAllTags();
      setTags(data);
    } catch (error) {
      console.error('Error al cargar los tags:', error);
    }
  };
  
  // No necesitamos las funciones obsoletas aquí, ya las reemplazamos arriba
  
  // Función para cambiar de página
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Función para aplicar filtros
  const handleFilterChange = (newFilters: {
    category: string;
    tag: string;
    search: string;
  }) => {
    blogPageLogger.debug('Aplicando filtros manteniendo isPublicPage=true', { newFilters });
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Resetear a primera página al filtrar
    }));
  };
  
  // Función para ver el detalle de un post
  const handleViewPost = (post: BlogPost) => {
    navigate(`/blog/${post.slug}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Blog de la Asociación</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Últimas noticias, eventos y artículos relacionados con nuestra comunidad
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/rss"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 11a9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9M6 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M12 12.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m6 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3" />
              </svg>
              RSS
            </Link>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <BlogFilters 
        categories={categories}
        tags={tags}
        initialFilters={{
          category: filters.category,
          tag: filters.tag,
          search: filters.search
        }}
        onFilterChange={handleFilterChange}
      />
      
      {/* Lista de posts */}
      <BlogPostList 
        posts={posts}
        loading={loading}
        error={error}
        onRetry={fetchPosts}
        onPostClick={handleViewPost}
        pagination={{
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          pages: pagination.pages
        }}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default BlogPage;
