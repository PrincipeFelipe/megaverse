import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/database.js';

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

// Configuración de subida de avatares
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // Límite de 5MB
    files: 1 // Máximo 1 archivo
  },
  fileFilter: imageFilter
}).single('avatar');

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
