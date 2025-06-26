import { Document, DocumentFilters } from '../types';
import { normalizeNumericValues } from './api';

// Asegurarnos de que la URL base sea consistente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';
// Eliminar /api duplicado si existe
//const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}`;

export const documentService = {
  /**
   * Obtiene todos los documentos con posibles filtros
   * @param filters Filtros opcionales para los documentos
   * @returns Lista de documentos que coinciden con los filtros
   */
  getAllDocuments: async (filters?: DocumentFilters): Promise<Document[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder a los documentos');
      }
      
      // Construir URL correcta
      let url = `${API_URL}/documents`;
      
      // Agregar filtros como parámetros de consulta si existen
      if (filters) {
        const params = new URLSearchParams();
        if (filters.title) params.append('title', filters.title);
        if (filters.category) params.append('category', filters.category);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener documentos: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.documents || []);
    } catch (error: any) {
      console.error('Error en getAllDocuments:', error);
      throw new Error(error.message || 'Error al obtener documentos');
    }
  },
  
  /**
   * Obtiene un documento por su ID
   * @param id ID del documento a obtener
   * @returns Detalles del documento
   */
  getDocumentById: async (id: number): Promise<Document> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para acceder al documento');
      }
      
      const response = await fetch(`${API_URL}/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener el documento: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.document);
    } catch (error: any) {
      console.error('Error en getDocumentById:', error);
      throw new Error(error.message || 'Error al obtener el documento');
    }
  },
  
  /**
   * Sube un nuevo documento
   * @param documentData Datos del documento y archivo
   * @returns El documento creado
   */
  uploadDocument: async (
    file: File,
    title: string,
    description: string,
    category: string
  ): Promise<Document> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para subir documentos');
      }
      
      // Verificar tamaño máximo (20MB)
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. El tamaño máximo permitido es 20MB');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      
      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error al subir documento: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.document);
    } catch (error: any) {
      console.error('Error en uploadDocument:', error);
      throw new Error(error.message || 'Error al subir el documento');
    }
  },
  
  /**
   * Actualiza un documento existente
   * @param id ID del documento a actualizar
   * @param documentData Datos del documento a actualizar
   * @returns El documento actualizado
   */
  updateDocument: async (
    id: number,
    title: string,
    description: string,
    category: string
  ): Promise<Document> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para actualizar documentos');
      }
      
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, category })
      });
      
      if (!response.ok) {
        throw new Error(`Error al actualizar documento: ${response.status}`);
      }
      
      const data = await response.json();
      return normalizeNumericValues(data.document);
    } catch (error: any) {
      console.error('Error en updateDocument:', error);
      throw new Error(error.message || 'Error al actualizar el documento');
    }
  },
  
  /**
   * Elimina un documento
   * @param id ID del documento a eliminar
   * @returns Confirmación de eliminación
   */
  deleteDocument: async (id: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para eliminar documentos');
      }
      
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al eliminar documento: ${response.status}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error en deleteDocument:', error);
      throw new Error(error.message || 'Error al eliminar el documento');
    }
  },
  
  /**
   * Descarga un documento
   * @param id ID del documento a descargar
   * @returns Blob con los datos del documento
   */
  downloadDocument: async (id: number): Promise<Blob> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Se requiere autenticación para descargar documentos');
      }
      
      const response = await fetch(`${API_URL}/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al descargar documento: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error: any) {
      console.error('Error en downloadDocument:', error);
      throw new Error(error.message || 'Error al descargar el documento');
    }
  },

  /**
   * Obtiene una URL temporal para previsualizar un documento
   * @param id ID del documento a previsualizar
   * @returns URL del objeto Blob para previsualización
   */
  getPreviewUrl: async (id: number): Promise<string> => {
    try {
      const blob = await documentService.downloadDocument(id);
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error('Error al obtener URL de previsualización:', error);
      throw new Error(error.message || 'Error al obtener la previsualización del documento');
    }
  },
  
  /**
   * Obtiene la URL directa para previsualizar un documento en el navegador
   * @param id ID del documento a previsualizar
   * @returns URL para previsualizar el documento con el token de autenticación incluido
   */
  getDirectPreviewUrl: (id: number): string => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Se requiere autenticación para previsualizar documentos');
    }
    
    try {
      // Validar que tenemos un token correcto
      if (token.split('.').length !== 3) {
        console.warn('El token JWT no parece tener el formato correcto');
      }
      
      // Incluir el token como parámetro para que funcione en iframes y objetos embebidos
      // Asegurarnos de usar la URL correcta y codificar el token adecuadamente
      const url = `${API_URL}/documents/${id}/preview?token=${encodeURIComponent(token)}`;
      
      console.log('URL generada para previsualización:', url);
      
      // Verificar si la URL es accesible (CORS puede evitar que esto funcione, es solo informativo)
      setTimeout(() => {
        fetch(url, { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
          .then(response => {
            if (!response.ok) {
              console.warn(`La URL de previsualización devolvió un estado ${response.status}`);
            } else {
              console.log('URL de previsualización verificada correctamente');
            }
          })
          .catch(err => console.warn('No se pudo verificar la URL de previsualización:', err.message));
      }, 500); // Retrasamos un poco la verificación para evitar sobrecarga
      
      return url;
    } catch (error) {
      console.error('Error al generar URL de previsualización:', error);
      throw error;
    }
  }
};
