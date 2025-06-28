import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { blogService } from '../../services/blogService';
import { BlogPost, BlogCategory, BlogTag } from '../../types/blog';
import { BlogFilters } from '../../components/blog/BlogFilters';
import { BlogPostList } from '../../components/blog/BlogPostList';

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
      const response = await blogService.getAllPosts(filters);
      
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
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Blog de la Asociación</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Últimas noticias, eventos y artículos relacionados con nuestra comunidad
          </p>
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
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage;
