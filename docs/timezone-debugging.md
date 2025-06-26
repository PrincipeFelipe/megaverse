# Guía de Depuración de Problemas de Zona Horaria

Este documento proporciona una guía para desarrolladores sobre cómo depurar y solucionar problemas relacionados con las zonas horarias en el sistema de reservas.

## Problema Común: Diferencia de Horas en la Visualización

Si notas que las reservas se muestran con una diferencia horaria en el calendario (por ejemplo, una reserva de 13:00 a 16:00 se muestra como 11:00 a 14:00), es posible que estés experimentando un problema de conversión entre zonas horarias.

> **NOTA IMPORTANTE (15 de junio de 2025)**: Hemos implementado una corrección definitiva para este problema que añade automáticamente el offset correcto (1 o 2 horas) en la función `extractLocalTime` según si es horario de verano o invierno. Si continúas experimentando problemas después de esta fecha, asegúrate de que estás usando la última versión de la aplicación.

## Herramientas de Depuración

### 1. Consola de Logs en el Cliente

Hemos incluido logs detallados para ayudarte a depurar problemas de fechas:

```typescript
// Puedes usar este código en la consola del navegador
import { preserveLocalTime, extractLocalTime } from './utils/dateUtils';

// Crear una fecha local
const localDate = new Date(2025, 5, 8, 13, 0); // 13:00
console.log("Fecha local:", localDate.toLocaleString());

// Convertir a ISO
const isoDate = preserveLocalTime(localDate);
console.log("Fecha ISO:", isoDate);

// Volver a convertir a local
const extractedDate = extractLocalTime(isoDate);
console.log("Fecha extraída:", extractedDate.toLocaleString());
```

### 2. Script de Test de Conversión

El archivo `src/utils/dateTestBrowser.ts` contiene una función de prueba que puedes ejecutar para verificar si las conversiones de fecha están funcionando correctamente:

```typescript
import { testDateConversion } from '../utils/dateTestBrowser';
const result = testDateConversion();
console.log(result); // Debería mostrar {startMatches: true, endMatches: true}
```

### 3. Script de Corrección de Base de Datos

Si has identificado un problema persistente, puedes usar el script de corrección para ajustar las fechas en la base de datos:

```bash
cd server
npm run fix-timezone-display
```

## Cómo Verificar la Conversión de Fechas

1. **Verifica la fecha original**: Asegúrate de que la fecha que está ingresando el usuario es la correcta.
2. **Verifica la fecha ISO enviada al servidor**: Debería preservar la hora visual (ejemplo: 13:00 → "2025-06-08T13:00:00.000Z").
3. **Verifica la fecha almacenada en la BD**: Si hay diferencia, ejecuta el script de corrección.
4. **Verifica la fecha recuperada y mostrada en el calendario**: Debería coincidir con la hora original.

## Procedimiento de Ajuste Manual

Si necesitas ajustar manualmente las fechas en el frontend, puedes modificar la función `extractLocalTime` en `src/utils/dateUtils.ts`:

```typescript
export function extractLocalTime(isoString: string): Date {
  // Convertir la cadena ISO a un objeto Date
  const utcDate = new Date(isoString);
  
  // La implementación actual detecta automáticamente si se está en horario de verano
  // o invierno y aplica el offset correcto (2 o 1 hora respectivamente)
  
  // Si necesitas un offset fijo para pruebas, puedes comentar la detección automática
  // y usar un valor fijo:
  const hourOffset = 2; // Usar 2 para pruebas en verano, 1 para invierno
  
  // O mantener la detección automática (recomendado):
  // const now = new Date();
  // const jan = new Date(now.getFullYear(), 0, 1);
  // const jul = new Date(now.getFullYear(), 6, 1);
  // const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  // const isDST = utcDate.getTimezoneOffset() < stdTimezoneOffset;
  // const hourOffset = isDST ? 2 : 1;
  
  const localDate = new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours() + hourOffset,
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds()
  );
  
  return localDate;
}
```

Si necesitas ajustar fechas en la base de datos, la función `adjustTimeZoneOffset` en `server/scripts/correctTimeZoneDisplayError.js` ahora detecta automáticamente si estamos en horario de verano o invierno:

```javascript
function adjustTimeZoneOffset(isoString, manualHourOffset = null) {
  // La función ahora determina automáticamente el offset según la fecha
  // Puedes proporcionar un offset manual como segundo parámetro si necesitas forzar un valor
  const hourOffset = manualHourOffset !== null ? manualHourOffset : (isDST ? 2 : 1);
}
```

## Recordatorio Importante

- Las fechas ISO siempre están en UTC
- JavaScript convierte automáticamente a la zona horaria local al mostrar fechas
- La diferencia es +2 horas en España durante el verano (CEST, UTC+2) y +1 hora durante el invierno (CET, UTC+1)
- Nuestras funciones de utilidad detectan automáticamente el horario de verano/invierno y aplican el offset correcto
- Las funciones están diseñadas para preservar la "hora visual" a lo largo de todo el proceso

## Scripts de Validación

Hemos creado scripts específicos para validar la solución en diferentes escenarios:

- **Cliente**: `src/utils/timezoneValidator.ts` - Valida la solución en el frontend
- **Servidor**: `server/scripts/validateTimezoneSolution.js` - Valida la solución en el backend

Para ejecutar estos scripts:

```bash
# Validar en el cliente (desde una página)
import { validateTimezoneSolution } from '../utils/timezoneValidator';
validateTimezoneSolution();

# Validar en el servidor
cd server
node scripts/validateTimezoneSolution.js
```

Si continúas experimentando problemas, por favor ejecuta estos scripts de validación y registra los resultados para ayudar a diagnosticar el problema.
