/**
 * Utilidades para manejar fechas en el servidor
 */

/**
 * Verifica si una fecha está en formato ISO
 * @param {string} str - La cadena a verificar
 * @returns {boolean} - True si es una fecha ISO válida, false en caso contrario
 */
export const isValidISODate = (str) => {
  if (typeof str !== 'string') return false;
  
  try {
    const date = new Date(str);
    return date.toISOString() === str;
  } catch (e) {
    return false;
  }
};

/**
 * Registra información detallada sobre las fechas para depuración
 * @param {string} label - Etiqueta para identificar el log
 * @param {Date|string} date - Fecha a registrar
 */
export const logDateDetails = (label, date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    console.log(`---------- ${label} ----------`);
    console.log(`ISO String: ${dateObj.toISOString()}`);
    console.log(`Local String: ${dateObj.toString()}`);
    console.log(`UTC String: ${dateObj.toUTCString()}`);
    console.log(`Local time: ${dateObj.getHours()}:${dateObj.getMinutes()}:${dateObj.getSeconds()}`);
    console.log(`UTC time: ${dateObj.getUTCHours()}:${dateObj.getUTCMinutes()}:${dateObj.getUTCSeconds()}`);
    console.log(`Timezone offset: ${dateObj.getTimezoneOffset()} minutes`);
    console.log(`--------------------------`);
  } catch (e) {
    console.error(`Error logging date: ${e.message}`);
  }
};
