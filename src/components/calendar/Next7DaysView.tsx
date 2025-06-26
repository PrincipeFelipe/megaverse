import { Navigate } from 'react-big-calendar';

// Vista personalizada que muestra 7 días comenzando desde el día actual
const Next7DaysView = {
  // Nombre visible de esta vista en los botones
  title: 'Próximos 7 días',
  
  // Esta función determina qué fechas se deben mostrar
  range: (_date: Date) => {
    // Siempre mostrar desde hoy, independientemente de la fecha proporcionada
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(today.getDate() + 6); // 6 días adicionales después de hoy
    
    return { start, end };
  },
  
  // Control de navegación cuando se hace clic en "siguiente" o "anterior"
  navigate: (date: Date, action: string) => {
    const newDate = new Date(date);
    
    switch (action) {
      case Navigate.NEXT:
        // Si se hace clic en "siguiente", avanzar 7 días
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
        
      case Navigate.PREVIOUS:
        // Si se hace clic en "anterior", retroceder 7 días
        newDate.setDate(newDate.getDate() - 7);
        return newDate;
        
      case Navigate.TODAY:
      default:
        // Ir a hoy siempre muestra los próximos 7 días desde hoy
        return new Date();
    }
  },
  
  // Definir la vista de detalle al hacer clic en un día
  getDrilldownView: () => {
    return 'day';
  },

  // Tipo de vista personalizada (diferente de 'week' para evitar conflictos)
  type: 'next7Days',
};

export default Next7DaysView;
