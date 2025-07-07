# Recuperación de la validación de reservas consecutivas

## Problema

Durante algunas operaciones de git, se perdió la funcionalidad de validación de reservas consecutivas y tiempo mínimo entre reservas en el componente `Calendar7Days.tsx`. Esta funcionalidad es esencial para garantizar que:

1. Las reservas consecutivas se permitan solo si `allow_consecutive_reservations` está habilitado en la configuración.
2. El tiempo mínimo entre reservas no consecutivas (`min_time_between_reservations`) se respete correctamente.

## Solución implementada

Se recuperó la funcionalidad añadiendo lo siguiente:

1. **Actualización del tipo ReservationConfig**:
   - Se añadieron los campos `allow_consecutive_reservations` y `min_time_between_reservations` al tipo `ReservationConfig` en `src/types/configuration.ts`.

2. **Recuperación de la función `checkForConsecutiveReservations`**:
   - Se reimplementó la función que valida si hay conflictos de reserva según la configuración actual.
   - Se añadió la lógica para detectar reservas consecutivas y aplicar las reglas correctamente.

3. **Uso de la validación**:
   - Se integró la validación en el momento de seleccionar una mesa en `TableSelectionPopover`.
   - Se actualizó `handleDateSelect` para aplicar la validación cuando solo hay una mesa disponible.

4. **Mejoras en los mensajes de error**:
   - Se implementaron mensajes claros para cada tipo de conflicto (superposición, reservas consecutivas no permitidas, tiempo insuficiente entre reservas).

## Lógica de validación

La función `checkForConsecutiveReservations` ahora aplica la siguiente lógica:

1. **Superposición**: No permite reservas que se solapen con otras existentes.
2. **Reservas consecutivas**:
   - Si `allow_consecutive_reservations` es `true`, permite reservas consecutivas sin verificar el tiempo mínimo entre ellas.
   - Si `allow_consecutive_reservations` es `false`, no permite reservas consecutivas.
3. **Tiempo mínimo entre reservas**:
   - Para reservas no consecutivas, verifica que haya al menos `min_time_between_reservations` minutos entre el fin de una reserva y el inicio de otra.

## Mejoras adicionales

Se agregaron registros de depuración (console.log) para facilitar la identificación de problemas en el futuro, mostrando:
- La configuración actual de reservas
- Los tiempos de inicio y fin de las reservas en conflicto
- Los minutos entre reservas cuando hay conflictos de tiempo mínimo

## Pruebas recomendadas

Para verificar que la funcionalidad está correctamente implementada:

1. **Escenario 1**: Con `allow_consecutive_reservations = true`:
   - Debería permitir hacer reservas consecutivas (una termina cuando otra comienza).
   - Debería seguir aplicando la restricción de tiempo mínimo para reservas no consecutivas.

2. **Escenario 2**: Con `allow_consecutive_reservations = false`:
   - No debería permitir reservas consecutivas, mostrando el mensaje de error correspondiente.
   - Debería seguir aplicando la restricción de tiempo mínimo para todas las reservas.

3. **Escenario 3**: Verificar tiempo mínimo:
   - Con `min_time_between_reservations = 30`, debería requerir al menos 30 minutos entre reservas.
   - Debería mostrar el mensaje de error indicando cuántos minutos faltan para cumplir el requisito.
