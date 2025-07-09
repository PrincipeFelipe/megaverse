// Utilidades para manejar avatares

/**
 * Obtiene la URL completa del avatar basado en la ruta almacenada
 * @param avatarPath Ruta del avatar almacenada en la base de datos
 * @param defaultValue Valor por defecto si no hay avatar
 * @param forceRefresh Si es true, añade un timestamp para evitar caché
 * @returns URL completa del avatar o el valor por defecto
 */
export const getAvatarUrl = (
  avatarPath: string | undefined | null,
  defaultValue: string | null | undefined = undefined,
  forceRefresh: boolean = false
): string | null | undefined => {
  if (!avatarPath) return defaultValue;

  // Si ya es una URL completa, devolverla
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    // Añadir timestamp si se requiere refresh
    if (forceRefresh) {
      const separator = avatarPath.includes('?') ? '&' : '?';
      return `${avatarPath}${separator}_t=${Date.now()}`;
    }
    return avatarPath;
  }

  // Obtener la URL base de la API
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8090";
  
  // El problema es que a veces la ruta de avatar incluye incorrectamente "/api/"
  
  // Identificar todos los posibles casos problemáticos
  console.log(`Procesando ruta de avatar: ${avatarPath}`);
  
  let finalPath = avatarPath;
  
  // 1. Eliminar "/api/" si existe en la ruta, ya que los archivos estáticos 
  // se sirven desde la raíz del servidor, no desde la ruta de la API
  if (finalPath.includes("/api/")) {
    finalPath = finalPath.replace(/\/api\//g, "/");
    console.log(`  Eliminado /api/ de la ruta: ${finalPath}`);
  }
  
  // 2. Si la ruta no incluye /uploads/ pero incluye /avatars/, añadir /uploads al principio
  if (!finalPath.includes("/uploads/") && finalPath.includes("/avatars/")) {
    finalPath = `/uploads${finalPath}`;
    console.log(`  Añadido /uploads al inicio: ${finalPath}`);
  }
  
  // Construir la URL final y asegurarse de que no haya barras dobles
  let fullUrl = `${API_URL}${finalPath}`.replace(/([^:])\/\//g, "$1/");
  
  // Añadir timestamp si se requiere refresh
  if (forceRefresh) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}_t=${Date.now()}`;
    console.log(`Avatar con timestamp para evitar caché: ${fullUrl}`);
  }
  
  console.log(`Avatar: ruta original [${avatarPath}] -> URL final [${fullUrl}]`);
  
  // Devolver la URL completa
  return fullUrl;
};

/**
 * Componente de error para mostrar cuando falla la carga de un avatar
 * @param element Elemento DOM de la imagen que falló
 */
export const handleAvatarError = (element: HTMLImageElement): void => {
  console.error(`Error al cargar avatar desde URL: ${element.src}`);
  
  // Ocultar la imagen que falló
  element.style.display = "none";
  
  // Obtener el contenedor padre
  const parent = element.parentElement;
  if (!parent) return;
  
  // Añadir la clase para el placeholder
  parent.classList.add("avatar-placeholder");
  
  // Crear el icono de fallback
  const icon = document.createElement("div");
  icon.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"w-4 h-4 text-gray-400\"><path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"></path><circle cx=\"12\" cy=\"7\" r=\"4\"></circle></svg>";
  
  // Añadir el icono al contenedor
  parent.appendChild(icon);
};
