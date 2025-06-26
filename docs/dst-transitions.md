# Guía de manejo de zonas horarias

## Información general

El sistema de reservas está configurado para funcionar en España, que utiliza dos husos horarios a lo largo del año:
- **CET (Central European Time)**: UTC+1, usado durante el invierno
- **CEST (Central European Summer Time)**: UTC+2, usado durante el verano

## Fechas críticas de cambio de horario

En Europa, el cambio de horario sigue estas reglas:
- **Inicio del horario de verano (CET → CEST)**: Último domingo de marzo, las 1:00 UTC se convierten en las 3:00 CEST
- **Fin del horario de verano (CEST → CET)**: Último domingo de octubre, las 1:00 UTC se convierten en las 2:00 CET

### Próximas fechas de cambio

| Año | Inicio horario de verano | Fin horario de verano |
|-----|--------------------------|------------------------|
| 2025 | 30 de marzo | 26 de octubre |
| 2026 | 29 de marzo | 25 de octubre |
| 2027 | 28 de marzo | 31 de octubre |

## Comportamiento del sistema durante los cambios

Durante estas transiciones pueden producirse comportamientos especiales:

### Inicio del horario de verano (primavera)
- El día tiene 23 horas
- No existen las horas entre 2:00 y 3:00 (se salta de 1:59 a 3:00)
- Las reservas programadas en ese intervalo "inexistente" podrían tener problemas

### Fin del horario de verano (otoño)
- El día tiene 25 horas
- La hora entre 2:00 y 3:00 se repite dos veces
- Las reservas durante esta "hora repetida" podrían solaparse o mostrar comportamientos inesperados

## Herramientas de diagnóstico

El sistema cuenta con varias herramientas para solucionar problemas relacionados con zonas horarias:

1. **Scripts de validación**:
   - `npm run validate-timezone` en el servidor para verificar el comportamiento en diferentes escenarios
   - `hourVisualizationTest.ts` y `timezoneValidator.ts` en el cliente

2. **Monitor de transiciones DST**:
   - `node scripts/dstTransitionMonitor.js` para verificar reservas en fechas críticas de cambio
   - Puede ejecutarse con un año específico: `node scripts/dstTransitionMonitor.js 2026`

3. **Herramientas de corrección**:
   - `npm run fix-timezone-display` para corregir problemas de visualización
   - `npm run fix-reservations` para corregir problemas en datos almacenados

## Procedimiento recomendado antes de cambios de horario

1. Una semana antes del cambio:
   - Ejecutar `node scripts/dstTransitionMonitor.js` para identificar reservas en fechas críticas
   - Revisar manualmente las reservas que caen en horas problemáticas
   - Notificar a los usuarios afectados sobre posibles cambios en sus reservas

2. Después del cambio:
   - Verificar que todas las reservas se muestren correctamente
   - Ejecutar `npm run validate-timezone` para confirmar que todo funciona según lo esperado
   - Solucionar cualquier problema detectado con los scripts de corrección

## Comportamiento de las funciones principales

### `extractLocalTime(isoString)`

Esta función determina automáticamente si debe aplicar un offset de +1 hora (CET, invierno) o +2 horas (CEST, verano) en función del momento del año.

```typescript
// Determinar el offset según la época del año
const isDST = utcDate.getTimezoneOffset() < stdTimezoneOffset;
const hourOffset = isDST ? 2 : 1;
```

### `preserveLocalTime(date)`

Esta función asegura que al convertir una fecha local a formato ISO para almacenarla en la base de datos, se preserve la misma hora visual que el usuario seleccionó.

```typescript
const date = new Date(Date.UTC(
  localDate.getFullYear(),
  localDate.getMonth(),
  localDate.getDate(),
  localDate.getHours(),
  localDate.getMinutes(),
  localDate.getSeconds()
));
```
