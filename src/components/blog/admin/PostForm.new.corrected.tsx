import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory, BlogTag } from '../../../types/blog';
import { blogService } from '../../../services/blogService';
import { X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Editor } from '@tinymce/tinymce-react';
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
    image: null,
    socialMedia: {
      facebook: false,
      instagram: false
    }
  });
  
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [allTags, setAllTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<BlogTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  
  // Cargar categorías y etiquetas al montar el componente
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          blogService.getCategories(),
          blogService.getTags()
        ]);
        
        setCategories(categoriesData);
        setAllTags(tagsData);
      } catch (error) {
        console.error('Error al cargar categorías y etiquetas:', error);
      }
    };
    
    fetchCategoriesAndTags();
  }, []);
  
  // Cargar datos del post si se está editando
  useEffect(() => {
    if (post) {
      // Configurar formData con los datos del post
      setFormData({
        ...post,
        // Asegurarse de que socialMedia tiene el formato adecuado
        socialMedia: post.socialMedia || { facebook: false, instagram: false }
      });
      
      // Establecer etiquetas seleccionadas si existen
      if (post.tags && post.tags.length > 0) {
        setSelectedTags(post.tags);
      }
      
      // Establecer vista previa de imagen si existe
      if (post.image) {
        setImagePreview(
          post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`
        );
      }
    }
  }, [post]);
  
  // Generar slug a partir del título
  const generateSlug = () => {
    const slug = formData.title
      ?.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    setFormData(prev => ({ ...prev, slug }));
  };
  
  // Manejador de cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Limpiar error de validación al cambiar un campo
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Actualizar formData
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejador para cambios en checkboxes de redes sociales
  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // Si intenta activar Instagram, verificar que haya una imagen
    if (name === 'instagram' && checked && !formData.image && !imagePreview) {
      setValidationErrors(prev => ({
        ...prev,
        image: 'Se requiere una imagen para publicar en Instagram'
      }));
      
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [name]: checked
      }
    }));
    
    // Limpiar error de validación si es necesario
    if (name === 'instagram' && validationErrors.image) {
      setValidationErrors(prev => ({ ...prev, image: '' }));
    }
  };
  
  // Manejador para seleccionar una categoría
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value ? parseInt(e.target.value) : undefined;
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      category: selectedCategory?.name || ''
    }));
  };
  
  // Manejador para agregar una nueva etiqueta
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    // Verificar si la etiqueta ya existe en allTags
    const existingTag = allTags.find(tag => 
      tag.name.toLowerCase() === newTagName.trim().toLowerCase()
    );
    
    if (existingTag) {
      // Verificar que no esté ya seleccionada
      if (!selectedTags.some(tag => tag.id === existingTag.id)) {
        setSelectedTags(prev => [...prev, existingTag]);
        
        // Actualizar formData con las etiquetas
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags || [], existingTag]
        }));
      }
    } else {
      // Crear una nueva etiqueta temporal con ID negativo (se creará en el backend)
      const newTag: BlogTag = {
        id: -selectedTags.length - 1, // ID temporal negativo para nuevas etiquetas
        name: newTagName.trim(),
        slug: newTagName.trim().toLowerCase().replace(/\s+/g, '-')
      };
      
      setSelectedTags(prev => [...prev, newTag]);
      
      // Actualizar formData con las etiquetas
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags || [], newTag]
      }));
    }
    
    // Limpiar el campo de nueva etiqueta
    setNewTagName('');
  };
  
  // Manejador para eliminar una etiqueta seleccionada
  const handleRemoveTag = (tagId: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
    
    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag.id !== tagId) || []
    }));
  };
  
  // Manejador para seleccionar una etiqueta existente
  const handleSelectExistingTag = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tagId = parseInt(e.target.value);
    
    if (tagId && !selectedTags.some(tag => tag.id === tagId)) {
      const selectedTag = allTags.find(tag => tag.id === tagId);
      
      if (selectedTag) {
        setSelectedTags(prev => [...prev, selectedTag]);
        
        // Actualizar formData
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags || [], selectedTag]
        }));
      }
    }
    
    // Resetear el selector
    e.target.value = '';
  };
  
  // Manejador para cargar imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Crear URL para la vista previa
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
      
      // Actualizar formData
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        // Limpiar el campo image ya que ahora tenemos un archivo nuevo
        image: null
      }));
      
      // Limpiar error de validación si existe
      if (validationErrors.image) {
        setValidationErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };
  
  // Manejador para eliminar imagen
  const handleRemoveImage = () => {
    setImagePreview(null);
    
    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      imageFile: undefined,
      image: null
    }));
    
    // Si Instagram estaba seleccionado, desactivarlo
    if (formData.socialMedia?.instagram) {
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          instagram: false
        }
      }));
    }
  };
  
  // Validar formulario
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.title) {
      errors.title = 'El título es obligatorio';
    }
    
    if (!formData.slug) {
      errors.slug = 'El slug es obligatorio';
    }
    
    if (!formData.content) {
      errors.content = 'El contenido es obligatorio';
    }
    
    if (!formData.excerpt) {
      errors.excerpt = 'El extracto es obligatorio';
    }
    
    if (!formData.category_id) {
      errors.category = 'La categoría es obligatoria';
    }
    
    if (formData.socialMedia?.instagram && !formData.imageFile && !formData.image) {
      errors.image = 'Se requiere una imagen para publicar en Instagram';
    }
    
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  // Manejador para enviar el formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar el post:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {post ? 'Editar' : 'Crear'} Publicación
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Título de la publicación"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                required
              />
              {validationErrors.title && (
                <p className="text-red-500 text-xs">{validationErrors.title}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="private">Privado</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagen de portada</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 cursor-pointer rounded-md text-sm"
              >
                Seleccionar imagen
              </label>
              
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="h-20 w-auto object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    aria-label="Eliminar imagen"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            {validationErrors.image && (
              <p className="text-red-500 text-xs">{validationErrors.image}</p>
            )}
          </div>
          
          {/* Social Media Section */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Compartir en redes sociales
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="facebook"
                  name="facebook"
                  checked={formData.socialMedia?.facebook || false}
                  onChange={handleSocialMediaChange}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="facebook" className="text-sm text-gray-700 dark:text-gray-300">
                  Facebook
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="instagram"
                  name="instagram"
                  checked={formData.socialMedia?.instagram || false}
                  onChange={handleSocialMediaChange}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="instagram" className="text-sm text-gray-700 dark:text-gray-300">
                  Instagram
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Instagram requiere que la publicación tenga una imagen para ser compartida.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <select
                id="category"
                name="category"
                value={formData.category_id?.toString() || ''}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="text-red-500 text-xs">{validationErrors.category}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etiquetas</label>
              <div className="flex space-x-2">
                <select
                  id="existingTags"
                  onChange={handleSelectExistingTag}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                >
                  <option value="">Selecciona etiquetas existentes</option>
                  {allTags
                    .filter(tag => !selectedTags.some(st => st.id === tag.id))
                    .map(tag => (
                      <option key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  id="newTagName"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Añadir nueva etiqueta"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button 
                  type="button" 
                  onClick={handleAddTag}
                  disabled={!newTagName.trim()}
                  variant="outline"
                >
                  Añadir
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map(tag => (
                  <div 
                    key={tag.id} 
                    className="bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md flex items-center text-sm"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-1 text-gray-400 hover:text-gray-500"
                      aria-label={`Eliminar etiqueta ${tag.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
              <div className="text-xs text-gray-500">(URL amigable)</div>
            </div>
            <div className="flex space-x-2">
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
            <Editor
              id="content"
              name="content"
              apiKey="9vtmhyavkrkapuuohaos0g7pftshx28vp4ij87fck0yw0gw2"
              value={formData.content}
              onEditorChange={(newText) => setFormData(prev => ({ ...prev, content: newText }))}
              init={{
                height: "calc(100vh - 280px)",
                resize: false,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount',
                  'emoticons'
                ],
                toolbar: [
                  'undo redo | formatselect | fontsizeselect | bold italic underline strikethrough | forecolor backcolor | removeformat',
                  'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
                  'link image media table | code fullscreen | emoticons | help'
                ],
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
                language: 'es',
                branding: false,
                relative_urls: false,
                remove_script_host: false,
                convert_urls: true,
                file_picker_types: 'image',
                image_advtab: true,
                automatic_uploads: true,
                promotion: false,
                referrer_policy: 'origin',
                send_uri_to_server: false,
                allow_unsafe_link_target: true,
                collect_metrics: false,
                images_upload_url: `${API_URL}/uploads/blog`,
                images_upload_handler: async (blobInfo, success, failure, progress) => {
                  const file = blobInfo.blob();
                  const formData = new FormData();
                  formData.append('blogImage', file);
                  
                  try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      throw new Error('Se requiere autenticación');
                    }
                    
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
                    const imageUrl = data.file.url.startsWith('http') 
                      ? data.file.url 
                      : `${API_URL}${data.file.url}`;
                    
                    success(imageUrl);
                  } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Error al cargar imagen';
                    failure(`Error al cargar imagen: ${errorMessage}`);
                    console.error('Error al cargar imagen:', err);
                  }
                }
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

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
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
