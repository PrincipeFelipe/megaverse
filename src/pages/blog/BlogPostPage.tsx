import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../types/blog';
import { ChevronLeft, Calendar, User, Tag } from 'lucide-react';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Cargar datos del post
  React.useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await blogService.getPostBySlug(slug);
        setPost(data);
      } catch (error: unknown) {
        console.error('Error al cargar el post:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar el post. Por favor, inténtelo de nuevo más tarde.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [slug]);
  
  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // Botón para volver atrás
  const handleGoBack = () => {
    navigate('/blog');
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button
          onClick={handleGoBack}
          variant="ghost"
          className="mb-6 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al blog
        </Button>
        
        {loading ? (
          // Esqueleto de carga
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 mb-4 w-3/4 rounded"></div>
            <div className="flex gap-4 mb-6">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 w-32 rounded"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 w-32 rounded"></div>
            </div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 mb-6 rounded"></div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        ) : error ? (
          // Mostrar error
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <Button
              onClick={() => {
                if (slug) {
                  setLoading(true);
                  blogService.getPostBySlug(slug)
                    .then(data => setPost(data))
                    .catch(err => setError(err.message || 'Error al cargar el post'))
                    .finally(() => setLoading(false));
                }
              }}
              variant="outline"
              className="mt-4"
            >
              Intentar de nuevo
            </Button>
          </div>
        ) : post ? (
          // Mostrar post
          <article className="prose prose-lg dark:prose-invert max-w-none">
            {/* Encabezado */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center">
                  <Calendar className="mr-2 w-4 h-4" />
                  {formatDate(post.created_at)}
                </div>
                <div className="flex items-center">
                  <User className="mr-2 w-4 h-4" />
                  {post.author_name}
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 rounded">
                  {post.category}
                </div>
              </div>
              
              {post.image_url && (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              )}
            </header>
            
            {/* Contenido */}
            <div className="mb-8">
              {/* Renderizar el contenido HTML del post de forma segura */}
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
            
            {/* Pie de artículo */}
            <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <Tag className="w-4 h-4 mt-1" />
                  {post.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Compartir en redes sociales */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Compartir
                </Button>
              </div>
            </footer>
            
            {/* Comentarios - Se implementarán en el futuro */}
            <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Comentarios</h2>
              <p className="text-gray-600 dark:text-gray-400">
                La sección de comentarios estará disponible próximamente.
              </p>
            </section>
          </article>
        ) : (
          <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No se encontró el post solicitado.
            </p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPostPage;
