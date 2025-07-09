import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { BlogPost, BlogCategory, BlogTag } from '../../../types/blog';
import { blogService } from '../../../services/blogService';
import { showDangerConfirm, showError, showSuccess } from '../../../utils/alerts';
import { Link } from 'react-router-dom';
import { Blog } from '../../../utils/BlogIcon';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { PostForm } from '../../../components/blog/admin/PostForm';
import { CategoryForm } from '../../../components/blog/admin/CategoryForm';
import { TagForm } from '../../../components/blog/admin/TagForm';

const AdminBlogPage: React.FC = () => {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<string>('posts');
  
  // Estado para los posts
  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para categorías
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  
  // Estado para etiquetas
  const [loadingTags, setLoadingTags] = useState<boolean>(true);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);
  
  // Estado para formularios
  const [showPostForm, setShowPostForm] = useState<boolean>(false);
  const [showCategoryForm, setShowCategoryForm] = useState<boolean>(false);
  const [showTagForm, setShowTagForm] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BlogPost | BlogCategory | BlogTag | null>(null);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'tags') {
      fetchTags();
    }
  }, [activeTab]);
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Obtener todos los posts sin filtrar por estado
      const allPosts = await blogService.getAllPosts();
      
      // Logs detallados para depuración
      console.log('Posts obtenidos:', allPosts);
      allPosts.forEach((post, index) => {
        console.log(`Post #${index + 1} (${post.id}): titulo=${post.title}, status=${post.status}`);
      });
      
      // Establecer los posts en el estado
      setPosts(allPosts);
      setError(null);
    } catch (err: unknown) {
      console.error('Error al cargar posts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar los posts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const allCategories = await blogService.getAllCategories();
      setCategories(allCategories);
      setCategoriesError(null);
    } catch (err: unknown) {
      console.error('Error al cargar categorías:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setCategoriesError(`Error al cargar las categorías: ${errorMessage}`);
    } finally {
      setLoadingCategories(false);
    }
  };
  
  const fetchTags = async () => {
    setLoadingTags(true);
    try {
      const allTags = await blogService.getAllTags();
      setTags(allTags);
      setTagsError(null);
    } catch (err: unknown) {
      console.error('Error al cargar etiquetas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setTagsError(`Error al cargar las etiquetas: ${errorMessage}`);
    } finally {
      setLoadingTags(false);
    }
  };



  const handleDeletePost = async (id: number) => {
    const post = posts.find(p => p.id === id);
    const postTitle = post ? post.title : 'esta publicación';
    
    const confirmed = await showDangerConfirm(
      '¿Eliminar publicación?',
      `¿Estás seguro de que deseas eliminar "${postTitle}"? Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar'
    );
    
    if (confirmed) {
      try {
        await blogService.deletePost(id);
        await fetchPosts();
        showSuccess('¡Eliminado!', 'La publicación ha sido eliminada correctamente.');
      } catch (error: unknown) {
        console.error('Error al eliminar post:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        showError('Error al eliminar', `No se pudo eliminar la publicación: ${errorMessage}`);
      }
    }
  };
  
  const handleDeleteCategory = async (id: number) => {
    const category = categories.find(c => c.id === id);
    const categoryName = category ? category.name : 'esta categoría';
    
    const confirmed = await showDangerConfirm(
      '¿Eliminar categoría?',
      `¿Estás seguro de que deseas eliminar la categoría "${categoryName}"? Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar'
    );
    
    if (confirmed) {
      try {
        await blogService.deleteCategory(id);
        await fetchCategories();
        showSuccess('¡Eliminado!', 'La categoría ha sido eliminada correctamente.');
      } catch (error: unknown) {
        console.error('Error al eliminar categoría:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        showError('Error al eliminar', `No se pudo eliminar la categoría: ${errorMessage}`);
      }
    }
  };
  
  const handleDeleteTag = async (id: number) => {
    const tag = tags.find(t => t.id === id);
    const tagName = tag ? tag.name : 'esta etiqueta';
    
    const confirmed = await showDangerConfirm(
      '¿Eliminar etiqueta?',
      `¿Estás seguro de que deseas eliminar la etiqueta "${tagName}"? Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar'
    );
    
    if (confirmed) {
      try {
        await blogService.deleteTag(id);
        await fetchTags();
        showSuccess('¡Eliminado!', 'La etiqueta ha sido eliminada correctamente.');
      } catch (error: unknown) {
        console.error('Error al eliminar etiqueta:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        showError('Error al eliminar', `No se pudo eliminar la etiqueta: ${errorMessage}`);
      }
    }
  };
  
  const handleEditPost = async (post: BlogPost) => {
    try {
      // Obtener los datos completos del post incluyendo el contenido
      const fullPost = await blogService.getPostById(post.id);
      console.log('Post completo para editar:', fullPost);
      setEditingItem(fullPost);
      setShowPostForm(true);
    } catch (error) {
      console.error('Error al obtener datos completos del post:', error);
      // Si hay error, usamos los datos que ya tenemos
      setEditingItem(post);
      setShowPostForm(true);
    }
  };
  
  const handleEditCategory = (category: BlogCategory) => {
    setEditingItem(category);
    setShowCategoryForm(true);
  };
  
  const handleEditTag = (tag: BlogTag) => {
    setEditingItem(tag);
    setShowTagForm(true);
  };

  const handleCreatePost = async (postData: Partial<BlogPost>) => {
    try {
      // Asegurarnos de enviar category_id (el backend espera este campo)
      const dataToSend = {
        ...postData,
        // Asegurarnos de que category_id es un número
        category_id: postData.category_id ? Number(postData.category_id) : undefined
      };
      
      // Si hay tags, asegurémonos de que sean strings
      if (postData.tags && Array.isArray(postData.tags)) {
        dataToSend.tags = postData.tags.map(tag => String(tag));
      }
      
      await blogService.createPost(dataToSend);
      fetchPosts();
      setError(null);
      return Promise.resolve();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al crear publicación: ${errorMessage}`);
      return Promise.reject(error);
    }
  };

  const handleUpdatePost = async (postData: Partial<BlogPost>) => {
    try {
      if (editingItem && 'id' in editingItem) {
        console.log('Enviando actualización de post:', JSON.stringify(postData, null, 2));
        
        await blogService.updatePost(editingItem.id, postData);
        fetchPosts();
        setError(null);
        return Promise.resolve();
      }
      throw new Error('No se encontró la ID del post');
    } catch (error: unknown) {
      console.error('Error detallado al actualizar post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al actualizar publicación: ${errorMessage}`);
      return Promise.reject(error);
    }
  };

  const handleSubmitPost = async (postData: Partial<BlogPost>) => {
    if (editingItem && 'id' in editingItem) {
      return handleUpdatePost(postData);
    } else {
      return handleCreatePost(postData);
    }
  };
  
  const handleCreateCategory = async (categoryData: Partial<BlogCategory>) => {
    try {
      await blogService.createCategory(categoryData as { name: string, description?: string });
      fetchCategories();
      setCategoriesError(null);
      return Promise.resolve();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setCategoriesError(`Error al crear categoría: ${errorMessage}`);
      return Promise.reject(error);
    }
  };

  const handleUpdateCategory = async (categoryData: Partial<BlogCategory>) => {
    try {
      if (editingItem && 'id' in editingItem) {
        await blogService.updateCategory(
          editingItem.id, 
          categoryData as { name: string, description?: string }
        );
        fetchCategories();
        setCategoriesError(null);
        return Promise.resolve();
      }
      throw new Error('No se encontró la ID de la categoría');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setCategoriesError(`Error al actualizar categoría: ${errorMessage}`);
      return Promise.reject(error);
    }
  };

  const handleSubmitCategory = async (categoryData: Partial<BlogCategory>) => {
    if (editingItem && 'id' in editingItem) {
      return handleUpdateCategory(categoryData);
    } else {
      return handleCreateCategory(categoryData);
    }
  };

  const handleCreateTag = async (tagData: Partial<BlogTag>) => {
    try {
      await blogService.createTag(tagData as { name: string });
      fetchTags();
      setTagsError(null);
      return Promise.resolve();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setTagsError(`Error al crear etiqueta: ${errorMessage}`);
      return Promise.reject(error);
    }
  };

  const handleUpdateTag = async (tagData: Partial<BlogTag>) => {
    try {
      if (editingItem && 'id' in editingItem) {
        await blogService.updateTag(
          editingItem.id, 
          tagData as { name: string }
        );
        fetchTags();
        setTagsError(null);
        return Promise.resolve();
      }
      throw new Error('No se encontró la ID de la etiqueta');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setTagsError(`Error al actualizar etiqueta: ${errorMessage}`);
      return Promise.reject(error);
    }
  };

  const handleSubmitTag = async (tagData: Partial<BlogTag>) => {
    if (editingItem && 'id' in editingItem) {
      return handleUpdateTag(tagData);
    } else {
      return handleCreateTag(tagData);
    }
  };

  return (
    <AdminLayout title="Administración de Blog">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Blog className="w-6 h-6 mr-2 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión del Blog</h1>
          </div>
          <div>
            <Link to="/blog" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
              Ver Blog
            </Link>
          </div>
        </div>

        <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex border-b border-gray-200 dark:border-dark-700">
            <TabsTrigger 
              value="posts"
              className={`px-4 py-2 ${activeTab === 'posts' 
                ? 'text-primary-600 border-b-2 border-primary-600 font-medium' 
                : 'text-gray-600 dark:text-gray-400'}`}
            >
              Publicaciones
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className={`px-4 py-2 ${activeTab === 'categories' 
                ? 'text-primary-600 border-b-2 border-primary-600 font-medium' 
                : 'text-gray-600 dark:text-gray-400'}`}
            >
              Categorías
            </TabsTrigger>
            <TabsTrigger 
              value="tags"
              className={`px-4 py-2 ${activeTab === 'tags' 
                ? 'text-primary-600 border-b-2 border-primary-600 font-medium' 
                : 'text-gray-600 dark:text-gray-400'}`}
            >
              Etiquetas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Gestión de Publicaciones</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchPosts()} 
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" /> Actualizar
                </Button>
                <Button 
                  onClick={() => { setEditingItem(null); setShowPostForm(true); }}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Nueva Publicación
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Publicaciones ({posts.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                  {posts.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No hay publicaciones disponibles.
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(post.created_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                              {' - '}{post.category}{' - '}
                              <span className={`${
                                String(post.status).toLowerCase() === 'published' ? 'text-green-500' : 'text-yellow-500'
                              }`}>
                                {String(post.status).toLowerCase() === 'published' ? 'Publicado' : 'Borrador'}
                              </span>
                              <span className="ml-1 text-xs text-gray-400">({String(post.status)})</span>
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {post.excerpt}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Link to={`/blog/${post.slug}`} className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 transition">
                              Ver
                            </Link>
                            <button
                              onClick={() => handleEditPost(post)}
                              className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Gestión de Categorías</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchCategories()} 
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" /> Actualizar
                </Button>
                <Button 
                  onClick={() => { setEditingItem(null); setShowCategoryForm(true); }}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Nueva Categoría
                </Button>
              </div>
            </div>
            
            {loadingCategories ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : categoriesError ? (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {categoriesError}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Categorías ({categories.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                  {categories.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No hay categorías disponibles.
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div key={category.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Slug: {category.slug}
                            </p>
                            {category.description && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Posts: {category.posts_count || 0}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition flex items-center gap-1"
                              disabled={category.posts_count ? category.posts_count > 0 : false}
                              title={category.posts_count && category.posts_count > 0 ? "No se puede eliminar una categoría en uso" : ""}
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tags">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Gestión de Etiquetas</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchTags()} 
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" /> Actualizar
                </Button>
                <Button 
                  onClick={() => { setEditingItem(null); setShowTagForm(true); }}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Nueva Etiqueta
                </Button>
              </div>
            </div>
            
            {loadingTags ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : tagsError ? (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {tagsError}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Etiquetas ({tags.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-dark-700">
                  {tags.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No hay etiquetas disponibles.
                    </div>
                  ) : (
                    tags.map((tag) => (
                      <div key={tag.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">
                              {tag.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Slug: {tag.slug}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Posts: {tag.posts_count || 0}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTag(tag)}
                              className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition flex items-center gap-1"
                              disabled={tag.posts_count ? tag.posts_count > 0 : false}
                              title={tag.posts_count && tag.posts_count > 0 ? "No se puede eliminar una etiqueta en uso" : ""}
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Formularios modales para la gestión del blog */}
      <PostForm 
        isOpen={showPostForm} 
        onClose={() => setShowPostForm(false)}
        onSubmit={handleSubmitPost}
        post={editingItem as BlogPost | null}
      />
      
      <CategoryForm
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={handleSubmitCategory}
        category={editingItem as BlogCategory | null}
      />
      
      <TagForm
        isOpen={showTagForm}
        onClose={() => setShowTagForm(false)}
        onSubmit={handleSubmitTag}
        tag={editingItem as BlogTag | null}
      />
    </AdminLayout>
  );
};

export default AdminBlogPage;
