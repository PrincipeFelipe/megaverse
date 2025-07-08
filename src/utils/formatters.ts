/**
 * Utilidades para formatear valores en la aplicación
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en el formato español estándar
 * @param date - La fecha a formatear
 * @param includeTime - Si debe incluir la hora
 * @returns La fecha formateada
 */
export const formatDate = (
  date: string | Date, 
  includeTime: boolean = false
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar si es una fecha válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return format(
      dateObj,
      includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy',
      { locale: es }
    );
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error de formato';
  }
};

/**
 * Formatea un precio/cantidad monetaria en euros
 * @param amount - La cantidad a formatear
 * @param includeCurrency - Si debe incluir el símbolo de la moneda (€)
 * @returns La cantidad formateada
 */
export const formatCurrency = (
  amount: number | string | undefined | null, 
  includeCurrency: boolean = true
): string => {
  try {
    // Si es undefined o null, lo tratamos como 0
    if (amount === undefined || amount === null) {
      console.log(`Valor nulo para formatCurrency. Usando 0.`);
      amount = 0;
    }
    
    // Convertir a número si es una cadena
    let numAmount: number;
    
    if (typeof amount === 'string') {
      // Solo reemplazamos comas por puntos (formato europeo a formato americano)
      // pero dejamos los puntos decimales existentes
      const cleanedAmount = amount.replace(/,/g, '.');
      numAmount = parseFloat(cleanedAmount);
    } else {
      numAmount = Number(amount);
    }
    
    // Verificar si el valor es válido (no es NaN, undefined o null)
    if (isNaN(numAmount)) {
      console.log(`Valor inválido para formatCurrency: ${amount}, tipo: ${typeof amount}`);
      numAmount = 0;
    }
    
    const formatter = new Intl.NumberFormat('es-ES', {
      style: includeCurrency ? 'currency' : 'decimal',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(numAmount);
  } catch (error) {
    console.error('Error al formatear moneda:', error, 'Valor:', amount);
    return `${amount || 0}€`;
  }
};

/**
 * Formatea un número con separadores de miles
 * @param number - El número a formatear
 * @param decimals - Número de decimales
 * @returns El número formateado
 */
export const formatNumber = (
  number: number, 
  decimals: number = 0
): string => {
  try {
    const formatter = new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    return formatter.format(number);
  } catch (error) {
    console.error('Error al formatear número:', error);
    return `${number}`;
  }
};

/**
 * Formatea el tamaño de un archivo en bytes a una representación legible
 * @param bytes - El tamaño en bytes
 * @param decimals - El número de decimales a mostrar
 * @returns El tamaño formateado con unidad (KB, MB, etc.)
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formatea una fecha en formato largo para el blog (ej: 15 de enero de 2023)
 * @param date - La fecha a formatear
 * @returns La fecha formateada en formato largo
 */
export const formatLongDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar si es una fecha válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error de formato';
  }
};

/**
 * Formatea una fecha para mostrar fecha y hora completa
 * @param date - La fecha a formatear
 * @returns La fecha formateada con fecha y hora completa
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar si es una fecha válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return format(dateObj, "dd/MM/yyyy HH:mm:ss", { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha y hora:', error);
    return 'Error de formato';
  }
};
