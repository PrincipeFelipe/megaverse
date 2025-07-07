# Corrección de la validación de reservas consecutivas

## Problema

Se identificó un problema en la lógica de validación de reservas consecutivas. Cuando `allow_consecutive_reservations` está configurado como `true` (permitido), el sistema seguía aplicando incorrectamente la restricción de tiempo mínimo entre reservas (`min_time_between_reservations`) incluso para reservas consecutivas.

La lógica correcta debería ser:

1. Si `allow_consecutive_reservations` es `true`, entonces las reservas consecutivas deben permitirse independientemente del tiempo mínimo entre ellas.
2. Solo si las reservas no son consecutivas, entonces se debe verificar el tiempo mínimo entre reservas.

## Solución implementada

Se corrigió la lógica en el archivo `Calendar7Days.tsx` para que:

1. Si dos reservas son consecutivas (una termina exactamente cuando la otra comienza) y `allow_consecutive_reservations` es `true`, se permite la reserva sin verificar el tiempo mínimo entre reservas.
2. Si dos reservas no son consecutivas, o si `allow_consecutive_reservations` es `false`, se aplica la restricción de tiempo mínimo entre reservas.

## Implementación

En ambas funciones `checkForConsecutiveReservations` del archivo `Calendar7Days.tsx`, se modificó la lógica para que cuando se detecte que dos reservas son consecutivas y está permitido según la configuración (`allow_consecutive_reservations` es `true`), se omita la validación del tiempo mínimo entre reservas.

```typescript
// Si son consecutivas y están permitidas, no verificamos el tiempo mínimo entre reservas
if (isConsecutiveReservation && allowConsecutive) {
  console.log('Reservas consecutivas permitidas. Se omite verificación de tiempo mínimo.');
  continue; // Saltamos a la siguiente reserva sin verificar tiempo mínimo
}
```

Este cambio garantiza que las reservas consecutivas se permitan correctamente cuando la configuración del sistema lo permite.

## Pruebas

Para probar estos cambios:

1. Establezca `allow_consecutive_reservations = true` en la configuración
2. Intente hacer una reserva consecutiva (que termine exactamente cuando comienza otra o viceversa)
3. La reserva ahora debería permitirse correctamente sin ser bloqueada por la validación del tiempo mínimo

## Registros para diagnóstico

Se agregaron registros de consola adicionales para ayudar a diagnosticar problemas con la validación de reservas:

```typescript
console.log('Verificando reserva en mesa:', table.id, 'Inicio:', start, 'Fin:', end);
console.log('Configuración actual:', window.reservationConfig);
console.log('Resultado de la verificación:', { isConsecutive, notAllowedConsecutive, isTooClose, minutesBetween });
```

Estos registros ayudan a identificar problemas con la configuración de reservas o con la lógica de validación.
