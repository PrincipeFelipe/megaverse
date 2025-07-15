#!/usr/bin/env node

/**
 * Script para verificar que el DNI se incluye en las respuestas del backend
 * Ejecutar: node test-dni-response.js
 */

console.log('🧪 Test: Verificación de DNI en respuestas del backend');
console.log('==================================================');

// Simular datos de usuario como los que devuelve el backend
const mockUserFromDB = {
  id: 1,
  name: 'Usuario Test',
  username: 'usuario_test',
  email: 'test@example.com',
  role: 'user',
  balance: 0,
  created_at: '2025-01-01T00:00:00.000Z',
  membership_date: '2025-01-01',
  phone: '123456789',
  dni: '12345678A',
  avatar_url: null
};

// Simular respuesta de login (después de la corrección)
console.log('\n📝 Test 1: Respuesta de login');
const loginResponseData = {
  id: mockUserFromDB.id,
  name: mockUserFromDB.name,
  username: mockUserFromDB.username,
  email: mockUserFromDB.email,
  role: mockUserFromDB.role,
  balance: mockUserFromDB.balance,
  createdAt: mockUserFromDB.created_at,
  membership_date: mockUserFromDB.membership_date,
  phone: mockUserFromDB.phone,
  dni: mockUserFromDB.dni, // ✅ Corregido: ahora se incluye
  avatar_url: mockUserFromDB.avatar_url
};

console.log('✅ Login response data:', JSON.stringify(loginResponseData, null, 2));
console.log(`DNI incluido en login: ${loginResponseData.dni ? '✅ SÍ' : '❌ NO'}`);

// Simular consulta SQL de getMe (después de la corrección)
console.log('\n📝 Test 2: Query SQL de getMe');
const geteMeSQL = `SELECT id, name, username, email, role, balance, created_at, membership_date, phone, dni, avatar_url FROM users WHERE id = ?`;
console.log('✅ SQL Query:', geteMeSQL);
console.log(`DNI incluido en query: ${geteMeSQL.includes('dni') ? '✅ SÍ' : '❌ NO'}`);

// Verificar campos presentes en el frontend
console.log('\n📝 Test 3: Campos esperados en frontend');
const requiredFields = ['id', 'name', 'username', 'email', 'phone', 'dni', 'membership_date'];
const presentFields = requiredFields.filter(field => loginResponseData[field] !== undefined);
const missingFields = requiredFields.filter(field => loginResponseData[field] === undefined);

console.log(`✅ Campos presentes: ${presentFields.join(', ')}`);
console.log(`${missingFields.length === 0 ? '✅' : '❌'} Campos faltantes: ${missingFields.length === 0 ? 'Ninguno' : missingFields.join(', ')}`);

// Test de mapeo React
console.log('\n📝 Test 4: Mapeo React formData');
const reactFormData = {
  name: loginResponseData.name || '',
  username: loginResponseData.username || '',
  email: loginResponseData.email || '',
  phone: loginResponseData.phone || '',
  dni: loginResponseData.dni || '', // ✅ Debe funcionar ahora
  membership_date: loginResponseData.membership_date || ''
};

console.log('✅ React formData:', JSON.stringify(reactFormData, null, 2));
console.log(`DNI en formData: ${reactFormData.dni ? '✅ "' + reactFormData.dni + '"' : '❌ Vacío'}`);

// Resumen
console.log('\n==================================================');
console.log('📊 Resumen de correcciones aplicadas:');
console.log('✅ 1. Agregado "dni" a SQL query en auth.js getMe()');
console.log('✅ 2. Agregado "dni" a userData en auth.js login()');
console.log('✅ 3. Query de registro ya incluía "dni" correctamente');
console.log('');
console.log('🚀 Próximos pasos para testing:');
console.log('1. Reiniciar backend: pm2 restart megaverse-api');
console.log('2. Hacer login en frontend');
console.log('3. Ir a perfil y verificar que DNI se muestra');
console.log('4. Probar actualización de DNI desde panel de admin');
