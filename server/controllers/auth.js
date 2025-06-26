import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Configurar dotenv para buscar el archivo .env en el directorio server
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log('Variables de entorno cargadas desde:', path.resolve(process.cwd(), '.env'));
console.log('JWT_SECRET está configurado:', !!process.env.JWT_SECRET);

export const register = async (req, res) => {
  const { name, username, email, password } = req.body;
  
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Se requieren todos los campos obligatorios' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar si el nombre de usuario ya está en uso
    const [existingUsernames] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsernames.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }
    
    // Verificar si el email ya está en uso (si se proporciona)
    if (email) {
      const [existingEmails] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      if (existingEmails.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }
    
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar el nuevo usuario
    const [result] = await connection.query(
      'INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)',
      [name, username, email || null, hashedPassword]
    );
    
    // Obtener el usuario recién creado
    const [users] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    connection.release();
    
    const user = users[0];
    
    // Definir una clave secreta predeterminada en caso de que no exista en el entorno
    const jwtSecret = process.env.JWT_SECRET || 'megaverse_jwt_secret_key';
    console.log('JWT Secret (protegido):', jwtSecret ? 'Configurado OK' : 'NO CONFIGURADO');
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user,
      token
    });
    
  } catch (error) {
    console.error('Error en el registro:', error);
    return res.status(500).json({ error: 'Error del servidor al registrar usuario' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  
  console.log('Intento de login - datos recibidos:', { username: username || 'no proporcionado', passwordProvided: !!password });
  
  if (!username || !password) {
    console.log('Devolviendo error por falta de username o password');
    return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos' });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Buscar usuario por nombre de usuario
    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos' });
    }
    
    const user = users[0];
    
    // Comparar contraseñas
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos' });
    }
      // Datos del usuario sin la contraseña
    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance,
      createdAt: user.created_at,
      membership_date: user.membership_date,
      phone: user.phone,
      avatar_url: user.avatar_url
    };
    
    // Definir una clave secreta predeterminada en caso de que no exista en el entorno
    const jwtSecret = process.env.JWT_SECRET || 'megaverse_jwt_secret_key';
    console.log('JWT Secret (login) (protegido):', jwtSecret ? 'Configurado OK' : 'NO CONFIGURADO');
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    return res.json({
      user: userData,
      token
    });
    
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ error: 'Error del servidor al iniciar sesión' });
  } finally {
    if (connection) connection.release();
  }
};

export const getMe = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Buscar usuario por ID (del token)
    const [users] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Procesar el usuario antes de devolverlo
    const user = users[0];
    
    // Verificar si el avatar existe físicamente si hay una URL
    if (user.avatar_url) {
      console.log(`Avatar URL en BD: ${user.avatar_url}`);
      try {
        const avatarPath = path.join(process.cwd(), user.avatar_url.replace(/^\//, ''));
        console.log(`Ruta completa del avatar: ${avatarPath}`);
        
        // Si el archivo no existe, eliminar la referencia en la base de datos
        if (!fs.existsSync(avatarPath)) {
          console.log(`Avatar referenciado no encontrado: ${avatarPath} - Limpiando referencia`);
          try {
            const conn = await pool.getConnection();
            await conn.query('UPDATE users SET avatar_url = NULL WHERE id = ?', [req.user.id]);
            conn.release();
            user.avatar_url = null;
          } catch (err) {
            console.error('Error al limpiar referencia a avatar:', err);
          }
        } else {
          console.log(`Avatar encontrado en: ${avatarPath}`);
        }
      } catch (err) {
        console.error('Error al verificar la existencia del avatar:', err);
      }
    }
    
    return res.status(200).json(user);
    
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener datos del usuario' });
  }
};

// Función de diagnóstico para depurar JWT
export const debugJwt = (req, res) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'megaverse_jwt_secret_key';
    
    // Crear un token para probar con un payload simple
    const testToken = jwt.sign(
      { test: 'jwt_test' },
      jwtSecret,
      { expiresIn: '5m' }
    );
    
    // Verificar el token generado
    const decoded = jwt.verify(testToken, jwtSecret);
    
    return res.json({
      success: true,
      message: 'JWT funcionando correctamente',
      envVars: {
        jwtConfigured: !!process.env.JWT_SECRET,
        dbHost: process.env.DB_HOST,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
        envPath: path.resolve(process.cwd(), '.env')
      },
      tokenTest: {
        generated: true,
        verified: true,
        payload: decoded
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en JWT',
      error: error.message,
      stack: error.stack,
      envVars: {
        jwtConfigured: !!process.env.JWT_SECRET,
        dbHost: process.env.DB_HOST,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
        envPath: path.resolve(process.cwd(), '.env')
      }
    });
  }
};