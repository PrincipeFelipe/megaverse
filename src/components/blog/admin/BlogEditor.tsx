import { Editor } from '@tinymce/tinymce-react';
import { useRef, useEffect } from 'react';
import { createModuleLogger } from '../../../utils/loggerExampleUsage';

const blogEditorLogger = createModuleLogger('BLOG_EDITOR');

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

// La API Key la obtenemos desde las variables de entorno
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Extrae el nombre del archivo de una URL de imagen
 * @param {string} url - URL de la imagen
 * @returns {string|null} - Nombre del archivo o null si no se pudo extraer
 */
const getFilenameFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // Intentar extraer el nombre del archivo de la URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extraer el nombre del archivo del path
    const matches = pathname.match(/\/blog\/(blog_[^/]+)$/);
    if (matches && matches[1]) {
      return matches[1];
    }
    
    // Si no coincide con el patrón específico, intentar obtener el último segmento
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment.startsWith('blog_')) {
      return lastSegment;
    }
    
    return null;
  } catch (error) {
    console.error('Error al extraer nombre de archivo de URL:', error);
    return null;
  }
};

/**
 * Envía petición para eliminar una imagen del servidor
 * @param {string} url - URL de la imagen a eliminar
 */
const deleteImageFromServer = async (url: string): Promise<void> => {
  try {
    const filename = getFilenameFromUrl(url);
    
    if (!filename) {
      console.warn('No se pudo extraer el nombre de archivo de la URL:', url);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      blogEditorLogger.error('Se requiere autenticación para eliminar imágenes');
      return;
    }
    
    blogEditorLogger.debug('Eliminando imagen del servidor', { filename });
    
    const response = await fetch(`${API_URL}/uploads/blog/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      blogEditorLogger.debug('Imagen eliminada con éxito', { filename });
    } else {
      blogEditorLogger.error('Error al eliminar imagen', { filename, status: response.status });
    }
  } catch (error) {
    blogEditorLogger.error('Error al eliminar imagen del servidor', { error });
  }
};

/**
 * Editor TinyMCE simplificado para evitar errores y telemetría
 */
export function BlogEditor({ 
  value, 
  onChange, 
  onImageUpload 
}: { 
  value: string, 
  onChange: (content: string) => void, 
  onImageUpload?: (imageUrl: string) => void 
}) {
  // Referencia al editor para rastrear cambios
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // Registro de imágenes para detectar eliminaciones (ya no lo usaremos para eliminar)
  const imagesRef = useRef<Set<string>>(new Set());
  
  // Función para escanear las imágenes actuales en el contenido
  const scanImagesInContent = (content: string): Set<string> => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const currentImages = new Set<string>();
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.includes('/uploads/blog/')) {
        currentImages.add(src);
      }
    }
    
    return currentImages;
  };
  
  // Función para detectar y eliminar imágenes eliminadas
  const detectRemovedImages = (newContent: string) => {
    // Si no hay imágenes registradas previamente, no hay nada que verificar
    if (imagesRef.current.size === 0) return;
    
    const currentImages = scanImagesInContent(newContent);
    
    // Detectar imágenes que ya no están en el contenido
    imagesRef.current.forEach(imgUrl => {
      if (!currentImages.has(imgUrl)) {
        blogEditorLogger.debug('Imagen eliminada del contenido', { imgUrl });
        deleteImageFromServer(imgUrl);
      }
    });
    
    // Actualizar la referencia con las imágenes actuales
    imagesRef.current = currentImages;
  };
  
  // Actualizar el registro de imágenes cuando cambia el contenido
  useEffect(() => {
    if (value) {
      const images = scanImagesInContent(value);
      imagesRef.current = images;
    }
  }, [value]);
  
  // Manejar cambios en el contenido
  const handleEditorChange = (content: string) => {
    // Detectar imágenes eliminadas
    detectRemovedImages(content);
    
    // Llamar al callback original
    onChange(content);
  };
  
  return (
    <Editor
      id="content"
      value={value}
      apiKey={TINYMCE_API_KEY}
      onEditorChange={handleEditorChange}
      onInit={(_, editor) => {
        editorRef.current = editor;
        // Escanear imágenes iniciales
        if (value) {
          imagesRef.current = scanImagesInContent(value);
          blogEditorLogger.debug('Imágenes iniciales escaneadas', { 
            images: [...imagesRef.current] 
          });
        }
      }}
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
        language_url: '/tinymce/langs/es.js',
        branding: false,
        relative_urls: false,
        remove_script_host: false,
        convert_urls: true,
        file_picker_types: 'image',
        image_advtab: true,
        automatic_uploads: true,
        // Configuración para desactivar telemetría y seguimiento
        promotion: false,
        referrer_policy: 'origin',
        send_uri_to_server: false,
        allow_unsafe_link_target: true,
        collect_metrics: false,
        // Configuración para suprimir el mensaje de licencia
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setup: function(editor: any) {
          // Agregar esta configuración para suprimir el mensaje de licencia
          editor.on('init', function() {
            try {
              const notifications = editor.notificationManager.getNotifications();
              if (notifications && notifications.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const notification: any = notifications[0];
                if (notification && notification.text && 
                    typeof notification.text === 'string' && 
                    notification.text.includes('TinyMCE is running in evaluation mode')) {
                  notification.close();
                }
              }
            } catch (error) {
              console.warn('No se pudo ocultar la notificación de licencia', error);
            }
          });
        },
        // Configuración para subir imágenes
        images_upload_url: `${API_URL}/uploads/blog`,
        // @ts-expect-error: El tipo UploadHandler es incompleto en las definiciones de TinyMCE
        images_upload_handler: function(
          blobInfo: { blob: () => Blob; name?: () => string; filename?: () => string }, 
          success: (url: string) => void, 
          failure: (error: string) => void
        ) {
          const file = blobInfo.blob();
          const formData = new FormData();
          const fileName = blobInfo.filename && typeof blobInfo.filename === 'function' ? blobInfo.filename() : 
                      blobInfo.name && typeof blobInfo.name === 'function' ? blobInfo.name() : 'image.png';
          formData.append('blogImage', file, fileName);
          
          const token = localStorage.getItem('token');
          if (!token) {
            failure('Se requiere autenticación');
            return;
          }
          
          return new Promise((resolve, reject) => {
            fetch(`${API_URL}/uploads/blog`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Error al subir imagen: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              const imageUrl = data.file.url.startsWith('http') 
                ? data.file.url 
                : `${API_URL}${data.file.url}`;
              
              // Notificar al componente padre sobre la imagen subida
              if (onImageUpload) {
                onImageUpload(imageUrl);
              }
              
              success(imageUrl);
              resolve(imageUrl);
            })
            .catch(err => {
              const errorMessage = err instanceof Error ? err.message : 'Error al cargar imagen';
              failure(`Error al cargar imagen: ${errorMessage}`);
              console.error('Error al cargar imagen:', err);
              reject(err);
            });
          });
        }
      }}
    />
  );
}
