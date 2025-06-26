import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Configurar dotenv para buscar el archivo .env en el directorio server
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('Middleware Auth - JWT_SECRET está configurado:', !!process.env.JWT_SECRET);

export const authenticateToken = (req, res, next) => {
  // Buscar token en: 
  // 1. Header de Authorization
  // 2. Query param (útil para previsualizaciones en iframe)
  // 3. Cookie (para futuras implementaciones)
  const authHeader = req.headers['authorization'];
  const queryToken = req.query.token;
  let token = authHeader && authHeader.split(' ')[1];
  
  // Si no hay token en el header pero sí en la query, usar ese
  if (!token && queryToken) {
    token = queryToken;
  }
  
  if (token == null) {
    return res.status(401).json({ error: 'No se ha proporcionado token de autenticación' });
  }

  // Definir una clave secreta predeterminada en caso de que no exista en el entorno
  const jwtSecret = process.env.JWT_SECRET || 'megaverse_jwt_secret_key';
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    req.user = user;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  
  next();
};
