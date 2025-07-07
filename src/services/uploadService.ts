// Servicios para subida y gestión de avatares
export const uploadService = {
  /**
   * Sube una imagen de avatar al servidor
   * @param file Archivo de imagen a subir como avatar
   * @returns Datos actualizados del usuario con la nueva URL del avatar
   */
  uploadAvatar: async (file: File) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para subir un avatar');
      }
      
      // Verificar que el archivo sea una imagen válida
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG, GIF y WebP');
      }
      
      // Verificar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. El tamaño máximo permitido es 5MB');
      }
      
      const formData = new FormData();
      formData.append('avatar', file, file.name);
      
      // URL base para todas las peticiones API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';
      
      // URL completa para la subida de avatares (debe coincidir con la ruta del servidor)
      // Si VITE_API_URL ya incluye "/api", no debemos añadirlo nuevamente
      const apiBase = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      // Eliminar cualquier posible barra doble que pueda surgir
      const uploadUrl = `${apiBase}/uploads/avatar`.replace(/([^:])\/\//g, "$1/");
      
      console.log(`Subiendo avatar: ${file.name} (${file.type}, ${file.size} bytes)`);
      console.log(`URL completa: ${uploadUrl}`);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        } catch {
          // Error al parsear la respuesta como JSON
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }
      
      const responseData = await response.json();
      return responseData.user;
    } catch (error) {
      console.error('Error al subir avatar:', error instanceof Error ? error.message : 'Error desconocido');
      throw error instanceof Error ? error : new Error('Error desconocido al subir el avatar');
    }
  },
  
  /**
   * Elimina el avatar actual del usuario
   * @returns Datos actualizados del usuario sin avatar
   */
  deleteAvatar: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para eliminar un avatar');
      }
      
      // URL base para todas las peticiones API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';
      
      // URL completa para eliminar el avatar (debe coincidir con la ruta del servidor)
      // Si VITE_API_URL ya incluye "/api", no debemos añadirlo nuevamente
      const apiBase = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      // Eliminar cualquier posible barra doble que pueda surgir
      const deleteUrl = `${apiBase}/uploads/avatar`.replace(/([^:])\/\//g, "$1/");
      
      console.log(`URL completa para eliminar avatar: ${deleteUrl}`);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        } catch {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }
      
      const responseData = await response.json();
      return responseData.user;
    } catch (error) {
      console.error('Error al eliminar avatar:', error instanceof Error ? error.message : 'Error desconocido');
      throw error instanceof Error ? error : new Error('Error desconocido al eliminar el avatar');
    }
  }
};
