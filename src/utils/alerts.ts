/**
 * Utilidades para mostrar alertas y confirmaciones utilizando SweetAlert2
 * Estilos personalizados para coincidir con el diseño de la aplicación
 */
import Swal from 'sweetalert2';

// Detectamos si está en modo oscuro
const prefersDarkMode = () => {
  return document.documentElement.classList.contains('dark') || 
         (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
};

// Tema predeterminado para todas las alertas
const defaultTheme = {
  // Colores de botones basados en los colores de la aplicación
  confirmButtonColor: '#0da6d2', // Color primario (primary-500)
  cancelButtonColor: '#232a43', // Color oscuro (dark-700)
  iconColor: '#0da6d2', // Color primario para íconos
  // Estilos personalizados de CSS para hacer los modales acordes al diseño de la app
  customClass: {
    popup: 'swal-custom-popup',
    title: 'swal-custom-title',
    htmlContainer: 'swal-custom-content',
    confirmButton: 'swal-custom-confirm',
    cancelButton: 'swal-custom-cancel',
    actions: 'swal-custom-actions',
  },
  // Añadimos estilos CSS personalizados
  backdrop: `rgba(13, 16, 25, 0.4)`, // Fondo semi-transparente más oscuro
  buttonsStyling: true, // Mantener estilos de botones de SweetAlert2
  showClass: {
    popup: 'animate__animated animate__fadeIn animate__faster' // Animación suave
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOut animate__faster' // Animación suave
  },
  // Configuración para mejorar la visibilidad de los botones
  allowOutsideClick: false, // Evita clics fuera del modal que podrían cerrarlo
  focusConfirm: true, // Enfoca el botón de confirmación al abrir
  showConfirmButton: true, // Asegura que siempre se muestre el botón de confirmación
};

// Añadimos los estilos CSS personalizados al documento
const style = document.createElement('style');
style.textContent = `
  /* Estilos personalizados para SweetAlert2 que coinciden con nuestra aplicación */
  .swal-custom-popup {
    border-radius: 0.75rem !important;
    padding: 1.5rem !important;
    background-color: ${prefersDarkMode() ? '#1a1f32' : '#ffffff'} !important;
    color: ${prefersDarkMode() ? '#f3f4f6' : '#232a43'} !important;
    box-shadow: 0 10px 25px -5px rgba(13, 16, 25, 0.2) !important;
  }
  
  .swal-custom-title {
    font-family: 'Inter', system-ui, sans-serif !important;
    font-weight: 600 !important;
    color: ${prefersDarkMode() ? '#f3f4f6' : '#0d1019'} !important;
  }
  
  .swal-custom-content {
    font-family: 'Inter', system-ui, sans-serif !important;
    color: ${prefersDarkMode() ? '#d2d6df' : '#3a456a'} !important;
  }
  
  .swal-custom-confirm, .swal-custom-cancel {
    border-radius: 0.5rem !important;
    font-weight: 500 !important;
    padding: 0.5rem 1rem !important;
    transition: transform 0.2s !important;
  }
  
  .swal-custom-confirm:hover, .swal-custom-cancel:hover {
    transform: scale(1.05) !important;
  }
  
  .swal-custom-confirm:active, .swal-custom-cancel:active {
    transform: scale(0.95) !important;
  }
  
  .swal-custom-actions {
    gap: 0.5rem !important;
    position: relative !important;
    z-index: 10000 !important;
    display: flex !important;
    justify-content: center !important;
    margin-top: 1rem !important;
  }
  
  /* Ajustamos los colores de los iconos para que coincidan con los de la app */
  .swal2-success-circular-line-left, .swal2-success-circular-line-right, .swal2-success-fix {
    background-color: transparent !important;
  }
    /* Asegurarnos de que los botones siempre sean visibles y clickeables */
  .swal2-actions {
    position: relative !important;
    z-index: 10000 !important;
    display: flex !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    visibility: visible !important;
    margin-top: 1.5em !important;
  }
  
  .swal2-confirm, .swal2-cancel {
    opacity: 1 !important;
    pointer-events: auto !important;
    visibility: visible !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  /* Prevenir que el spinner oculte el botón */
  .swal2-loader {
    display: none !important;
  }
  
  /* Tema oscuro dinámico */
  @media (prefers-color-scheme: dark) {
    .swal-custom-popup {
      background-color: #1a1f32 !important;
      color: #f3f4f6 !important;
    }
    
    .swal-custom-title {
      color: #f3f4f6 !important;
    }
    
    .swal-custom-content {
      color: #d2d6df !important;
    }
  }
`;
document.head.appendChild(style);

// Observamos cambios en el modo oscuro y actualizamos los estilos
if (typeof window !== 'undefined') {
  const darkModeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' && 
          mutation.target === document.documentElement) {
        // Actualizamos los estilos cuando cambia el tema
        const isDark = document.documentElement.classList.contains('dark');
        defaultTheme.customClass.popup = isDark ? 'swal-custom-popup dark' : 'swal-custom-popup';
      }
    });
  });
  
  darkModeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// Toast para notificaciones pequeñas
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    background: prefersDarkMode() ? '#1a1f32' : '#ffffff',
    iconColor: getIconColor(icon),
    customClass: {
      popup: 'swal-custom-toast',
      title: 'swal-custom-toast-title'
    }
  });

  // Añadimos estilos específicos para el toast
  const toastStyle = document.createElement('style');
  toastStyle.id = 'swal-toast-custom-style';
  toastStyle.textContent = `
    .swal-custom-toast {
      padding: 0.75rem !important;
      border-radius: 0.5rem !important;
      box-shadow: 0 10px 15px -3px rgba(13, 16, 25, 0.2) !important;
      border-left: 3px solid ${getAccentColor(icon)} !important;
      color: ${prefersDarkMode() ? '#f3f4f6' : '#232a43'} !important;
    }
    
    .swal-custom-toast-title {
      font-size: 0.9rem !important;
      font-family: 'Inter', system-ui, sans-serif !important;
      color: ${prefersDarkMode() ? '#f3f4f6' : '#3a456a'} !important;
    }
    
    .swal-custom-toast .swal2-timer-progress-bar {
      background-color: ${getAccentColor(icon)} !important;
      opacity: 0.6;
    }
  `;
  
  if (!document.getElementById('swal-toast-custom-style')) {
    document.head.appendChild(toastStyle);
  }

  Toast.fire({
    icon,
    title
  });
};

// Función para obtener el color del icono según su tipo
function getIconColor(icon: 'success' | 'error' | 'warning' | 'info' | 'question'): string {
  switch (icon) {
    case 'success': return '#10b981'; // verde
    case 'error': return '#ef4444'; // rojo
    case 'warning': return '#f59e0b'; // ámbar
    case 'info': return '#0da6d2'; // primario
    case 'question': return '#8b5cf6'; // violeta
    default: return '#0da6d2'; // primario por defecto
  }
}

// Función para obtener el color de acento según el tipo de icono
function getAccentColor(icon: 'success' | 'error' | 'warning' | 'info' | 'question'): string {
  return getIconColor(icon);
}

// Alerta simple de información
export const showAlert = (title: string, message?: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info') => {
  // Crear una copia del tema por defecto para evitar conflictos
  const alertTheme = {
    ...defaultTheme,
    // Garantizar la visibilidad de los botones
    showConfirmButton: true,
    confirmButtonText: 'Aceptar',
    heightAuto: false,
    // NO mostrar el spinner de carga para alertas normales
    showLoaderOnConfirm: false
  };
  
  // Cerrar cualquier alerta existente primero para evitar conflictos
  Swal.close();
  
  // Pequeño retraso para asegurar que las alertas anteriores se han cerrado completamente
  return new Promise((resolve) => {
    setTimeout(() => {
      Swal.fire({
        title,
        text: message,
        icon,
        ...alertTheme,
        // Manejar la apertura del modal para garantizar que los botones estén visibles
        willOpen: () => {
          // Remover cualquier spinner existente que pueda bloquear la visibilidad
          document.querySelectorAll('.swal2-timer-progress-bar').forEach(el => el.remove());
          
          // Eliminar estilos inline que puedan estar causando problemas
          const sweetContainer = document.querySelector('.swal2-container');
          if (sweetContainer instanceof HTMLElement) {
            sweetContainer.style.removeProperty('padding');
          }
          
          // Asegurarse de que no aparezca el spinner
          const iconContainer = document.querySelector('.swal2-icon');
          if (iconContainer instanceof HTMLElement) {
            iconContainer.classList.add(`swal2-icon-${icon}`);
          }
        },
        didOpen: (modal: HTMLElement) => {
          // Ocultar cualquier spinner de carga
          const loader = modal.querySelector('.swal2-loader') as HTMLElement;
          if (loader) {
            loader.style.display = 'none';
          }
          
          // Forzar la visibilidad de las acciones y botones inmediatamente
          const actionsElement = modal.querySelector('.swal2-actions') as HTMLElement;
          if (actionsElement) {
            actionsElement.style.zIndex = '10000';
            actionsElement.style.position = 'relative';
            actionsElement.style.display = 'flex';
            actionsElement.style.opacity = '1';
            actionsElement.style.visibility = 'visible';
            actionsElement.style.margin = '1.5em auto 0';
          }
          
          // Asegurar que el botón de confirmación sea visible e interactuable
          const confirmButton = modal.querySelector('.swal2-confirm') as HTMLElement;
          if (confirmButton) {
            confirmButton.style.opacity = '1';
            confirmButton.style.pointerEvents = 'auto';
            confirmButton.style.display = 'inline-block';
            confirmButton.style.visibility = 'visible';
            
            // Forzar un reflow del DOM para garantizar los cambios
            void confirmButton.offsetWidth;
            
            // Asegurar que el botón sea clickeable
            confirmButton.addEventListener('click', () => {
              Swal.close();
            });
          }
        }
      }).then(resolve);
    }, 100);
  });
};

// Alertas de éxito, error y advertencia
export const showSuccess = (title: string, message?: string) => showAlert(title, message, 'success');
export const showError = (title: string, message?: string) => showAlert(title, message, 'error');
export const showWarning = (title: string, message?: string) => showAlert(title, message, 'warning');

// Diálogo de confirmación
export const showConfirm = async (title: string, message: string, confirmText = 'Confirmar', cancelText = 'Cancelar', icon: 'warning' | 'question' = 'question'): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text: message,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    ...defaultTheme
  });
  
  return result.isConfirmed;
};

// Diálogo de confirmación para acciones peligrosas (con énfasis en advertencia)
export const showDangerConfirm = async (title: string, message: string, confirmText = 'Eliminar', cancelText = 'Cancelar'): Promise<boolean> => {
  // Combinamos los estilos predeterminados con los específicos para acciones peligrosas
  const dangerTheme = {
    ...defaultTheme,
    confirmButtonColor: '#ef4444', // Color rojo para advertir sobre acción peligrosa
  };
  
  // Estilos específicos para diálogos de peligro, manteniendo la consistencia visual
  const result = await Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: true, // El botón de cancelar está enfocado por defecto para evitar clicks accidentales
    ...dangerTheme,
    customClass: {
      ...defaultTheme.customClass,
      popup: `swal-custom-popup swal-custom-danger ${prefersDarkMode() ? 'dark' : ''}`,
      confirmButton: 'swal-custom-confirm swal-danger-confirm',
      cancelButton: 'swal-custom-cancel swal-danger-cancel',
    }
  });
  
  // Agregamos estilos específicos para el diálogo de peligro
  const dangerStyle = document.createElement('style');
  dangerStyle.id = 'swal-danger-custom-style';
  dangerStyle.textContent = `
    .swal-custom-danger {
      border-left: 4px solid #ef4444 !important;
    }
    
    .swal-danger-confirm {
      background-color: #ef4444 !important;
      color: white !important;
    }
    
    .swal-danger-confirm:hover {
      background-color: #dc2626 !important;
    }
    
    .swal-danger-cancel:hover {
      background-color: ${prefersDarkMode() ? '#3a456a' : '#f3f4f6'} !important;
    }
  `;
  
  if (!document.getElementById('swal-danger-custom-style')) {
    document.head.appendChild(dangerStyle);
  }
  
  return result.isConfirmed;
};

// Diálogo con información detallada
export const showDetailedInfo = async (title: string, htmlContent: string): Promise<void> => {
  await Swal.fire({
    title,
    html: htmlContent,
    icon: 'info',
    ...defaultTheme
  });
};

// Función para mostrar un mensaje mientras se espera a que se complete una operación
export const showLoading = (title: string = 'Cargando...') => {
  Swal.fire({
    title,
    didOpen: () => {
      Swal.showLoading();
    },
    allowEscapeKey: false,
    // Usar nuestro tema personalizado
    ...defaultTheme,
    customClass: {
      ...defaultTheme.customClass,
      popup: 'swal-custom-popup swal-custom-loading'
    }
  });
  
  // Añadimos estilos específicos para el loader
  const loadingStyle = document.createElement('style');
  loadingStyle.id = 'swal-loading-custom-style';
  loadingStyle.textContent = `
    .swal-custom-loading {
      background-color: ${prefersDarkMode() ? 'rgba(26, 31, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
      backdrop-filter: blur(4px);
    }
    
    .swal2-loader {
      border-color: #0da6d2 transparent #0da6d2 transparent !important;
    }
  `;
  
  if (!document.getElementById('swal-loading-custom-style')) {
    document.head.appendChild(loadingStyle);
  }
};

// Cerrar el mensaje de carga
export const closeLoading = () => {
  Swal.close();
};
