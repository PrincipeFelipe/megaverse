import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory, BlogTag } from '../../../types/blog';
import { blogService } from '../../../services/blogService';
import { X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Editor } from '@tinymce/tinymce-react';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';

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
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    category: '',
    category_id: undefined,
    tags: [],
    image_url: '',
    socialMedia: []
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

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
      console.log('Cargando datos del post para edición:', post);
      console.log('Contenido del post:', post.content);
      console.log('Estado del post:', post.status, typeof post.status);
      
      // Asegurarse de que status siempre tiene un valor válido y es un string
      let status = 'draft';
      if (post.status) {
        // Normalizar el status: asegurar que sea string y lowercase
        status = String(post.status).toLowerCase();
        // Validar que sea uno de los dos valores permitidos
        if (status !== 'draft' && status !== 'published') {
          console.warn(\Status inválido: \, usando 'draft' como valor por defecto\);
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
        console.log('Tags recibidos del post:', post.tags);
        
        // Para cada tag, extraemos el ID como string
        for (const tag of post.tags) {
          if (typeof tag === 'number') {
            postTagIds.push(String(tag));
          } else if (typeof tag === 'object' && tag !== null && 'id' in tag) {
            // Si es un objeto con propiedad id, usamos su id
            postTagIds.push(String((tag as any).id));
          } else if (typeof tag === 'string') {
            // Si ya es un string, lo usamos directamente
            try {
              // Intentar convertir a número para verificar que es un ID válido
              const numericId = Number(tag);
              if (!isNaN(numericId)) {
                postTagIds.push(tag);
              } else {
                console.warn(\Tag ID no numérico descartado: \\);
              }
            } catch (e) {
              console.warn(\Error al procesar tag ID: \\, e);
            }
          }
        }
      }
      
      console.log('Tags procesados para el formulario:', postTagIds);
      
      // Actualizar el formulario con los datos del post
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        image_url: post.image_url || '',
        category: post.category,
        category_id: categoryId,
        status: status,
        socialMedia: post.socialMedia || []
      });
      
      // Actualizar también la lista de tags seleccionados
      setSelectedTags(postTagIds);
    }
  }, [post, categories, tags]);
  
  // Función para manejar cambios en campos de texto/selección
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Generar slug automáticamente si se modifica el título
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({ ...prev, slug }));
    }
  };
  
  // Función para manejar cambios en el editor de contenido
  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    
    // Si no hay un extracto, generar uno automáticamente
    if (!formData.excerpt) {
      const textContent = content.replace(/<[^>]*>/g, '');
      const excerpt = textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '');
      setFormData(prev => ({ ...prev, excerpt }));
    }
  };
  
  // Función para manejar la selección de tags
  const handleTagChange = (tagId: string) => {
    setSelectedTags(prevTags => {
      if (prevTags.includes(tagId)) {
        return prevTags.filter(id => id !== tagId);
      } else {
        return [...prevTags, tagId];
      }
    });
  };
  
  // Función para manejar la carga de imágenes
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    setError(null);
    
    try {
      // Verificar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen');
        setUploadingImage(false);
        return;
      }
      
      // Verificar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no puede superar los 2MB');
        setUploadingImage(false);
        return;
      }
      
      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('image', file);
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Se necesita autenticación para subir imágenes');
        setUploadingImage(false);
        return;
      }
      
      // Realizar la subida
      const response = await fetch(\\/uploads/blog/image\, {
        method: 'POST',
        headers: {
          'Authorization': \Bearer \\
        },
        body: formData
      });
      
      // Procesar la respuesta
      if (!response.ok) {
        throw new Error(\Error al subir la imagen: \\);
      }
      
      const data = await response.json();
      
      if (data && data.url) {
        // Actualizar el formulario con la URL de la imagen
        setFormData(prev => ({
          ...prev,
          image_url: data.url
        }));
        console.log('Imagen subida exitosamente:', data.url);
      } else {
        throw new Error('No se recibió la URL de la imagen');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir la imagen';
      setError(errorMessage);
      console.error('Error al subir imagen:', err);
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Función para enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar que todos los datos requeridos estén presentes
    if (!formData.title || !formData.content || !formData.category_id) {
      setError('Por favor, completa todos los campos obligatorios (título, contenido, categoría)');
      setLoading(false);
      return;
    }

    // Convertir los tags seleccionados a números para el backend
    const numericTags = selectedTags.map(tag => Number(tag)).filter(id => !isNaN(id));
    console.log('Tags seleccionados para enviar:', selectedTags);
    console.log('Tags convertidos a números para enviar:', numericTags);

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
      tags: numericTags,
      // Incluir opciones de redes sociales solo si el estado es 'published'
      socialMedia: formData.status === 'published' ? formData.socialMedia : []
    };
    
    // Validar requisitos para Instagram (necesita imagen)
    if (formData.status === 'published' && 
        formData.socialMedia?.includes('instagram') && 
        !formData.image_url) {
      setError('Instagram requiere una imagen para publicar. Por favor, sube o especifica una URL de imagen.');
      setLoading(false);
      return;
    }
    
    console.log('Enviando datos del formulario:', JSON.stringify(dataToSubmit, null, 2));

    try {
      await onSubmit(dataToSubmit);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el post';
      setError(errorMessage);
      console.error('Error al enviar el formulario:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  return (
    <div className='fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 overflow-hidden'>
      <div className='flex flex-col h-full max-h-screen'>
        {/* Cabecera fija */}
        <div className='bg-white dark:bg-gray-900 py-4 px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm'>
          <h2 className='text-xl font-bold'>
            {post ? 'Editar publicación' : 'Nueva publicación'}
          </h2>
          <Button onClick={onClose} variant='ghost' size='sm'>
            <X className='w-5 h-5' />
          </Button>
        </div>
        
        {/* Cuerpo con scroll */}
        <form onSubmit={handleSubmit} className='flex-1 p-6 pb-24 space-y-4 overflow-y-auto'>
          {error && (
            <div className='p-3 mb-4 text-red-800 bg-red-100 border border-red-200 rounded-md dark:text-red-400 dark:bg-gray-800 dark:border-red-700'>
              {error}
            </div>
          )}
          
          <div className='space-y-2'>
            <label htmlFor='title' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Título</label>
            <input
              id='title'
              name='title'
              type='text'
              value={formData.title}
              onChange={handleChange}
              placeholder='Título de la publicación'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800'
              required
            />
          </div>
          
          <div className='space-y-2'>
            <label htmlFor='slug' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>URL amigable (slug)</label>
            <input
              id='slug'
              name='slug'
              type='text'
              value={formData.slug}
              onChange={handleChange}
              placeholder='url-amigable-del-post'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Se genera automáticamente a partir del título. Solo usa letras minúsculas, números y guiones.
            </p>
          </div>
          
          <div className='space-y-2'>
            <label htmlFor='content' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Contenido</label>
            <div className='border border-gray-300 dark:border-gray-700 rounded-md'>
              <Editor
                id='content'
                value={formData.content}
                onEditorChange={handleEditorChange}
                apiKey='9vtmhyavkrkapuuohaos0g7pftshx28vp4ij87fck0yw0gw2'
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 
                    'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | image link media | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  branding: false,
                  promotion: false,
                  resize: true,
                  skin: document.documentElement.classList.contains('dark') ? 'oxide-dark' : 'oxide',
                  content_css: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                  // Desactivar telemetría y seguimiento
                  send_uri_to_server: false,
                  allow_unsafe_link_target: true,
                  collect_metrics: false,
                }}
              />
            </div>
          </div>
          
          <div className='space-y-2'>
            <label htmlFor='excerpt' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Extracto (opcional)</label>
            <textarea
              id='excerpt'
              name='excerpt'
              rows={3}
              value={formData.excerpt || ''}
              onChange={handleChange}
              placeholder='Breve descripción de la publicación (se mostrará en las vistas previas)'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800'
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='image_url' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Imagen del post (opcional)</label>
            <div className='flex flex-col gap-4'>
              {/* Opción 1: URL de imagen */}
              <div>
                <label htmlFor='image_url' className='text-sm font-normal text-gray-700 dark:text-gray-300'>URL de Imagen</label>
                <input
                  id='image_url'
                  name='image_url'
                  value={formData.image_url || ''}
                  onChange={handleChange}
                  placeholder='https://ejemplo.com/imagen.jpg'
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800'
                />
              </div>
              
              {/* Opción 2: Carga de archivo */}
              <div>
                <label htmlFor='image_file' className='text-sm font-normal text-gray-700 dark:text-gray-300'>O sube un archivo</label>
                <div className='flex gap-2'>
                  <input
                    id='image_file'
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800'
                  />
                  {uploadingImage && <span className='text-blue-500'>Subiendo...</span>}
                </div>
              </div>
              
              {/* Previsualización de imagen */}
              {formData.image_url && (
                <div className='relative'>
                  <img 
                    src={formData.image_url} 
                    alt='Previsualización' 
                    className='max-h-40 object-contain border border-gray-300 dark:border-gray-700 rounded-md' 
                  />
                  <Button 
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className='absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600'
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='category_id' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Categoría</label>
            <select
              id='category_id'
              name='category_id'
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
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800'
              required
            >
              <option value=''>Seleccionar categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Etiquetas</label>
            <div className='flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-gray-700 rounded-md'>
              {tags.length === 0 ? (
                <p className='text-sm text-gray-500'>No hay etiquetas disponibles</p>
              ) : (
                tags.map(tag => (
                  <label key={tag.id} className='inline-flex items-center'>
                    <input
                      type='checkbox'
                      checked={selectedTags.includes(tag.id.toString())}
                      onChange={() => handleTagChange(tag.id.toString())}
                      className='w-4 h-4 mr-1'
                    />
                    <span className='text-sm'>{tag.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='status' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Estado</label>
            <select
              id='status'
              name='status'
              value={formData.status || 'draft'}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800'
              required
            >
              <option value='draft'>Borrador</option>
              <option value='published'>Publicado</option>
            </select>
            <p className='text-xs text-gray-500 mt-1'>
              En la base de datos solo existen los estados 'draft' (Borrador) y 'published' (Publicado).
            </p>
          </div>
          
          {/* Opciones de redes sociales - solo visible si el estado es 'published' */}
          {formData.status === 'published' && (
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Compartir en redes sociales
              </label>
              <div className='flex flex-wrap gap-3 p-3 border border-gray-300 dark:border-gray-700 rounded-md'>
                <label className='inline-flex items-center'>
                  <input
                    type='checkbox'
                    checked={(formData.socialMedia || []).includes('facebook')}
                    onChange={() => {
                      const current = formData.socialMedia || [];
                      const updated = current.includes('facebook')
                        ? current.filter(platform => platform !== 'facebook')
                        : [...current, 'facebook'];
                      setFormData(prev => ({ ...prev, socialMedia: updated }));
                    }}
                    className='w-4 h-4 mr-2'
                  />
                  <span className='text-sm'>Facebook</span>
                </label>
                
                <label className='inline-flex items-center'>
                  <input
                    type='checkbox'
                    checked={(formData.socialMedia || []).includes('instagram')}
                    onChange={() => {
                      const current = formData.socialMedia || [];
                      const updated = current.includes('instagram')
                        ? current.filter(platform => platform !== 'instagram')
                        : [...current, 'instagram'];
                      setFormData(prev => ({ ...prev, socialMedia: updated }));
                    }}
                    className='w-4 h-4 mr-2'
                  />
                  <span className='text-sm'>Instagram</span>
                  {!formData.image_url && (
                    <span className='text-xs text-amber-500 ml-2'>
                      (Requiere imagen)
                    </span>
                  )}
                </label>
                

              </div>
              <p className='text-xs text-gray-500 mt-1'>
                La publicación en redes sociales (Facebook e Instagram) solo se realizará al publicar el post.
              </p>
            </div>
          )}

          <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 py-4 px-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 shadow-md'>
            <Button type='button' variant='outline' onClick={onClose} size='lg'>
              Cancelar
            </Button>
            <Button type='submit' disabled={loading} size='lg'>
              {loading ? 'Guardando...' : post ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
