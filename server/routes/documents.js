/**
 * Rutas para la gestión de documentos
 */
import express from 'express';
import { 
  getAllDocuments, 
  getDocumentById, 
  uploadDocument, 
  updateDocument, 
  deleteDocument, 
  downloadDocument,
  previewDocument
} from '../controllers/documents.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   GET /api/documents
 * @desc    Obtener todos los documentos (con filtros opcionales)
 * @access  Private
 */
router.get('/', getAllDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Obtener un documento específico por ID
 * @access  Private
 */
router.get('/:id', getDocumentById);

/**
 * @route   POST /api/documents
 * @desc    Subir un nuevo documento
 * @access  Private
 */
router.post('/', uploadDocument);

/**
 * @route   PUT /api/documents/:id
 * @desc    Actualizar un documento existente
 * @access  Private
 */
router.put('/:id', updateDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Eliminar un documento
 * @access  Private
 */
router.delete('/:id', deleteDocument);

/**
 * @route   GET /api/documents/:id/download
 * @desc    Descargar un documento
 * @access  Private
 */
router.get('/:id/download', downloadDocument);

/**
 * @route   GET /api/documents/:id/preview
 * @desc    Previsualizar un documento en el navegador
 * @access  Private
 */
router.get('/:id/preview', previewDocument);

export default router;
