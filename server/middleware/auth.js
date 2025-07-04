import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Configurar dotenv para buscar el archivo .env en el directorio server
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('Middleware Auth - JWT_SECRET está configurado:', !!process.env.JWT_SECRET);

export const authenticateToken = (req, res, next) => {
  console.log(`[Auth Middleware] Verificando token para ruta: ${req.method} ${req.originalUrl}`);
  
  // Buscar token en: 
  // 1. Header de Authorization
  // 2. Query param (útil para previsualizaciones en iframe)
  // 3. Cookie (para futuras implementaciones)
  const authHeader = req.headers['authorization'];
  const queryToken = req.query.token;
  let token = authHeader && authHeader.split(' ')[1];
  
  console.log(`[Auth Middleware] Token en header: ${token ? 'Sí' : 'No'}`);
  console.log(`[Auth Middleware] Token en query: ${queryToken ? 'Sí' : 'No'}`);
  
  // Si no hay token en el header pero sí en la query, usar ese
  if (!token && queryToken) {
    token = queryToken;
    console.log(`[Auth Middleware] Usando token de query`);
  }
  
  if (token == null) {
    console.log(`[Auth Middleware] No se proporcionó token`);
    return res.status(401).json({ error: 'No se ha proporcionado token de autenticación' });
  }

  // Definir una clave secreta predeterminada en caso de que no exista en el entorno
  const jwtSecret = process.env.JWT_SECRET || 'megaverse_jwt_secret_key';
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.log(`[Auth Middleware] Error al verificar token:`, err.message);
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    console.log(`[Auth Middleware] Token verificado correctamente. Usuario:`, user);
    req.user = user;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  console.log(`[isAdmin Middleware] Verificando rol de administrador para: ${req.method} ${req.originalUrl}`);
  console.log(`[isAdmin Middleware] Usuario autenticado:`, req.user);
  
  if (!req.user) {
    console.log(`[isAdmin Middleware] Usuario no autenticado`);
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  if (req.user.role !== 'admin') {
    console.log(`[isAdmin Middleware] Usuario no es administrador. Rol actual: ${req.user.role}`);
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  
  console.log(`[isAdmin Middleware] Acceso como administrador concedido`);
  next();
};
