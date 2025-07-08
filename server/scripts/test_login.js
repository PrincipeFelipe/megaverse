/**
 * Script para probar el login del admin
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';

async function testLogin(email, password) {
  console.log(`🔐 Probando login con: ${email} / ${password}`);
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: email, // Cambio a username
      password: password
    })
  });

  console.log(`Status: ${response.status} ${response.statusText}`);
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ Login exitoso!');
    console.log('Token recibido:', data.token ? 'Sí' : 'No');
    return true;
  } else {
    const errorText = await response.text();
    console.log('❌ Login fallido:', errorText);
    return false;
  }
}

async function main() {
  const passwords = ['admin', 'password', '123456', 'admin123', 'megaverse'];
  
  for (const password of passwords) {
    const success = await testLogin('admin', password); // Usar username en lugar de email
    if (success) {
      console.log(`\n🎉 Contraseña correcta encontrada: ${password}`);
      break;
    }
    console.log('');
  }
}

main();
