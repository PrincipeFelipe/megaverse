# Solución para problemas de zonas horarias en reservas

El sistema de reservas ha sido actualizado para manejar correctamente las zonas horarias. Este documento explica el problema y cómo se ha solucionado.

**Actualización**: Se ha implementado `react-big-calendar` para mejorar aún más el manejo de zonas horarias y la experiencia de usuario. Consulta [react-big-calendar.md](./react-big-calendar.md) para más detalles sobre esta implementación.

**Actualización (14 de junio de 2025)**: Se ha solucionado un problema adicional donde las horas se mostraban incorrectamente en el calendario (con 2 horas de diferencia). Ver la sección "Corrección adicional de visualización" abajo.

**Actualización (15 de junio de 2025)**: Se ha mejorado la solución para manejar automáticamente los cambios entre horario de verano e invierno, detectando si se debe aplicar un offset de +1 (CET) o +2 (CEST) horas.

## Descripción del problema

Cuando un usuario seleccionaba una hora local (por ejemplo, 09:00) y una duración (por ejemplo, 3 horas) para una reserva, el sistema creaba la reserva con horas incorrectas debido a la conversión entre hora local y UTC.

Ejemplo:
- Usuario selecciona: 09:00 - 12:00 (hora local)
- Sistema guardaba: 07:00 - 10:00 (hora UTC)
- Al mostrar las reservas, aparecían en la franja horaria incorrecta

Este problema ocurría porque JavaScript convierte automáticamente las fechas a UTC al usar `toISOString()` para la comunicación con el servidor.

## Solución implementada

Se ha implementado una solución que preserva la hora visual seleccionada por el usuario en todo momento:

1. Nuevas utilidades de fecha en el cliente:
   - `preserveLocalTime()`: Convierte una fecha local a ISO manteniendo la misma hora visual
   - `extractLocalTime()`: Extrae la hora visual de una fecha ISO

2. Nuevas utilidades de fecha en el servidor:
   - Registro detallado de fechas para depuración
   - Verificación de formatos ISO válidos

3. Script de corrección:
   - Se ha creado `fixReservationTimeZones.js` para corregir las reservas existentes

4. Mejora en la experiencia de usuario:
   - Implementación de selección directa de rangos de tiempo en el calendario
   - Eliminación del selector de duración en horas, ahora se calcula automáticamente
   - Visualización de las horas de inicio y fin directamente en el calendario

## Corrección adicional de visualización (14 de junio de 2025)

Se identificó un problema adicional donde las reservas aparecían con una diferencia de 2 horas en el calendario:
- Ejemplo: Una reserva de 13:00 a 16:00 se mostraba como 11:00 AM a 2:00 PM

Para solucionarlo:

1. **Primera aproximación**:
   - Se mejoró la función `extractLocalTime()` en el cliente para incluir logs
   - Se actualizó la configuración de moment.js para tratar fechas como locales
   - Se creó el script `correctTimeZoneDisplayError.js` para ajustar fechas en la base de datos

2. **Solución definitiva (15 de junio de 2025)**:
   - Se identificó que el problema persistía a pesar de tener fechas correctas en la base de datos
   - Se modificó la función `extractLocalTime()` para añadir automáticamente el offset correcto según si es horario de verano o invierno:
   ```typescript
   // Determinar el offset de zona horaria para España (CEST durante verano, CET durante invierno)
   const now = new Date();
   const jan = new Date(now.getFullYear(), 0, 1);
   const jul = new Date(now.getFullYear(), 6, 1);
   const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
   const isDST = utcDate.getTimezoneOffset() < stdTimezoneOffset;
   
   // Usar 2 para CEST (verano) o 1 para CET (invierno)
   const hourOffset = isDST ? 2 : 1;
   
   // Crear una nueva fecha con los valores UTC + el offset correspondiente
   const localDate = new Date(
     utcDate.getUTCFullYear(),
     utcDate.getUTCMonth(),
     utcDate.getUTCDate(),
     utcDate.getUTCHours() + hourOffset, // Añadimos el offset dinámico
     utcDate.getUTCMinutes(),
     utcDate.getUTCSeconds()
   );
   ```
   - Se crearon scripts de prueba completos para validar la solución en diferentes escenarios:
     - `hourVisualizationTest.ts`: Prueba básica para verificar la correcta visualización
     - `timezoneValidator.ts`: Script avanzado para validar múltiples escenarios
   - Se mejoró el registro detallado de las horas para facilitar la depuración

## Cómo ejecutar los scripts de corrección

Para corregir las reservas existentes:

```bash
cd server
npm run fix-reservations
```

Para corregir problemas de visualización con diferencia horaria:

```bash
cd server
npm run fix-timezone-display
```

## Ejemplo de uso de las utilidades

```typescript
// Al crear una nueva reserva (cliente)
const startDate = new Date(2023, 5, 15, 9, 0); // 15 de junio a las 9:00
const startTime = preserveLocalTime(startDate); // Preserva la hora visual (9:00)

// Al mostrar una reserva existente (cliente)
const reservationDate = extractLocalTime(reservation.start_time); // Extrae la hora visual (9:00)
const displayTime = format(reservationDate, 'HH:mm'); // Muestra "09:00"
```

## Selección directa de rangos de tiempo

Con la nueva implementación, los usuarios pueden:

1. Hacer clic y arrastrar en el calendario para seleccionar un rango de tiempo (por ejemplo, 9:00 - 12:00)
2. Seleccionar la mesa deseada en el popover que aparece
3. Ver automáticamente calculada la duración en base al rango seleccionado

Esto proporciona una experiencia más visual e intuitiva, eliminando errores potenciales en la selección de horas.
