/**
 * Script para verificar la configuración actual de reservas
 */

import { pool } from '../config/database.js';

const checkReservationConfig = async () => {
  try {
    console.log('Verificando configuración actual de reservas...');
    const connection = await pool.getConnection();
    
    // Consultar todos los campos de la configuración
    const [configResult] = await connection.query('SELECT * FROM reservation_config WHERE id = 1');
    
    if (configResult.length === 0) {
      console.log('No se encontró ninguna configuración. Creando configuración por defecto...');
      return;
    }
    
    const config = configResult[0];
    console.log('Configuración actual:');
    console.log(JSON.stringify(config, null, 2));
    
    // Verificar específicamente los campos relevantes
    console.log('\nDetalles de los campos críticos:');
    console.log(`allow_consecutive_reservations: ${config.allow_consecutive_reservations} (tipo: ${typeof config.allow_consecutive_reservations})`);
    console.log(`min_time_between_reservations: ${config.min_time_between_reservations} (tipo: ${typeof config.min_time_between_reservations})`);
    
    // Verificar cómo se evalúa el campo booleano
    console.log('\nEvaluación booleana:');
    console.log(`!config.allow_consecutive_reservations = ${!config.allow_consecutive_reservations}`);
    console.log(`Boolean(config.allow_consecutive_reservations) = ${Boolean(config.allow_consecutive_reservations)}`);
    console.log(`config.allow_consecutive_reservations === 1 = ${config.allow_consecutive_reservations === 1}`);
    console.log(`config.allow_consecutive_reservations == true = ${config.allow_consecutive_reservations == true}`);
    
    // Actualizar el valor para probar
    console.log('\nActualizando el valor a 0 para probar...');
    await connection.query('UPDATE reservation_config SET allow_consecutive_reservations = 0 WHERE id = 1');
    
    // Consultar de nuevo después de la actualización
    const [updatedConfig] = await connection.query('SELECT allow_consecutive_reservations FROM reservation_config WHERE id = 1');
    console.log('Valor actualizado:', updatedConfig[0].allow_consecutive_reservations);
    console.log(`!updatedConfig[0].allow_consecutive_reservations = ${!updatedConfig[0].allow_consecutive_reservations}`);
    
    connection.release();
  } catch (error) {
    console.error('Error al verificar la configuración:', error);
  } finally {
    process.exit(); // Salir después de ejecutar
  }
};

// Ejecutar la función
checkReservationConfig();
