# Validación de tiempo mínimo entre reservas - Frontend

## Problema
El sistema necesita respetar la configuración del tiempo mínimo entre reservas definida en el panel de administración (`min_time_between_reservations`). Es necesario que, al intentar crear una reserva, se verifique si hay suficiente tiempo entre la reserva que se desea crear y otras reservas existentes para la misma mesa.

## Solución implementada

Se han realizado las siguientes mejoras para validar el tiempo mínimo entre reservas en el frontend:

1. **Validación preventiva ampliada**: Además de comprobar si las reservas son consecutivas, ahora también se valida que haya suficiente tiempo entre reservas según la configuración.

2. **Implementación de la verificación de tiempo**: Se ha extendido la función `checkForConsecutiveReservations()` para que también calcule:
   - El tiempo en minutos entre el fin de una reserva existente y el inicio de la nueva reserva
   - El tiempo en minutos entre el fin de la nueva reserva y el inicio de una reserva existente
   - Si este tiempo es menor que el configurado en `min_time_between_reservations`

3. **Mensajes claros y específicos**: Si no hay suficiente tiempo entre reservas, se muestra un mensaje de error que indica:
   - El tiempo mínimo requerido entre reservas (según configuración)
   - El tiempo actual entre las reservas en conflicto (en minutos)

## Componentes modificados

- **Calendar7Days.tsx**: Se amplió la función de validación `checkForConsecutiveReservations` para que también verifique el tiempo mínimo entre reservas.
- **TableSelectionPopover**: Se actualizó para que también muestre el mensaje de error adecuado cuando no hay suficiente tiempo entre reservas.

## Cómo funciona la verificación

La verificación utiliza cálculos de diferencia de tiempo en minutos entre reservas:

```typescript
// Caso 1: La reserva nueva comienza después de una existente
if (start >= resEnd) {
  minutesBetween = Math.floor((start.getTime() - resEnd.getTime()) / (1000 * 60));
  isTooClose = minutesBetween < minTimeBetweeenReservations;
}
// Caso 2: La reserva existente comienza después de la nueva
else if (end <= resStart) {
  minutesBetween = Math.floor((resStart.getTime() - end.getTime()) / (1000 * 60));
  isTooClose = minutesBetween < minTimeBetweeenReservations;
}
```

Si `isTooClose` es `true`, se muestra un mensaje de error específico:

```typescript
if (isTooClose) {
  showError(
    'Tiempo insuficiente entre reservas', 
    `Debe haber al menos ${minTimeBetween} minutos entre reservas en ${tableName}. Actualmente hay ${minutesBetween} minutos de diferencia.`
  );
}
```

## Configuración

La función utiliza los valores de configuración almacenados en el objeto global `window.reservationConfig`:

- `allow_consecutive_reservations`: Si es `false`, no se permiten reservas consecutivas
- `min_time_between_reservations`: Tiempo mínimo en minutos que debe haber entre reservas

Si estos valores no están definidos, se utilizan valores predeterminados (permitir reservas consecutivas y 0 minutos entre reservas).

## Complemento con la validación del backend

Esta implementación complementa la validación ya existente en el backend:

1. **Frontend**: Evita que el usuario intente crear una reserva sin respetar el tiempo mínimo entre reservas.
2. **Backend**: Garantiza que, incluso si se elude la validación del frontend, las reservas siguen respetando las reglas configuradas.

Esta doble validación asegura una experiencia de usuario fluida y reduce la confusión al mostrar los mensajes de error antes de que el usuario complete todo el proceso de creación de reserva.
