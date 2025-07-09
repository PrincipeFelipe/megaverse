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
      formData.append('avatar', file);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';
      
      const response = await fetch(`${API_URL}/uploads/avatar`, {
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
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';
      
      const response = await fetch(`${API_URL}/uploads/avatar`, {
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
