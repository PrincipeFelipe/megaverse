import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';

// Nuevo controlador para registro administrativo de usuarios
export const registerUser = async (req, res) => {
  console.log('=========== REGISTRO ADMINISTRATIVO ===========');
  console.log('Body recibido:', req.body);
  console.log('Ruta utilizada:', req.originalUrl);
  console.log('Método HTTP:', req.method);
  console.log('Headers:', req.headers);
  
  // Extraemos los campos del body de la petición
  let { name, username, email, password, phone, dni, membership_date, role } = req.body;
  
  console.log('Datos recibidos para registro administrativo:', { 
    name, username, email, password: password ? '******' : undefined,
    phone, dni, membership_date, role
  });
  
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Se requieren todos los campos obligatorios (nombre, username y password)' });
  }
  
  // Procesamiento de campos opcionales
  phone = phone && phone.trim() !== '' ? phone : null;
  dni = dni && dni.trim() !== '' ? dni : null;
  
  // Asegurar que membership_date esté en formato correcto para MySQL (YYYY-MM-DD)
  if (membership_date && membership_date.trim() !== '') {
    console.log('Fecha recibida (antes de formatear):', membership_date, 'tipo:', typeof membership_date);
    try {
      const date = new Date(membership_date);
      console.log('Objeto Date creado:', date, 'Es válida:', !isNaN(date.getTime()));
      if (!isNaN(date.getTime())) {
        membership_date = date.toISOString().split('T')[0];
        console.log('Fecha convertida a formato MySQL:', membership_date);
      } else {
        console.log('La fecha no es válida');
        membership_date = null;
      }
    } catch (e) {
      console.error('Error al procesar la fecha:', e);
      membership_date = null;
    }
  } else {
    console.log('No se recibió fecha de alta o está vacía');
    membership_date = null;
  }
  
  console.log('Fecha formateada final:', membership_date);
  
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
    
    // Preparar valores para la consulta SQL (sin incluir balance)
    const userData = {
      name,
      username,
      email: email || null,
      password: hashedPassword,
      role: role || 'user',
      is_active: true, // Usuarios creados por admin están activos por defecto
      phone: phone,
      dni: dni,
      membership_date: membership_date
    };
    
    // Filtrar propiedades nulas o undefined para no incluirlas en la consulta
    const filteredUserData = Object.entries(userData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // Construir consulta SQL dinámicamente
    const fields = Object.keys(filteredUserData);
    const values = Object.values(filteredUserData);
    const placeholders = fields.map(() => '?').join(', ');
    
    console.log('Campos SQL (filtrados):', fields);
    console.log('Valores SQL (filtrados):', values.map((v, i) => fields[i] === 'password' ? '******' : v));
    
    // Construir la consulta SQL para depuración
    const query = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;
    console.log('SQL Query completa:', query);
    
    // Resultado para almacenar el ID del usuario insertado
    let insertedId;
    
    // Insertar el nuevo usuario
    try {
      console.log('Ejecutando inserción SQL...');
      const [insertResult] = await connection.query(query, values);
      console.log('Resultado de la inserción:', insertResult);
      
      if (!insertResult || !insertResult.insertId) {
        throw new Error('No se pudo obtener el ID del usuario insertado');
      }
      
      insertedId = insertResult.insertId;
    } catch (dbError) {
      console.error('Error SQL al insertar usuario:', dbError);
      console.error('Mensaje SQL:', dbError.message);
      console.error('Código SQL:', dbError.code);
      
      // Devolvemos un error más detallado
      return res.status(500).json({ 
        error: `Error al insertar usuario: ${dbError.code} - ${dbError.message}` 
      });
    }
    
    // Obtener el usuario recién creado
    try {
      console.log('Consultando datos del usuario creado con ID:', insertedId);
      const [users] = await connection.query(
        'SELECT id, name, username, email, role, created_at, membership_date, phone, dni FROM users WHERE id = ?',
        [insertedId]
      );
      
      if (!users || users.length === 0) {
        console.error('No se encontró el usuario recién creado');
        return res.status(404).json({ error: 'No se pudo recuperar el usuario creado' });
      }
      
      const user = users[0];
      console.log('Usuario recuperado de la BD:', user);
      console.log('Campos críticos en el usuario recuperado:', {
        phone: user.phone !== undefined ? user.phone : 'NO PRESENTE',
        dni: user.dni !== undefined ? user.dni : 'NO PRESENTE',
        membership_date: user.membership_date !== undefined ? user.membership_date : 'NO PRESENTE'
      });
      
      return res.status(201).json({
        message: 'Usuario registrado correctamente',
        user
      });
    } catch (selectError) {
      console.error('Error al obtener el usuario recién creado:', selectError);
      return res.status(500).json({ 
        error: `Se creó el usuario pero hubo un error al recuperar sus datos: ${selectError.message}` 
      });
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error general en el registro administrativo:', error);
    if (connection) connection.release();
    return res.status(500).json({ 
      error: `Error del servidor al registrar usuario: ${error.message}` 
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url, is_active FROM users'
    );
    connection.release();
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener usuarios' });
  }
};

// Endpoint simplificado para seleccionar usuarios (para componentes de selección)
// No requiere permisos de administrador, pero sí autenticación
export const getUsersForSelection = async (req, res) => {
  try {
    console.log(`Usuario ${req.user.name} (ID: ${req.user.id}) solicitando lista de usuarios para selección`);
    const connection = await pool.getConnection();
    
    // Solo devuelve los campos mínimos necesarios para mostrar y seleccionar usuarios
    // Filtra usuarios que tienen exenciones permanentes
    const [users] = await connection.query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      WHERE u.id NOT IN (
        SELECT e.user_id 
        FROM cleaning_exemptions e 
        WHERE e.is_permanent = TRUE
      )
      ORDER BY u.name ASC
    `);
    connection.release();
    
    console.log(`Se encontraron ${users.length} usuarios para selección`);
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error al obtener usuarios para selección:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener lista de usuarios' });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await pool.getConnection();  const [users] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url FROM users WHERE id = ?',
      [id]
    );
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    return res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener usuario' });
  }
};

export const updateUser = async (req, res) => {
  let { id } = req.params;  const { 
    name, 
    username, 
    email, 
    role, 
    balance, 
    current_password, 
    new_password, 
    phone, 
    dni,
    membership_date, 
    avatar_url 
  } = req.body;
  
  // Si el id es "me", utiliza el id del usuario autenticado
  if (id === 'me') {
    id = req.user.id;
  }
  
  // Solo el propio usuario o un administrador pueden modificar un perfil
  if (req.user.id != id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos para modificar este usuario' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Primero verificar las columnas disponibles en la tabla users
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
    `);
    
    // Convertir a un array de nombres de columna para fácil verificación
    const availableColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());
    
    // Verificar que el usuario existe
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Preparar los campos a actualizar, verificando que existan en la tabla
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
      // Teléfono ahora es obligatorio
    if (phone !== undefined && availableColumns.includes('phone')) {
      // Verificar que el teléfono no esté vacío si el usuario lo está actualizando
      if (phone === null || phone === '') {
        connection.release();
        return res.status(400).json({ error: 'El teléfono es obligatorio' });
      }
      updates.phone = phone;
    }
      // DNI es opcional
    if (dni !== undefined && availableColumns.includes('dni')) {
      // Si no está vacío, verificar que no exista otro usuario con el mismo DNI
      if (dni) {
        const [existingWithDni] = await connection.query(
          'SELECT id FROM users WHERE dni = ? AND id != ?',
          [dni, id]
        );
        
        if (existingWithDni.length > 0) {
          connection.release();
          return res.status(400).json({ error: 'Ya existe un usuario con este DNI' });
        }
      }
      updates.dni = dni || null; // Permitir valor nulo
    }
    
    if (avatar_url !== undefined && availableColumns.includes('avatar_url')) {
      updates.avatar_url = avatar_url;
    }
    
    // Formatear la fecha de membresía si se proporciona y existe la columna
    if (membership_date !== undefined && availableColumns.includes('membership_date')) {
      updates.membership_date = membership_date || null; // Permitir valor nulo
    }
    
    // Solo los administradores pueden cambiar el rol o el saldo
    if (req.user.role === 'admin') {
      if (role) updates.role = role;
      if (balance !== undefined) updates.balance = balance;
    }
    
    // Si se intenta cambiar la contraseña, verificar la contraseña actual
    if (new_password) {
      // Si no se proporcionó la contraseña actual
      if (!current_password) {
        connection.release();
        return res.status(400).json({ error: 'Se requiere la contraseña actual para cambiarla' });
      }
      
      // Verificar la contraseña actual
      const isPasswordValid = await bcrypt.compare(current_password, existingUsers[0].password);
      if (!isPasswordValid) {
        connection.release();
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }
      
      // Encriptar la nueva contraseña
      updates.password = await bcrypt.hash(new_password, 10);
    }
    
    if (Object.keys(updates).length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }
    
    // Construir la consulta SQL dinámicamente
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await connection.query(
      `UPDATE users SET ${fields} WHERE id = ?`,
      [...values, id]
    );
      // Obtener el usuario actualizado
    const [updatedUsers] = await connection.query(
      'SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url FROM users WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    return res.status(200).json({
      message: 'Usuario actualizado correctamente',
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ error: `Error del servidor al actualizar usuario: ${error.message}` });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  
  // Solo un administrador puede eliminar usuarios
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos para eliminar usuarios' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar que el usuario existe
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Eliminar usuario
    await connection.query('DELETE FROM users WHERE id = ?', [id]);
    connection.release();
    
    return res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'No se puede eliminar este usuario porque tiene registros asociados' 
      });
    }
    
    return res.status(500).json({ error: 'Error del servidor al eliminar usuario' });
  }
};

export const toggleUserActive = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  if (is_active === undefined) {
    return res.status(400).json({ error: 'Se requiere el estado is_active' });
  }
  
  try {
    const connection = await pool.getConnection();
    
    // Verificar si el usuario existe
    const [users] = await connection.query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No permitir desactivar administradores
    const user = users[0];
    if (user.role === 'admin' && !is_active) {
      connection.release();
      return res.status(403).json({ error: 'No se puede desactivar una cuenta de administrador' });
    }
    
    // Actualizar el estado del usuario
    await connection.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );
    
    // Obtener el usuario actualizado
    const [updatedUsers] = await connection.query(
      'SELECT id, name, username, email, role, is_active, created_at as createdAt, membership_date, phone, dni, avatar_url, balance FROM users WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    const updatedUser = updatedUsers[0];
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(`Error al cambiar estado del usuario ${id}:`, error);
    return res.status(500).json({ error: 'Error del servidor al actualizar usuario' });
  }
};
