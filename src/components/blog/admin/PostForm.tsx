import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory, BlogTag } from '../../../types/blog';
import { blogService } from '../../../services/blogService';
import { X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { BlogEditor } from './BlogEditor';
import { createModuleLogger } from '../../../utils/loggerExampleUsage';

const postFormLogger = createModuleLogger('POST_FORM');

// Importar TinyMCE desde la instalación local
import 'tinymce/tinymce';
import 'tinymce/models/dom/model';
// Importar solo los plugins que vamos a usar
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/help';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
// Importación de los estilos de TinyMCE
import 'tinymce/skins/ui/oxide/skin.css';
import 'tinymce/skins/ui/oxide/content.css';
import 'tinymce/skins/content/default/content.css';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';

/**
 * Extrae el nombre de archivo de una URL de imagen del blog
 * @param url URL completa de la imagen
 * @returns Nombre del archivo o null si no se puede extraer
 */
const getFilenameFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // Si es una URL completa, extraer el pathname
    let pathname = url;
    
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      pathname = urlObj.pathname;
    }
    
    // Buscar el patrón /uploads/blog/filename
    const match = pathname.match(/\/uploads\/blog\/(blog_[^/]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error al extraer nombre de archivo de URL:', error);
    return null;
  }
};

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: Partial<BlogPost>) => Promise<void>;
  post?: BlogPost | null;
}

export const PostForm: React.FC<PostFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  post = null,
}) => {
  // Manejador de cierre personalizado que limpia las imágenes no utilizadas
  const handleClose = async () => {
    // Limpiar imágenes subidas si se cancela la edición
    await cleanupUnusedImages();
    onClose();
  };
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    category: '',
    category_id: undefined,
    tags: [],
    image_url: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  
  // Estado para rastrear las imágenes subidas durante la edición
  const [uploadedImages, setUploadedImages] = useState<Set<string>>(new Set());

  // Cargar datos iniciales (categorías y etiquetas)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          blogService.getAllCategories(),
          blogService.getAllTags()
        ]);
        setCategories(categoriesRes);
        setTags(tagsRes);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos';
        setError(errorMessage);
      }
    };

    fetchData();
  }, []);

  // Cargar datos del post si estamos editando
  useEffect(() => {
    if (post && categories.length > 0 && tags.length > 0) {
      postFormLogger.debug('Cargando datos del post para edición', { 
        postId: post.id,
        post 
      });
      postFormLogger.debug('Contenido y estado del post', { 
        content: post.content ? `${post.content.substring(0, 100)}...` : 'Vacío',
        status: post.status,
        statusType: typeof post.status
      });
      
      // Asegurarse de que status siempre tiene un valor válido y es un string
      let status = 'draft';
      if (post.status) {
        // Normalizar el status: asegurar que sea string y lowercase
        status = String(post.status).toLowerCase();
        // Validar que sea uno de los dos valores permitidos
        if (status !== 'draft' && status !== 'published') {
          console.warn(`Status inválido: ${status}, usando 'draft' como valor por defecto`);
          status = 'draft';
        }
      }
      
      // Buscar el ID de categoría correspondiente
      let categoryId = post.category_id;
      if (!categoryId && post.category) {
        const matchedCategory = categories.find(c => c.name === post.category);
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }
      }
      
      // Procesar los tags para obtener los IDs como string
      const postTagIds: string[] = [];
      
      if (post.tags && Array.isArray(post.tags)) {
        postFormLogger.debug('Tags recibidos del post', { tags: post.tags });
        
        // Para cada tag, extraemos el ID como string
        for (const tag of post.tags) {
          if (typeof tag === 'number') {
            postTagIds.push(String(tag));
          } else if (typeof tag === 'object' && tag !== null && 'id' in tag) {
            // Si es un objeto con propiedad id, usamos su id
            const tagObject = tag as {id: number};
            postTagIds.push(String(tagObject.id));
          } else if (typeof tag === 'string') {
            // Si es un string, puede ser un ID o un nombre
            if (!isNaN(Number(tag))) {
              postTagIds.push(tag);
            } else {
              const matchedTag = tags.find(t => t.name === tag);
              if (matchedTag) {
                postTagIds.push(String(matchedTag.id));
              }
            }
          }
        }
      }
      
      postFormLogger.debug('Tags procesados como IDs string', { postTagIds });
      
      // Asegurar que el status sea del tipo correcto
      const typedStatus = (status === 'published' ? 'published' : 'draft') as 'draft' | 'published';
      
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        status: typedStatus,
        category: post.category || '',
        category_id: categoryId,
        tags: postTagIds,
        image_url: post.image_url || '',
      });
      
      // Mensajes de diagnóstico
      postFormLogger.debug('Datos del formulario establecidos', {
        contentPreview: post.content ? `${post.content.substring(0, 50)}...` : 'Vacío',
        status: typedStatus,
        formData: {
          title: post.title,
          category: post.category,
          category_id: categoryId,
          status: typedStatus,
          contentLength: post.content?.length || 0
        }
      });
      
      // Establecer los tags seleccionados
      setSelectedTags(postTagIds);
    } else if (!post) {
      // Reset al crear un nuevo post
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'draft',
        category: '',
        category_id: undefined,
        tags: [],
        image_url: '',
      });
      setSelectedTags([]);
    }
  }, [post, categories, tags]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSlug = () => {
    // Función para generar un slug a partir del título
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleTagChange = (tagId: string) => {
    // Alternar la selección de tags
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // Función para cargar imágenes
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación');
      }
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('blogImage', file);
      
      // No incluimos el encabezado 'Content-Type' para que el navegador lo establezca automáticamente
      // con el límite (boundary) correcto para el FormData
      const response = await fetch(`${API_URL}/uploads/blog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error al subir imagen: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Actualizar el formulario con la URL de la imagen subida
      // La URL ya viene con el path completo desde el servidor
      const imageUrl = data.file.url.startsWith('http') 
        ? data.file.url 
        : `${API_URL}${data.file.url}`;
      
      // Añadir la imagen principal al conjunto de imágenes subidas
      setUploadedImages(prev => {
        const newSet = new Set(prev);
        newSet.add(imageUrl);
        return newSet;
      });
      
      setFormData(prev => ({
        ...prev,
        image_url: imageUrl
      }));
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar imagen';
      setError(`Error al cargar imagen: ${errorMessage}`);
      console.error('Error al cargar imagen:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Manejamos el envío del formulario
  // Función para detectar imágenes que se subieron pero ya no se utilizan
  const cleanupUnusedImages = async () => {
    if (uploadedImages.size === 0) return;
    
    try {
      // Extraer todas las imágenes del contenido actual
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      const usedImages = new Set<string>();
      
      while ((match = imgRegex.exec(formData.content || '')) !== null) {
        usedImages.add(match[1]);
      }
      
      // Si hay una imagen principal, considerarla como usada
      if (formData.image_url) {
        usedImages.add(formData.image_url);
      }
      
      // Identificar imágenes subidas que ya no se usan
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const unusedImages: string[] = [];
      uploadedImages.forEach(imageUrl => {
        if (!usedImages.has(imageUrl)) {
          unusedImages.push(imageUrl);
        }
      });
      
      // Eliminar imágenes no utilizadas
      for (const imageUrl of unusedImages) {
        const filename = getFilenameFromUrl(imageUrl);
        if (filename) {
          try {
            postFormLogger.debug('Eliminando imagen no utilizada', { filename });
            await fetch(`${API_URL}/uploads/blog/${filename}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (err) {
            console.error(`Error al eliminar imagen no utilizada ${filename}:`, err);
          }
        }
      }
    } catch (error) {
      console.error('Error al limpiar imágenes no utilizadas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar que todos los datos requeridos estén presentes
    if (!formData.title || !formData.content || !formData.category_id) {
      setError("Por favor, completa todos los campos obligatorios (título, contenido, categoría)");
      setLoading(false);
      return;
    }

    // Convertir los tags seleccionados a números para el backend
    const numericTags = selectedTags.map(tag => Number(tag)).filter(id => !isNaN(id));
    postFormLogger.debug('Tags preparados para envío', {
      selectedTags,
      numericTags
    });

    // Preparar datos para enviar al backend
    const dataToSubmit: Partial<BlogPost> = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      excerpt: formData.excerpt,
      image_url: formData.image_url || '',
      category: formData.category,
      category_id: formData.category_id ? Number(formData.category_id) : undefined,
      status: formData.status as 'draft' | 'published',
      tags: numericTags
    };
    
    // La validación de requisitos para Instagram ha sido eliminada
    
    postFormLogger.debug('Enviando datos del formulario', { dataToSubmit });

    try {
      await onSubmit(dataToSubmit);
      
      // Limpiar imágenes no utilizadas después de guardar
      await cleanupUnusedImages();
      
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar post';
      console.error('Error al enviar formulario:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Cabecera fija */}
        <div className="py-4 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {post ? 'Editar Publicación' : 'Nueva Publicación'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 pb-24 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={() => !formData.slug && generateSlug()}
              placeholder="Título de la publicación"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
            <div className="flex gap-2">
              <input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="slug-de-la-publicacion"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                required
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateSlug}
                className="whitespace-nowrap"
              >
                Generar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenido</label>
              <div className="text-xs text-gray-500">Editor WYSIWYG: puedes insertar texto enriquecido, imágenes, enlaces y más</div>
            </div>
            <div className="editor-container overflow-hidden">
              <BlogEditor 
                value={formData.content || ''} 
                onChange={(content) => setFormData(prev => ({ ...prev, content }))} 
                onImageUpload={(imageUrl) => {
                  // Añadir la imagen al conjunto de imágenes subidas
                  setUploadedImages(prev => {
                    const newSet = new Set(prev);
                    newSet.add(imageUrl);
                    return newSet;
                  });
                }}
              />
            <p className="text-xs text-gray-500 mt-1">
              Puedes arrastrar y soltar imágenes directamente en el editor o usar el botón de imagen para subirlas.
              También puedes dar formato al texto, crear listas, tablas y mucho más.
            </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-sm font-medium text-gray-700 dark:text-gray-300">Extracto</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Resumen breve de la publicación"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-sm font-medium text-gray-700 dark:text-gray-300">Imagen del post (opcional)</label>
            <div className="flex flex-col gap-4">
              {/* Opción 1: URL de imagen */}
              <div>
                <label htmlFor="image_url" className="text-sm font-normal text-sm font-medium text-gray-700 dark:text-gray-300">URL de Imagen</label>
                <input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url || ''}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                />
              </div>
              
              {/* Opción 2: Carga de archivo */}
              <div>
                <label htmlFor="image_file" className="text-sm font-normal text-sm font-medium text-gray-700 dark:text-gray-300">O sube un archivo</label>
                <div className="flex gap-2">
                  <input
                    id="image_file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                  />
                  {uploadingImage && <span className="text-blue-500">Subiendo...</span>}
                </div>
              </div>
              
              {/* Previsualización de imagen */}
              {formData.image_url && (
                <div className="relative">
                  <img 
                    src={formData.image_url} 
                    alt="Previsualización" 
                    className="max-h-40 object-contain border border-gray-300 dark:border-gray-700 rounded-md" 
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id || ''}
              onChange={(e) => {
                const categoryId = e.target.value ? parseInt(e.target.value) : undefined;
                const selectedCategory = categoryId ? categories.find(c => c.id === categoryId) : null;
                setFormData(prev => ({
                  ...prev,
                  category_id: categoryId,
                  category: selectedCategory ? selectedCategory.name : ''
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etiquetas</label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-gray-700 rounded-md">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">No hay etiquetas disponibles</p>
              ) : (
                tags.map(tag => (
                  <label key={tag.id} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id.toString())}
                      onChange={() => handleTagChange(tag.id.toString())}
                      className="w-4 h-4 mr-1"
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
            <select
              id="status"
              name="status"
              value={formData.status || 'draft'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
              required
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              En la base de datos solo existen los estados "draft" (Borrador) y "published" (Publicado).
            </p>
          </div>
          
          {/* Opciones de redes sociales - solo visible si el estado es "published" */}
          {/* La sección de opciones de redes sociales ha sido eliminada */}

          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 py-4 px-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 shadow-md">
            <Button type="button" variant="outline" onClick={handleClose} size="lg">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? 'Guardando...' : post ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
