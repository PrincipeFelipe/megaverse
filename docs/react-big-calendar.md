# Implementación de react-big-calendar

Para solucionar los problemas de zona horaria en nuestro sistema de reservas, hemos implementado `react-big-calendar`, una biblioteca robusta que ofrece un mejor manejo de zonas horarias y una experiencia de usuario más rica.

## Problema Original

El sistema estaba mostrando incorrectamente las horas de reserva en el calendario:
- Las reservas a las 17:00, 18:00 y 19:00 se mostraban como 15:00, 16:00 y 17:00 respectivamente.
- Esto ocurría porque aunque el backend guardaba correctamente las fechas en UTC, el frontend no convertía adecuadamente estas fechas a la zona horaria local del usuario.

## Solución Implementada

1. **Instalación de Dependencias**:
   - `react-big-calendar`: Biblioteca de calendario avanzada
   - `moment`: Biblioteca para manipulación de fechas y zonas horarias

2. **Componente BigCalendar**:
   - Creación de un componente reutilizable para mostrar el calendario
   - Utiliza `momentLocalizer` para manejar correctamente las zonas horarias
   - Incluye soporte para:
     - Vistas de mes, semana y día
     - Localización en español
     - Visualización personalizada de eventos
     - Selección de rangos de tiempo directamente en el calendario
     - Selector de mesas emergente
     - Estilos personalizados para una mejor experiencia visual

3. **Conversión de Fechas**:
   - Utilizamos la función `extractLocalTime` para mostrar las fechas correctamente en zona horaria local
   - Utilizamos `preserveLocalTime` para guardar en formato ISO manteniendo la hora visual correcta

## Cómo Funciona

El componente `BigCalendar` convierte automáticamente las fechas ISO del servidor a la zona horaria local del navegador, asegurando que las reservas se muestren a las horas correctas (17:00, 18:00, 19:00) independientemente de la zona horaria en la que se encuentre el usuario.

### Personalización

El componente incluye:
- Colores diferentes para tus reservas vs. reservas de otros
- Colores especiales para reservas de todo el día
- Botón de cancelación directamente en los eventos
- Soporte para diferentes vistas de calendario

## Beneficios

1. **Precisión**: Las horas de reserva ahora se muestran correctamente.
2. **Experiencia de Usuario**: Interfaz de calendario más rica y familiar.
3. **Mantenibilidad**: El código es más limpio y sigue buenas prácticas.
4. **Escalabilidad**: Fácil de ampliar con nuevas funciones.

## Consideraciones Futuras

- Añadir vista de recursos para mostrar diferentes mesas en formato de calendario
- Implementar arrastrar y soltar para modificar reservas existentes
- Mejorar la visualización en dispositivos móviles
