import path from 'path';
import fs from 'fs';
import { pool } from '../config/database.js';
import multer from 'multer';

// Configurar el almacenamiento de multer para los avatares
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'avatars');
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directorio creado: ${dir}`);
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Usar el ID del usuario como nombre de archivo
    const userId = req.user.id;
    
    // Eliminar archivos previos del usuario (diferentes extensiones)
    try {
      const dir = path.join(process.cwd(), 'uploads', 'avatars');
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const userFiles = files.filter(file => file.startsWith(`${userId}.`));
        userFiles.forEach(file => {
          fs.unlinkSync(path.join(dir, file));
          console.log(`Avatar previo eliminado: ${file}`);
        });
      }
    } catch (err) {
      console.error('Error al eliminar avatar previo:', err);
    }
    
    const fileExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}${fileExt}`);
  }
});

// Configurar el almacenamiento de multer para las imágenes del blog
const blogImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'blog');
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directorio creado: ${dir}`);
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único basado en timestamp y un número aleatorio
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Crear un nombre de archivo único para evitar colisiones
    const filename = `blog_${timestamp}_${randomNum}${fileExt}`;
    cb(null, filename);
  }
});

// Configurar el almacenamiento de multer para los documentos
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'documents');
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Directorio creado: ${dir}`);
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único basado en timestamp y un número aleatorio
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Crear un nombre de archivo único para evitar colisiones
    const filename = `doc_${timestamp}_${randomNum}${fileExt}`;
    cb(null, filename);
  }
});

// Filtro para aceptar solo imágenes
const imageFilter = (req, file, cb) => {
  // Lista de tipos MIME permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  // Expresión regular para extensiones de archivo permitidas
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);
  
  // Validar tamaño máximo (5MB)
  if (!file.size) {
    console.log('Verificación de tamaño no disponible en este punto');
    // La verificación de tamaño se realizará en los límites de multer
  }
  
  if (extname && mimetype) {
    console.log(`Avatar válido: ${file.originalname} (${file.mimetype})`);
    return cb(null, true);
  }
  
  console.log(`Avatar rechazado: ${file.originalname} (${file.mimetype})`);
  cb(new Error('Solo se permiten archivos de imagen en formato JPEG, PNG, GIF o WebP'));
};

// Filtro para documentos (más permisivo que las imágenes)
const documentFilter = (req, file, cb) => {
  // Lista de tipos MIME permitidos para documentos
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log(`Documento válido: ${file.originalname} (${file.mimetype})`);
    return cb(null, true);
  }
  
  console.log(`Documento rechazado: ${file.originalname} (${file.mimetype})`);
  cb(new Error('Tipo de archivo no permitido'));
};

// Configurar Multer para avatares
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('avatar');

// Configurar Multer para imágenes del blog
export const uploadBlogImage = multer({
  storage: blogImageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('blogImage');

// Configurar Multer para documentos
export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
}).single('file');

// Controlador para subir un avatar
export const uploadUserAvatar = async (req, res) => {
  try {
    console.log('Iniciando proceso de subida de avatar');
    // La subida del archivo ya se ha realizado por el middleware de multer
    if (!req.file) {
      console.log('Error: No se ha proporcionado ninguna imagen');
      return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
    }
    
    console.log(`Archivo recibido: ${req.file.originalname}, guardado como: ${req.file.filename}`);
    console.log(`Ruta del archivo: ${req.file.path}`);

    // Obtener la URL relativa para la base de datos
    // Cambiamos la ruta para que sea accesible desde la configuración del servidor
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log(`URL para la base de datos: ${avatarUrl}`);

    // Actualizar el registro del usuario con la nueva URL del avatar
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatarUrl, req.user.id]
    );
    console.log(`BD actualizada para usuario ${req.user.id} con URL ${avatarUrl}`);
    
    // Obtener los datos actualizados del usuario
    const [users] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    
    connection.release();
    
    console.log('Avatar actualizado correctamente');
    return res.status(200).json({ 
      message: 'Avatar actualizado correctamente',
      user: users[0]
    });
    
  } catch (error) {
    console.error('Error al subir avatar:', error);
    return res.status(500).json({ error: 'Error del servidor al subir avatar' });
  }
};

// Controlador para eliminar un avatar
export const deleteUserAvatar = async (req, res) => {
  try {
    console.log(`Iniciando proceso de eliminación de avatar para usuario ${req.user.id}`);
    const connection = await pool.getConnection();
    
    // Obtener la URL actual del avatar
    const [users] = await connection.query(
      'SELECT avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      console.log('Usuario no encontrado');
      connection.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const avatarUrl = users[0].avatar_url;
    console.log(`URL del avatar a eliminar: ${avatarUrl || 'No tiene avatar'}`);
    
    // Si el usuario tiene un avatar, eliminarlo del sistema de archivos
    if (avatarUrl) {
      try {
        const avatarPath = path.join(process.cwd(), avatarUrl.replace(/^\//, ''));
        console.log(`Ruta completa del avatar a eliminar: ${avatarPath}`);
        
        // Verificar si el archivo existe antes de intentar eliminarlo
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
          console.log(`Archivo eliminado: ${avatarPath}`);
        } else {
          console.log(`El archivo no existe físicamente: ${avatarPath}`);
        }
      } catch (err) {
        console.error('Error al eliminar archivo:', err);
      }
    }
    
    // Actualizar el registro del usuario para eliminar la referencia al avatar
    await connection.query(
      'UPDATE users SET avatar_url = NULL WHERE id = ?',
      [req.user.id]
    );
    console.log(`Referencia a avatar eliminada de la base de datos para usuario ${req.user.id}`);
    
    // Obtener los datos actualizados del usuario
    const [updatedUsers] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    
    connection.release();
    
    console.log('Avatar eliminado correctamente');
    return res.status(200).json({ 
      message: 'Avatar eliminado correctamente',
      user: updatedUsers[0]
    });
    
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    return res.status(500).json({ error: 'Error del servidor al eliminar avatar' });
  }
};

// Controlador para subir una imagen para el blog usando multer
export const uploadBlogImageHandler = async (req, res) => {
  try {
    console.log('Iniciando proceso de subida de imagen para blog');
    
    // La subida del archivo ya se ha realizado por el middleware de multer
    if (!req.file) {
      console.log('Error: No se ha proporcionado ninguna imagen');
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }

    // Verificar permisos - solo admin y editores pueden subir imágenes
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      console.error(`Error: Usuario ${req.user.id} con rol ${req.user.role} no tiene permisos para subir imágenes`);
      
      // Eliminar el archivo que se subió ya que no se tiene permiso
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo sin permisos:', unlinkError);
      }
      
      return res.status(403).json({ message: 'No tiene permisos para subir imágenes' });
    }

    console.log(`Archivo recibido: ${req.file.originalname}, guardado como: ${req.file.filename}`);
    console.log(`Ruta del archivo: ${req.file.path}`);

    // Generar la URL para acceder al archivo
    const imageUrl = `/uploads/blog/${req.file.filename}`;
    
    console.log(`Imagen subida exitosamente: ${imageUrl}`);
    
    // Respuesta exitosa
    res.json({
      message: 'Imagen subida exitosamente',
      file: {
        url: imageUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
    
  } catch (error) {
    console.error('Error general en uploadBlogImageHandler:', error);
    
    // Intentar eliminar el archivo si hubo un error después de la subida
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo tras error:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error al subir la imagen',
      error: error.message 
    });
  }
};

// Eliminar una imagen del blog
export const deleteBlogImage = async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log(`Solicitud para eliminar imagen de blog: ${filename} por usuario ${req.user.id} (${req.user.username || req.user.email})`);
    
    // Verificar que el formato del nombre de archivo es correcto para evitar exploits
    if (!filename || !filename.startsWith('blog_') || filename.includes('..')) {
      console.warn(`Intento de eliminación con nombre de archivo inválido: ${filename}`);
      return res.status(400).json({ message: 'Nombre de archivo inválido' });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      console.warn(`Usuario sin permisos intenta eliminar imagen: ${req.user.id} (${req.user.role})`);
      return res.status(403).json({ message: 'No tiene permisos para eliminar imágenes' });
    }
    
    const filepath = path.join(process.cwd(), 'uploads', 'blog', filename);
    console.log(`Ruta completa del archivo a eliminar: ${filepath}`);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filepath)) {
      console.warn(`Archivo no encontrado al intentar eliminar: ${filepath}`);
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }
    
    // Eliminar el archivo
    fs.unlinkSync(filepath);
    console.log(`Imagen de blog eliminada con éxito: ${filename} por usuario ${req.user.id} (${req.user.username || req.user.email})`);
    
    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar imagen de blog:', error);
    res.status(500).json({ message: 'Error al eliminar la imagen' });
  }
};
