/**
 * Controlador para la gestión de documentos
 */
import mysql from 'mysql2/promise';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a la base de datos - debe coincidir con la del servidor
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'db_megaverse',
  connectTimeout: 10000
};

// Obtener __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para guardar los documentos
const UPLOADS_DIR = path.join(__dirname, '../uploads/documents');

// Crear el directorio si no existe
(async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('Directorio para documentos creado/verificado');
  } catch (error) {
    console.error('Error al crear directorio para documentos:', error);
  }
})();

/**
 * Obtener todos los documentos con filtros opcionales
 */
const getAllDocuments = async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Construir la consulta base
    let query = `
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    
    // Array para los parámetros de la consulta
    const params = [];
    
    // Añadir filtros si existen
    if (req.query.title) {
      query += ` AND d.title LIKE ?`;
      params.push(`%${req.query.title}%`);
    }
    
    if (req.query.category) {
      query += ` AND d.category = ?`;
      params.push(req.query.category);
    }
    
    if (req.query.startDate) {
      query += ` AND d.created_at >= ?`;
      params.push(`${req.query.startDate} 00:00:00`);
    }
    
    if (req.query.endDate) {
      query += ` AND d.created_at <= ?`;
      params.push(`${req.query.endDate} 23:59:59`);
    }
    
    if (req.query.uploaded_by) {
      query += ` AND d.uploaded_by = ?`;
      params.push(req.query.uploaded_by);
    }
    
    // Ordenar por fecha de creación (más reciente primero)
    query += ` ORDER BY d.created_at DESC`;
    
    // Aplicar paginación si existe
    if (req.query.page && req.query.limit) {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      const offset = (page - 1) * limit;
      
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }
    
    // Ejecutar la consulta
    const [documents] = await connection.execute(query, params);
    
    res.status(200).json({
      success: true,
      documents
    });
    
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los documentos',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Obtener un documento por su id
 */
const getDocumentById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(DB_CONFIG);
    
    const [rows] = await connection.execute(`
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      document: rows[0]
    });
    
  } catch (error) {
    console.error('Error al obtener documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el documento',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Subir un nuevo documento
 */
const uploadDocument = async (req, res) => {
  let connection;
  try {
    // Verificar que se haya subido un archivo (multer)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ningún archivo'
      });
    }
    
    const { title, description, category } = req.body;
    
    // Validar campos obligatorios
    if (!title || !category) {
      // Si hay un error de validación, eliminar el archivo que se subió
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo tras validación fallida:', unlinkError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'El título y la categoría son obligatorios'
      });
    }
    
    console.log(`Archivo recibido: ${req.file.originalname}, guardado como: ${req.file.filename}`);
    console.log(`Ruta del archivo: ${req.file.path}`);

    // Guardar información en la base de datos
    connection = await mysql.createConnection(DB_CONFIG);
    
    const [result] = await connection.execute(`
      INSERT INTO documents (
        title, description, file_path, file_name, file_type, file_size, category, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      description || '',
      `/uploads/documents/${req.file.filename}`,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      category,
      req.user.id
    ]);
    
    // Obtener el documento recién creado
    const [rows] = await connection.execute(`
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Documento subido correctamente',
      document: rows[0]
    });
    
  } catch (error) {
    console.error('Error al subir documento:', error);
    
    // Eliminar el archivo físico si se subió pero hubo error en BD
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('Archivo eliminado tras error en BD:', req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo tras error en BD:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al subir el documento',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Actualizar un documento existente
 */
const updateDocument = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    
    // Validar campos obligatorios
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'El título y la categoría son obligatorios'
      });
    }
    
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Verificar que el documento existe y pertenece al usuario (o es admin)
    const [existingRows] = await connection.execute(`
      SELECT * FROM documents WHERE id = ?
    `, [id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    const document = existingRows[0];
    
    // Verificar permisos (solo admin o el propietario pueden modificar)
    if (req.user.role !== 'admin' && document.uploaded_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este documento'
      });
    }
    
    // Actualizar documento en la base de datos
    await connection.execute(`
      UPDATE documents
      SET title = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description || '', category, id]);
    
    // Obtener el documento actualizado
    const [rows] = await connection.execute(`
      SELECT d.*, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `, [id]);
    
    res.status(200).json({
      success: true,
      message: 'Documento actualizado correctamente',
      document: rows[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el documento',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Eliminar un documento
 */
const deleteDocument = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Verificar que el documento existe y obtener su ruta
    const [existingRows] = await connection.execute(`
      SELECT * FROM documents WHERE id = ?
    `, [id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    const document = existingRows[0];
    
    // Verificar permisos (solo admin o el propietario pueden eliminar)
    if (req.user.role !== 'admin' && document.uploaded_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este documento'
      });
    }
    
    // Eliminar el archivo físico
    const filePath = path.join(__dirname, '..', document.file_path);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('No se pudo eliminar el archivo físico:', err);
      // Continuamos aunque no se pueda eliminar el archivo
    }
    
    // Eliminar el registro de la base de datos
    await connection.execute(`DELETE FROM documents WHERE id = ?`, [id]);
    
    res.status(200).json({
      success: true,
      message: 'Documento eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el documento',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Descargar un documento
 */
const downloadDocument = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Verificar que el documento existe y obtener su información
    const [rows] = await connection.execute(`
      SELECT * FROM documents WHERE id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    const document = rows[0];
    
    // Construir la ruta completa al archivo
    const filePath = path.join(__dirname, '..', document.file_path);
    
    // Verificar si el archivo existe
    try {
      await fs.access(filePath);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no se encuentra físicamente en el servidor'
      });
    }
    
    // Configurar headers para la descarga
    res.setHeader('Content-Type', document.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.file_name)}"`);
    
    // Enviar el archivo como respuesta
    import('fs').then(fs => {
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    });
    
  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar el documento',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Previsualizar un documento existente
 */
const previewDocument = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log(`[PREVIEW] Solicitando previsualización del documento ${id}`);
    
    connection = await mysql.createConnection(DB_CONFIG);
    
    const [rows] = await connection.execute('SELECT * FROM documents WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      console.log(`[PREVIEW] Documento ${id} no encontrado`);
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }
    
    const document = rows[0];
    console.log(`[PREVIEW] Documento encontrado: ${document.file_name}, tipo: ${document.file_type}`);
    
    const filePath = path.join(__dirname, '..', document.file_path);
    console.log(`[PREVIEW] Ruta del archivo: ${filePath}`);
    
    // Verificación explícita del archivo y su tamaño
    try {
      const stats = await fs.stat(filePath);
      console.log(`[PREVIEW] Archivo verificado exitosamente. Tamaño: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        console.error(`[PREVIEW] El archivo existe pero está vacío (0 bytes)`);
        return res.status(404).json({ 
          success: false, 
          message: 'El archivo existe pero está vacío' 
        });
      }
    } catch (err) {
      console.error(`[PREVIEW] Error al verificar archivo: ${err.message}`);
      return res.status(404).json({ 
        success: false, 
        message: 'El archivo no se encuentra o no se puede acceder' 
      });
    }
    
    // Ya tenemos los datos, cerramos la conexión a la BD antes de enviar el archivo.
    await connection.end();
    connection = null;

    // Configuración de headers
    res.setHeader('Content-Type', document.file_type);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.file_name)}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Security-Policy', "frame-ancestors *;");
    res.setHeader('Cache-Control', 'private, max-age=300');

    console.log(`[PREVIEW] Enviando archivo usando res.sendFile...`);
    
    // Enviar el archivo directamente sin usar promesas ni buffers
    res.sendFile(filePath, {
      headers: {
        'Content-Type': document.file_type,
        'Content-Disposition': `inline; filename="${encodeURIComponent(document.file_name)}"`,
      }
    }, (err) => {
      if (err) {
        console.error(`[PREVIEW] Error al enviar archivo: ${err.message}`);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Error al enviar el archivo',
            error: err.message
          });
        }
      } else {
        console.log(`[PREVIEW] Archivo enviado exitosamente`);
      }
    });

  } catch (error) {
    console.error('Error al previsualizar documento:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error al previsualizar el documento',
        error: error.message
      });
    }
  } finally {
    if (connection) await connection.end();
  }
};

// Exportar las funciones del controlador
export {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  previewDocument
};
