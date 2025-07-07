# Validación de reservas consecutivas en Frontend

## Problema
El sistema necesita validar si están permitidas las reservas consecutivas según la configuración del panel de administración (`allow_consecutive_reservations`). Cuando no están permitidas, se debe mostrar un mensaje claro al usuario.

## Solución implementada

Se han realizado las siguientes mejoras en el frontend para validar las reservas consecutivas:

1. **Verificación de configuración**: Se verifica el valor de `window.reservationConfig.allow_consecutive_reservations` para determinar si las reservas consecutivas están permitidas según la configuración del panel de administración.

2. **Detección específica**: Se ha modificado la función `checkForConsecutiveReservations` para diferenciar entre:
   - Reservas que coinciden exactamente (mismo inicio o mismo fin)
   - Reservas consecutivas (fin de una = inicio de otra)

3. **Respuesta diferenciada**: Se ha implementado una respuesta diferente dependiendo del tipo de conflicto:
   - Si las reservas son consecutivas y no están permitidas según la configuración, se muestra un mensaje específico
   - Si las reservas coinciden exactamente (mismo horario), se muestra un mensaje de error por superposición

4. **Mensajes específicos**: Se han creado mensajes de error más específicos para cada situación:
   ```
   "Reservas consecutivas no permitidas. No se permiten reservas consecutivas según la configuración actual del sistema."
   ```

## Componentes modificados

- **Calendar7Days.tsx**: Se ha modificado la función `checkForConsecutiveReservations` para detectar específicamente las reservas consecutivas y verificar si están permitidas.
- **TableSelectionPopover**: Se ha actualizado para mostrar el mensaje de error adecuado cuando las reservas consecutivas no están permitidas.

## Cómo funciona la verificación

La verificación ahora distingue entre tipos de conflictos:

```typescript
// Comprobar si el inicio o fin coincide con fin o inicio de alguna reserva existente (consecutivas)
const isConsecutiveReservation = 
  selectedStartTime === reservationEndTime ||
  selectedEndTime === reservationStartTime;

// Si son consecutivas y no está permitido, retornar error específico
if (isConsecutiveReservation && !allowConsecutive) {
  return { 
    isConsecutive: true, 
    existingReservation: reservation,
    notAllowedConsecutive: true 
  };
}

// Comprobar si coincide exactamente (mismo inicio o mismo fin)
if (
  selectedStartTime === reservationStartTime ||
  selectedEndTime === reservationEndTime
) {
  return { isConsecutive: true, existingReservation: reservation };
}
```

## Complemento con la validación del backend

Esta implementación en el frontend complementa las restricciones ya implementadas en el backend:

1. **Frontend**: Evita que el usuario intente crear una reserva consecutiva cuando no está permitido.
2. **Backend**: Garantiza que, incluso si se elude la validación del frontend, la reserva aún será rechazada si las consecutivas no están permitidas.

Esta implementación mejora la experiencia del usuario mostrando mensajes claros y específicos dependiendo del tipo de conflicto y la configuración actual del sistema.
