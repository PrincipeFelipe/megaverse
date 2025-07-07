/**
 * Script para probar la validación de reservas consecutivas
 * Este script intenta crear dos reservas consecutivas para verificar que
 * la validación funciona correctamente
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
config({ path: path.join(__dirname, '../.env') });

// URL base de la API
const API_URL = 'http://localhost:8090/api';

// Credenciales de prueba (reemplazar con un usuario válido)
const credentials = {
  email: 'admin@example.com',  // ¡Cambiar por un usuario válido!
  password: 'adminpassword'    // ¡Cambiar por la contraseña correcta!
};

async function login() {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Error en login: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Login exitoso');
    return data.token;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    process.exit(1);
  }
}

async function createReservation(token, startTime, endTime, tableId) {
  try {
    // Crear una reserva
    const response = await fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tableId,
        startTime,
        endTime,
        durationHours: (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60),
        numMembers: 1,
        numGuests: 0,
        allDay: false,
        reason: 'Prueba de reservas consecutivas'
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`⚠️ La reserva no fue aceptada: ${data.error || 'Error desconocido'}`);
      return null;
    }

    console.log(`✅ Reserva creada correctamente: ID ${data.id}`);
    return data;
  } catch (error) {
    console.error('❌ Error al crear reserva:', error.message);
    return null;
  }
}

async function getConfig(token) {
  try {
    const response = await fetch(`${API_URL}/config/reservation`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener configuración: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Configuración actual:');
    console.log(`- allow_consecutive_reservations: ${data.config.allow_consecutive_reservations}`);
    console.log(`- min_time_between_reservations: ${data.config.min_time_between_reservations}`);
    
    return data.config;
  } catch (error) {
    console.error('❌ Error al obtener configuración:', error.message);
    return null;
  }
}

async function deleteReservation(token, id) {
  try {
    const response = await fetch(`${API_URL}/reservations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar reserva: ${response.status} ${response.statusText}`);
    }

    console.log(`✅ Reserva ${id} eliminada correctamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar reserva ${id}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    // Login para obtener token
    const token = await login();
    
    // Verificar configuración actual
    const config = await getConfig(token);
    if (!config) {
      console.error('❌ No se pudo obtener la configuración. Abortando prueba.');
      return;
    }
    
    // Definir horarios para las reservas consecutivas
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM
    
    const startTime1 = new Date(tomorrow);
    const endTime1 = new Date(tomorrow);
    endTime1.setHours(12, 0, 0, 0); // 12:00 PM
    
    const startTime2 = new Date(endTime1); // Exactamente cuando termina la primera
    const endTime2 = new Date(startTime2);
    endTime2.setHours(14, 0, 0, 0); // 14:00 PM

    // IDs para limpiar después
    let firstReservationId = null;
    let secondReservationId = null;

    try {
      console.log('\n===== PRUEBA DE RESERVAS CONSECUTIVAS =====');
      console.log(`Prueba 1: ${startTime1.toISOString()} - ${endTime1.toISOString()}`);
      console.log(`Prueba 2: ${startTime2.toISOString()} - ${endTime2.toISOString()}`);
      console.log('Estas reservas son consecutivas (end1 === start2)');
      
      // Crear primera reserva
      console.log('\n>> Creando primera reserva...');
      const firstReservation = await createReservation(
        token, 
        startTime1.toISOString(), 
        endTime1.toISOString(), 
        1 // Usar ID de mesa válido
      );
      
      if (firstReservation) {
        firstReservationId = firstReservation.id;
        
        // Intentar crear reserva consecutiva
        console.log('\n>> Intentando crear reserva consecutiva...');
        const secondReservation = await createReservation(
          token, 
          startTime2.toISOString(), 
          endTime2.toISOString(), 
          1 // Misma mesa
        );
        
        if (secondReservation) {
          secondReservationId = secondReservation.id;
          console.log('\n⚠️ ¡PRUEBA FALLIDA! Se permitió crear reservas consecutivas cuando no debería');
        } else {
          if (!config.allow_consecutive_reservations) {
            console.log('\n✅ PRUEBA EXITOSA: Se bloqueó correctamente la reserva consecutiva');
          } else {
            console.log('\n⚠️ La reserva consecutiva fue bloqueada a pesar de que allow_consecutive_reservations=1');
          }
        }
      } else {
        console.log('❌ No se pudo crear la primera reserva. Abortando prueba.');
      }
    } finally {
      // Limpiar las reservas creadas
      console.log('\n>> Limpiando reservas de prueba...');
      if (firstReservationId) {
        await deleteReservation(token, firstReservationId);
      }
      if (secondReservationId) {
        await deleteReservation(token, secondReservationId);
      }
    }
    
  } catch (error) {
    console.error('Error general en la prueba:', error);
  }
}

main().catch(console.error);
