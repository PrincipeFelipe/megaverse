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
  amount: number, 
  includeCurrency: boolean = true
): string => {
  try {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: includeCurrency ? 'currency' : 'decimal',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error('Error al formatear moneda:', error);
    return `${amount}`;
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
