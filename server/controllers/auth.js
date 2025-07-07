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
  console.log('========== REGISTRO DE USUARIO (AUTH) ==========');
  console.log('Body completo recibido:', req.body);
  
  // Extraemos los campos del body de la petición
  let { name, username, email, password, phone, dni, membership_date, role, balance, avatar_url } = req.body;
  
  // Por defecto, usuarios registrados desde formulario público estarán desactivados
  // hasta que un administrador los active
  const is_active = false;
  
  console.log('Datos recibidos originales en register:', { 
    name, username, email, password: password ? '******' : undefined,
    phone, dni, membership_date, role, balance, avatar_url 
  });
  
  // Aseguramos que los campos existan aunque no se hayan enviado desde el frontend
  phone = phone || null;
  dni = dni || null;
  
  // Asegurar que membership_date esté en formato correcto para MySQL (YYYY-MM-DD)
  if (membership_date) {
    // Si ya es una fecha válida, la convertimos al formato MySQL
    try {
      const date = new Date(membership_date);
      if (!isNaN(date.getTime())) {
        membership_date = date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Error al procesar la fecha:', e);
      membership_date = null;
    }
  } else {
    membership_date = null;
  }
  
  console.log('Fecha formateada:', membership_date);
  
  // Si viene el rol desde un registro administrativo, respetarlo
  // De lo contrario, asignar 'user' por defecto
  role = role || 'user';
  
  // Asegurarnos de que los campos sean NULL si están vacíos
  phone = phone && phone.trim() !== '' ? phone : null;
  dni = dni && dni.trim() !== '' ? dni : null;
  
  // Para la fecha, intentamos transformarla correctamente o la dejamos nula
  if (membership_date && membership_date.trim() !== '') {
    try {
      // Asegurar formato YYYY-MM-DD para MySQL
      const date = new Date(membership_date);
      if (!isNaN(date.getTime())) {
        membership_date = date.toISOString().split('T')[0];
      } else {
        membership_date = null;
      }
    } catch (e) {
      console.error('Error grave al procesar fecha:', e);
      membership_date = null;
    }
  } else {
    membership_date = null;
  }
  
  console.log('Datos procesados finales en register:', { 
    phone: phone ? phone : 'NULL', 
    dni: dni ? dni : 'NULL', 
    membership_date: membership_date ? membership_date : 'NULL', 
    role
  });
  
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Se requieren todos los campos obligatorios' });
  }
  
  let connection;
  try {
    console.log('Iniciando registro con validaciones de usuario');
    connection = await pool.getConnection();
    
    // Verificar si el nombre de usuario ya está en uso
    const [existingUsernames] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsernames.length > 0) {
      console.log('Nombre de usuario ya registrado:', username);
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
        console.log('Email ya registrado:', email);
        connection.release();
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }
    
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Preparar los campos y valores para la consulta
    // Siempre incluimos los campos básicos
    const fields = ['name', 'username', 'email', 'password', 'role', 'is_active'];
    const values = [name, username, email || null, hashedPassword, role, is_active];
    
    // Añadir campos opcionales solo si tienen valor
    if (phone !== null) {
      fields.push('phone');
      values.push(phone);
    }
    
    if (dni !== null) {
      fields.push('dni');
      values.push(dni);
    }
    
    if (membership_date !== null) {
      fields.push('membership_date');
      values.push(membership_date);
    }
    
    if (balance !== undefined) {
      fields.push('balance');
      values.push(balance);
    }
    
    if (avatar_url !== undefined && avatar_url !== null) {
      fields.push('avatar_url');
      values.push(avatar_url);
    }
    
    console.log('SQL query fields:', fields);
    console.log('SQL query values:', values.map((v, i) => i === 3 ? '******' : v)); // Ocultamos la contraseña
    
    // Construimos la consulta SQL para poder verla completa en los logs
    const sqlQuery = `INSERT INTO users (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
    console.log('SQL query completa:', sqlQuery);
    
    // Log especial para los campos importantes del formulario
    console.log('Valores finales de campos críticos:', {
      phone: phone !== null ? phone : 'NO INCLUIDO',
      dni: dni !== null ? dni : 'NO INCLUIDO',
      membership_date: membership_date !== null ? membership_date : 'NO INCLUIDO',
      role: role
    });
    
    // Variable para almacenar el resultado de la inserción
    let insertedId;
    
    try {
      // Insertar el nuevo usuario con todos los campos proporcionados
      console.log('Ejecutando consulta SQL con valores:', values.map((v, i) => i === 3 ? '******' : v));
      const [insertResult] = await connection.query(sqlQuery, values);
      console.log('Resultado de la inserción:', insertResult);
      
      // Guardamos el ID del usuario recién creado
      insertedId = insertResult.insertId;
    } catch (error) {
      console.error('Error al ejecutar la consulta SQL:', error);
      console.error('Detalle del error:', error.message);
      console.error('Código de error SQL:', error.code);
      console.error('SQL state:', error.sqlState);
      
      // Devolver un error más informativo al cliente
      return res.status(500).json({ 
        error: `Error del servidor al registrar usuario: ${error.code} - ${error.message}` 
      });
    }
    
    if (!insertedId) {
      return res.status(500).json({ 
        error: 'Error al registrar usuario: No se pudo obtener el ID del usuario insertado' 
      });
    }
    
    // Obtener el usuario recién creado con todos los campos
    const [users] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url FROM users WHERE id = ?',
      [insertedId]
    );
    
    connection.release();
    
    // Verificar que se encontró el usuario
    if (!users || users.length === 0) {
      return res.status(500).json({ 
        error: 'Error al registrar usuario: No se pudo recuperar el usuario creado' 
      });
    }
    
    const user = users[0];
    
    // Verificar si los campos críticos están presentes
    console.log('Usuario creado en la BD:', {
      id: user.id,
      name: user.name,
      username: user.username,
      phone: user.phone,
      dni: user.dni,
      membership_date: user.membership_date,
      role: user.role
    });
    
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
    
    // Verificar si el usuario está activo
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({ 
        error: 'Tu cuenta está pendiente de activación. Un administrador deberá activarla.' 
      });
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
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Procesar el usuario antes de devolverlo
    const user = users[0];
    
    // Log para depurar los valores del usuario, especialmente el DNI
    console.log('Datos del usuario obtenidos en getMe:', {
      id: user.id,
      name: user.name,
      email: user.email,
      dni: user.dni,
      phone: user.phone,
      avatar_url: user.avatar_url
    });
    
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