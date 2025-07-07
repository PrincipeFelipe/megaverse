import express from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/database.js';
import { 
  uploadAvatar,
  uploadBlogImageHandler,
  deleteBlogImage
} from '../controllers/uploads.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para avatar de usuario
// Ruta para subir avatar - implementación simplificada
router.post('/avatar', (req, res) => {
  console.log('Iniciando proceso de subida de avatar con express-fileupload');
  
  // Verificar si se subió un archivo
  if (!req.files || !req.files.avatar) {
    console.log('No se proporcionó ningún archivo');
    return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
  }
  
  try {
    const avatarFile = req.files.avatar;
    console.log(`Archivo recibido: ${avatarFile.name} (${avatarFile.mimetype}, ${avatarFile.size} bytes)`);
    
    // Validar tipo MIME
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(avatarFile.mimetype)) {
      console.log(`Tipo de archivo no permitido: ${avatarFile.mimetype}`);
      return res.status(400).json({ 
        error: 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG, GIF y WebP' 
      });
    }
    
    // Validar tamaño
    if (avatarFile.size > 5 * 1024 * 1024) {
      console.log(`Archivo demasiado grande: ${avatarFile.size} bytes`);
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB' 
      });
    }
    
    // Crear el nombre del archivo
    const userId = req.user.id;
    const fileExt = path.extname(avatarFile.name).toLowerCase();
    const fileName = `${userId}${fileExt}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    const uploadPath = path.join(uploadDir, fileName);
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(uploadDir)) {
      console.log(`Creando directorio: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Eliminar avatares previos
    const files = fs.readdirSync(uploadDir);
    files.filter(file => file.startsWith(`${userId}.`))
         .forEach(file => {
           fs.unlinkSync(path.join(uploadDir, file));
           console.log(`Avatar previo eliminado: ${file}`);
         });
    
    // Mover el archivo
    avatarFile.mv(uploadPath, async function(err) {
      if (err) {
        console.error('Error al guardar el archivo:', err);
        return res.status(500).json({ error: `Error al guardar el archivo: ${err.message}` });
      }
      
      try {
        console.log(`Archivo guardado correctamente: ${uploadPath}`);
        // URL relativa para la base de datos
        const avatarUrl = `/uploads/avatars/${fileName}`;
        
        // Actualizar el registro del usuario
        const connection = await pool.getConnection();
        await connection.query(
          'UPDATE users SET avatar_url = ? WHERE id = ?',
          [avatarUrl, userId]
        );
        
        // Obtener datos actualizados del usuario
        const [users] = await connection.query(
          'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url FROM users WHERE id = ?',
          [userId]
        );
        connection.release();
        
        console.log('Avatar actualizado correctamente en la base de datos');
        return res.status(200).json({ 
          message: 'Avatar actualizado correctamente',
          user: users[0]
        });
      } catch (dbError) {
        console.error('Error al actualizar la base de datos:', dbError);
        return res.status(500).json({ 
          error: `Error al actualizar la base de datos: ${dbError.message}` 
        });
      }
    });
  } catch (error) {
    console.error('Error al procesar la subida del avatar:', error);
    return res.status(500).json({ 
      error: `Error al procesar la subida del avatar: ${error.message}` 
    });
  }
});
// Ruta para eliminar avatar
router.delete('/avatar', async (req, res) => {
  try {
    console.log(`Iniciando proceso de eliminación de avatar para usuario ${req.user.id}`);
    
    // Encontrar todos los avatares existentes del usuario
    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const userAvatars = files.filter(file => file.startsWith(`${req.user.id}.`));
      
      console.log(`Se encontraron ${userAvatars.length} avatares para el usuario ${req.user.id}`);
      
      // Eliminar todos los avatares del usuario
      userAvatars.forEach(file => {
        const avatarPath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(avatarPath);
          console.log(`Avatar eliminado: ${avatarPath}`);
        } catch (err) {
          console.error(`Error al eliminar el archivo ${avatarPath}:`, err);
        }
      });
    }
    
    // Actualizar la base de datos
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE users SET avatar_url = NULL WHERE id = ?',
      [req.user.id]
    );
    
    // Obtener los datos actualizados del usuario
    const [users] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    connection.release();
    
    console.log('Avatar eliminado correctamente de la base de datos');
    return res.status(200).json({
      message: 'Avatar eliminado correctamente',
      user: users[0]
    });
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    return res.status(500).json({
      error: `Error al eliminar avatar: ${error.message}`
    });
  }
});

// Rutas para imágenes del blog
router.post('/blog', uploadBlogImageHandler);
router.delete('/blog/:filename', deleteBlogImage);

export default router;
