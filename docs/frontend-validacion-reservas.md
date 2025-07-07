# Solución a reservas consecutivas - Frontend

## Problema
El sistema estaba permitiendo que un usuario viera el modal de creación de reserva incluso cuando intentaba seleccionar un horario que coincidía exactamente con el inicio o fin de otra reserva existente. Esto causaba confusión ya que luego la API rechazaba la reserva, pero solo después de que el usuario completara todo el formulario.

## Solución implementada

Se han realizado los siguientes cambios en el frontend para complementar las restricciones ya implementadas en el backend:

1. **Validación preventiva**: Ahora, antes de mostrar el modal de creación de reservas, el sistema verifica si el horario seleccionado coincide con el inicio o fin de otra reserva existente para la misma mesa.

2. **Verificación de horarios**: Se ha creado una función `checkForConsecutiveReservations()` que comprueba:
   - Si la hora de inicio seleccionada coincide con la hora de fin de una reserva existente
   - Si la hora de fin seleccionada coincide con la hora de inicio de una reserva existente
   - Si la hora de inicio o fin coincide exactamente con la hora de inicio o fin de otra reserva

3. **Mensajes claros**: Si se detecta una coincidencia, se muestra un mensaje de error específico que explica por qué no se puede realizar la reserva, sin llegar a mostrar el modal.

## Componentes modificados

- **Calendar7Days.tsx**: Se implementó la función de validación principal y se modificó el manejo de la selección de slots en el calendario.
- **TableSelectionPopover**: Se actualizó para que también realice la verificación de reservas consecutivas antes de permitir seleccionar una mesa.

## Cómo funciona la verificación

La verificación utiliza un método de comparación de horas formateadas como strings en formato "HH:MM" para evitar problemas con los milisegundos o diferencias mínimas en los timestamps:

```typescript
const formatTimeForComparison = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
```

Luego compara estas horas formateadas para detectar coincidencias exactas:

```typescript
if (
  selectedStartTime === reservationEndTime ||
  selectedEndTime === reservationStartTime ||
  selectedStartTime === reservationStartTime ||
  selectedEndTime === reservationEndTime
) {
  // Existe una coincidencia, no permitir la reserva
}
```

## Complemento con la validación del backend

Esta implementación en el frontend complementa las restricciones ya implementadas en el backend:

1. **Frontend**: Evita que el usuario siquiera intente crear una reserva en un horario inválido.
2. **Backend**: Garantiza que, incluso si por algún motivo se elude la validación del frontend, la reserva aún será rechazada correctamente.

Esta doble validación asegura una experiencia de usuario mucho más fluida y reduce la confusión al mostrar los mensajes de error antes de que el usuario complete todo el proceso de creación de reserva.
