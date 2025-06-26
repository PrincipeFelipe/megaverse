import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { AdminTable } from '../../components/admin/AdminTable';
import { Document, DocumentCategory } from '../../types';
import { DOCUMENT_CATEGORIES } from '../../types/documents';
import { documentService } from '../../services/api';
import { showSuccess, showError, showLoading, closeLoading, showConfirm } from '../../utils/alerts';
import { FileText, Trash2, Download, Search, Filter as FiltersIcon, X as CloseIcon, Upload, Eye } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const DocumentsPage: React.FC = () => {
  // Estados para documentos
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    title: '',
    category: '',
    startDate: '',
    endDate: ''
  });
  
  // Estados para el modal de subir/editar documento
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    file: null as File | null
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    category: '',
    file: ''
  });
  
  // Estados para el modal de previsualización
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<boolean>(false); // Nuevo estado para controlar el fallback del iframe
  
  // Referencia al input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cargar documentos al iniciar
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Función para obtener documentos con filtros
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filterParams = {
        title: filters.title || undefined,
        category: filters.category ? filters.category as DocumentCategory : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };
      
      const data = await documentService.getAllDocuments(filterParams);
      setDocuments(data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      setError('Error al cargar los documentos. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para resetear filtros
  const resetFilters = () => {
    setFilters({
      title: '',
      category: '',
      startDate: '',
      endDate: ''
    });
    
    // Después de resetear los filtros, volvemos a cargar los documentos
    fetchDocuments();
  };
  
  // Función para aplicar filtros
  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };
  
  // Manejadores de cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores
    if (name in formErrors) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Manejador para cambios en archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
    
    // Limpiar error de archivo
    setFormErrors(prev => ({ ...prev, file: '' }));
  };
  
  // Función para validar el formulario
  const validateForm = (): boolean => {
    const errors = {
      title: '',
      category: '',
      file: ''
    };
    let isValid = true;
    
    if (!formData.title.trim()) {
      errors.title = 'El título es obligatorio';
      isValid = false;
    }
    
    if (!formData.category) {
      errors.category = 'La categoría es obligatoria';
      isValid = false;
    }
    
    if (!isEditMode && !formData.file) {
      errors.file = 'Debe seleccionar un archivo';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Función para abrir el modal en modo creación
  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedDocument(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      file: null
    });
    setIsModalOpen(true);
  };
  
  // Función para abrir el modal en modo edición
  const handleOpenEditModal = (document: Document) => {
    setIsEditMode(true);
    setSelectedDocument(document);
    setFormData({
      title: document.title,
      description: document.description || '',
      category: document.category,
      file: null // No es necesario cargar el archivo en modo edición
    });
    setIsModalOpen(true);
  };
  
  // Función para cerrar el modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Resetear el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    showLoading('Procesando...');
    
    try {
      if (isEditMode && selectedDocument) {
        // Actualizar documento existente
        await documentService.updateDocument(
          selectedDocument.id,
          formData.title,
          formData.description,
          formData.category
        );
        
        showSuccess('Documento actualizado correctamente');
      } else {
        // Crear nuevo documento
        if (formData.file) {
          await documentService.uploadDocument(
            formData.file,
            formData.title,
            formData.description,
            formData.category
          );
          
          showSuccess('Documento subido correctamente');
        }
      }
      
      // Cerrar modal y recargar datos
      handleCloseModal();
      fetchDocuments();
    } catch (error) {
      console.error('Error al procesar el documento:', error);
      showError('Error al procesar el documento. Por favor, inténtelo de nuevo.');
    } finally {
      closeLoading();
    }
  };
  
  // Función para eliminar un documento
  const handleDeleteDocument = async (id: number) => {
    try {
      const confirmed = await showConfirm(
        '¿Está seguro de eliminar este documento?',
        'Esta acción no se puede deshacer',
        'Sí, eliminar',
        'Cancelar'
      );
      
      if (confirmed) {
        showLoading('Eliminando documento...');
        await documentService.deleteDocument(id);
        closeLoading();
        showSuccess('Documento eliminado correctamente');
        fetchDocuments();
      }
    } catch (error) {
      closeLoading();
      console.error('Error al eliminar documento:', error);
      showError('Error al eliminar el documento. Por favor, inténtelo de nuevo.');
    }
  };
  
  // Función para descargar un documento
  const handleDownloadDocument = async (document: Document) => {
    try {
      showLoading(`Descargando ${document.file_name}...`);
      const blob = await documentService.downloadDocument(document.id);
      closeLoading();
      
      // Crear un enlace temporal para la descarga
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      
      // Limpiar después de la descarga
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(link);
    } catch (error) {
      closeLoading();
      console.error('Error al descargar el documento:', error);
      showError('Error al descargar el documento. Por favor, inténtelo de nuevo.');
    }
  };
  
  // Función para previsualizar un documento
  const handlePreviewDocument = async (document: Document) => {
    setPreviewDocument(document);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);
    setIframeError(false); // Resetear el estado del iframe
    
    try {
      // Obtener la URL de previsualización con token. Asumimos que documentService.getDirectPreviewUrl
      // genera una URL accesible directamente para la previsualización (ej. /api/documents/{id}/preview)
      // Esta URL debe ser un endpoint en tu backend que sirva el archivo directamente.
      const directUrl = documentService.getDirectPreviewUrl(document.id);
      console.log('URL generada para iframe:', directUrl);
      
      // Probar primero si la URL es accesible (opcional pero recomendado para depuración)
      const testResponse = await fetch(directUrl, { 
        method: 'HEAD', // Usamos HEAD para solo verificar la existencia sin descargar el contenido completo
        headers: {
          'Cache-Control': 'no-cache' // Prevenir caché para asegurar una respuesta fresca
        }
      });
      
      if (!testResponse.ok) {
        throw new Error(`El servidor devolvió un error: ${testResponse.status} ${testResponse.statusText}`);
      }
      
      setPreviewUrl(directUrl);
    } catch (error) {
      console.error('Error al obtener URL de previsualización:', error);
      setPreviewError('Error al cargar la previsualización del documento. Puede intentar descargar el archivo o abrirlo en una nueva pestaña.');
    } finally {
      setPreviewLoading(false);
    }
  };
  
  // Definición de columnas para la tabla
  const columns = [
    { header: 'Título', accessor: 'title' },
    { 
      header: 'Categoría',
      accessor: (doc: Document) => {
        const category = DOCUMENT_CATEGORIES.find(cat => cat.value === doc.category);
        
        // Configuración de iconos por categoría
        const getCategoryIcon = () => {
          switch (doc.category) {
            case 'acta':
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
              );
            case 'legal':
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              );
            case 'normativa':
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              );
            case 'reglamento':
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2H2v10h10V2Z"></path>
                  <path d="M22 12h-8v10h10V12Z"></path>
                  <path d="M12 12H7a5 5 0 0 0-5 5v5h10V12Z"></path>
                </svg>
              );
            case 'estatuto':
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13 15v3"></path>
                  <path d="M11 15v3"></path>
                </svg>
              );
            default:
              return (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              );
          }
        };
        
        return (
          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium ${
            doc.category === 'legal' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-200 dark:border-red-800' :
            doc.category === 'acta' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800' :
            doc.category === 'normativa' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-200 dark:border-purple-800' :
            doc.category === 'reglamento' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border border-green-200 dark:border-green-800' :
            doc.category === 'estatuto' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800' :
            'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200 border border-gray-200 dark:border-gray-800'
          }`}>
            {getCategoryIcon()}
            {category?.label || doc.category}
          </span>
        );
      }
    },
    // Eliminada la columna de nombre de archivo, dejando solo el título
    { 
      header: 'Subido por', 
      accessor: (doc: Document) => doc.uploaded_by_name || `Usuario #${doc.uploaded_by}` 
    },
    { 
      header: 'Fecha', 
      accessor: (doc: Document) => (
        formatDate(doc.created_at)
      )
    }
  ];
  
  // Renderización de acciones para cada fila
  const renderActions = (document: Document) => (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        title="Previsualizar documento"
        onClick={() => handlePreviewDocument(document)}
      >
        <Eye className="w-4 h-4 text-blue-500" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Descargar documento"
        onClick={() => handleDownloadDocument(document)}
      >
        <Download className="w-4 h-4 text-green-500" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Editar documento"
        onClick={() => handleOpenEditModal(document)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-yellow-500">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
          <path d="m15 5 4 4"></path>
        </svg>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Eliminar documento"
        onClick={() => handleDeleteDocument(document.id)}
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <AdminLayout title="Documentación">
      <div className="space-y-6">
        {/* Panel de acciones y filtros */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleOpenCreateModal}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Subir documento
            </Button>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FiltersIcon className="w-4 h-4" />
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>
            
            {Object.values(filters).some(val => val !== '') && (
              <Button
                onClick={resetFilters}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CloseIcon className="w-4 h-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
        
        {/* Panel de filtros */}
        {showFilters && (
          <Card className="p-4 mb-6">
            <form onSubmit={applyFilters}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Input
                  label="Título"
                  name="title"
                  value={filters.title}
                  onChange={(e) => setFilters({...filters, title: e.target.value})}
                  placeholder="Buscar por título"
                />
                <Select
                  label="Categoría"
                  name="category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="">Todas las categorías</option>
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </Select>
                <Input
                  type="date"
                  label="Fecha desde"
                  name="startDate"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
                <Input
                  type="date"
                  label="Fecha hasta"
                  name="endDate"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Aplicar filtros
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        {/* Tabla de documentos */}
        <AdminTable
          columns={columns}
          data={documents}
          actions={renderActions}
          keyExtractor={(doc) => doc.id}
          loading={loading}
          error={error}
          emptyMessage="No hay documentos registrados"
        />
      </div>
      
      {/* Modal para subir/editar documento */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Editar documento" : "Subir documento"}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Título *"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              error={formErrors.title}
              required
            />
            
            <div className="form-group">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Descripción del documento"
              />
            </div>
            
            <Select
              label="Categoría *"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              error={formErrors.category}
              required
            >
              <option value="">Seleccionar categoría</option>
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </Select>
            
            {!isEditMode && (
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Archivo *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar archivo
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.file ? formData.file.name : 'Ningún archivo seleccionado'}
                  </span>
                </div>
                {formErrors.file && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">{formErrors.file}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tamaño máximo: 20MB
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {isEditMode ? 'Guardar cambios' : 'Subir documento'}
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Modal de previsualización */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewDocument(null);
          setPreviewUrl(null);
          setPreviewError(null);
          setIframeError(false); // Resetear el estado del iframe al cerrar el modal
        }}
        title={previewDocument?.title || 'Previsualización del documento'}
        size="full" // Ajustar el tamaño del modal para la previsualización
      >
        {previewDocument && (
          <div>
            {/* Área de previsualización - Eliminada información del archivo para maximizar el espacio */}
            <div className="min-h-[85vh]"> {/* Altura aumentada para el área de previsualización */}
              {previewLoading && (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              )}
              
              {previewError && (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{previewError}</p>
                  <Button
                    onClick={() => handleDownloadDocument(previewDocument)}
                    variant="primary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar documento
                  </Button>
                </div>
              )}
              
              {previewUrl && !previewLoading && !previewError && (
                <div className="w-full h-full">
                  {/* Previsualización para PDF */}
                  {previewDocument.file_type === 'application/pdf' && (
                    <div className="space-y-4">
                      {/* Intentamos con iframe primero para mejor control */}
                      {!iframeError ? (
                        <iframe
                          src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`} // Opciones para PDF en iframe
                          className="w-full h-[85vh] border border-gray-300 dark:border-gray-600 rounded"
                          title="Previsualización del PDF"
                          allow="fullscreen" // Permitir pantalla completa
                          loading="lazy" // Carga perezosa
                          onError={() => {
                            console.log('Error en iframe, cambiando a embed');
                            setIframeError(true); // Activar fallback a embed si hay un error en iframe
                          }}
                          onLoad={(e) => {
                            // Este onLoad se dispara cuando el iframe termina de cargar
                            // Sin embargo, por razones de seguridad, no siempre podemos acceder
                            // al contenido del iframe si el origen no es el mismo (CORS).
                            // Si el iframe falla en cargar el contenido (ej. por CORS o ruta incorrecta),
                            // puede que necesitemos una lógica más robusta para detectarlo,
                            // pero el onError ya nos da una buena pista.
                            const iframe = e.target as HTMLIFrameElement;
                            try {
                              // Intentar acceder a contentDocument puede lanzar un error de seguridad
                              // si el dominio del iframe es diferente y no tiene los headers adecuados.
                              if (iframe.contentDocument === null) {
                                console.log('Iframe bloqueado o fallido, usando alternativa');
                                setIframeError(true);
                              }
                            } catch (error) {
                              console.log('Error de acceso al iframe:', error);
                              setIframeError(true);
                            }
                          }}
                        />
                      ) : (
                        /* Alternativa: usar <embed> si iframe falla o está bloqueado */
                        <embed
                          src={previewUrl}
                          type="application/pdf"
                          className="w-full h-[85vh] border border-gray-300 dark:border-gray-600 rounded"
                          title="Previsualización del PDF (embed)"
                        />
                      )}
                      
                      {/* Se ha eliminado el mensaje de ayuda para maximizar el espacio */}
                    </div>
                  )}
                  {/* Previsualización para imágenes */}
                  {previewDocument.file_type.startsWith('image/') && (
                    <div className="flex justify-center">
                      <img
                        src={previewUrl}
                        alt={previewDocument.title}
                        className="max-w-full max-h-[85vh] object-contain" // Asegura que la imagen se ajuste y mantenga la proporción
                        onError={() => {
                          setPreviewError('Error al cargar la imagen'); // Manejar errores de carga de imagen
                        }}
                      />
                    </div>
                  )}
                  {/* Mensaje para tipos de archivo no previsualizables */}
                  {!previewDocument.file_type.startsWith('image/') && previewDocument.file_type !== 'application/pdf' && (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                      <div className="text-gray-400 mb-4">
                        <FileText className="w-16 h-16 mx-auto" />
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        La previsualización no está disponible para este tipo de archivo.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Se han eliminado todos los botones de acción para maximizar el espacio del documento */}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default DocumentsPage;
