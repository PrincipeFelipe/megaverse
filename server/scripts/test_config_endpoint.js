/**
 * Script simple para probar el endpoint de configuración
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8090/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function testConfigEndpoint() {
  // 1. Login
  console.log('🔐 Haciendo login...');
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const { token } = await loginResponse.json();
  console.log('✅ Login exitoso');

  // 2. Probar endpoint de configuración
  console.log('📋 Probando endpoint de configuración...');
  const configResponse = await fetch(`${BASE_URL}/config/reservation`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log(`Status: ${configResponse.status} ${configResponse.statusText}`);

  if (configResponse.ok) {
    const config = await configResponse.json();
    console.log('✅ Configuración obtenida:', config);
  } else {
    const error = await configResponse.text();
    console.log('❌ Error:', error);
  }
}

testConfigEndpoint().catch(console.error);
