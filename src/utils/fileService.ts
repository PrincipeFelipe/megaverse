/**
 * Utilidades para el manejo de archivos en el frontend
 */

/**
 * Descarga un blob como un archivo con el nombre especificado
 * @param blob - El blob a descargar
 * @param fileName - El nombre del archivo
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Obtiene la extensión de un nombre de archivo
 * @param filename - El nombre del archivo
 * @returns La extensión del archivo
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Verifica si un archivo es una imagen basado en su tipo MIME
 * @param mimeType - El tipo MIME del archivo
 * @returns true si es una imagen, false en caso contrario
 */
export const isImage = (mimeType: string | undefined): boolean => {
  return !!mimeType && mimeType.startsWith('image/');
};

/**
 * Verifica si un archivo es un PDF basado en su tipo MIME
 * @param mimeType - El tipo MIME del archivo
 * @returns true si es un PDF, false en caso contrario
 */
export const isPDF = (mimeType: string | undefined): boolean => {
  return mimeType === 'application/pdf';
};

/**
 * Obtiene un icono adecuado para el tipo de archivo
 * @param mimeType - El tipo MIME del archivo
 * @returns Nombre de la clase CSS del icono
 */
export const getFileIcon = (mimeType: string | undefined): string => {
  if (isImage(mimeType)) return 'file-image';
  if (isPDF(mimeType)) return 'file-pdf';
  if (mimeType?.includes('word')) return 'file-word';
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'file-excel';
  if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'file-powerpoint';
  if (mimeType?.includes('audio')) return 'file-audio';
  if (mimeType?.includes('video')) return 'file-video';
  if (mimeType?.includes('zip') || mimeType?.includes('compressed')) return 'file-archive';
  return 'file';
};

const fileService = {
  downloadBlob,
  formatFileSize,
  getFileExtension,
  isImage,
  isPDF,
  getFileIcon
};

export default fileService;
