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
    return !isNaN(date.getTime()) && date.toISOString() === str;
  } catch (e) {
    return false;
  }
};

/**
 * Verifica si una fecha es válida
 * @param {string|Date} date - La fecha a verificar
 * @returns {boolean} - True si es una fecha válida, false en caso contrario
 */
export const isValidDate = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch (e) {
    return false;
  }
};

/**
 * Intenta parsear una fecha de forma segura
 * @param {any} value - El valor a parsear como fecha
 * @returns {Date|null} - La fecha parseada o null si es inválida
 */
export const safeParseDate = (value) => {
  if (!value) return null;
  
  try {
    // Si ya es una fecha, devolver directamente
    if (value instanceof Date) {
      return isValidDate(value) ? value : null;
    }
    
    // Convertir a string si es necesario
    const dateStr = String(value);
    const date = new Date(dateStr);
    
    return isValidDate(date) ? date : null;
  } catch (e) {
    console.error(`Error parsing date ${value}:`, e);
    return null;
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
    
    if (!isValidDate(dateObj)) {
      console.log(`---------- ${label} ----------`);
      console.log(`FECHA INVÁLIDA: ${date}`);
      console.log(`--------------------------`);
      return;
    }
    
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
