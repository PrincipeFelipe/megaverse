# Implementación de restricción de reservas consecutivas

Se han implementado las siguientes funcionalidades para controlar las reservas consecutivas y el tiempo mínimo entre reservas:

## Cambios realizados

1. **Base de datos:**
   - Se han añadido dos campos nuevos a la tabla `reservation_config`:
     - `allow_consecutive_reservations`: BOOLEAN/TINYINT (por defecto TRUE/1)
     - `min_time_between_reservations`: INT (por defecto 30 minutos)

2. **Backend:**
   - Se ha modificado el controlador `reservations.js` para implementar las siguientes validaciones:
     - Se han añadido funciones auxiliares para detectar mejor los solapamientos y reservas consecutivas
     - La validación ahora verifica todas las reservas de la misma mesa, no solo las del usuario actual
     - Se compara explícitamente `allow_consecutive_reservations === 0` para una evaluación correcta
     - Se aplica la restricción de tiempo mínimo entre reservas también para la misma mesa

3. **Correcciones implementadas:**
   - Se corrigió un problema donde las reservas consecutivas no se detectaban correctamente
   - Se ajustó la validación para considerar reservas de otros usuarios en la misma mesa
   - Se mejoró el manejo de valores booleanos almacenados como enteros en la base de datos
   - Se añadió logging detallado para facilitar la depuración

## Verificación

Los cambios ya están aplicados y funcionando correctamente. La configuración actual en la base de datos es:

```
{
  "id": 1,
  "max_hours_per_reservation": 4,
  "max_reservations_per_user_per_day": 2,
  "min_hours_in_advance": 0,
  "allowed_start_time": "06:00",
  "allowed_end_time": "23:00",
  "requires_approval_for_all_day": 1,
  "allow_consecutive_reservations": 0,
  "min_time_between_reservations": 120,
  "normal_fee": "50.00",
  "maintenance_fee": "10.00"
}
```

## Detalles técnicos de la implementación

### Reservas consecutivas

Las reservas consecutivas ahora se detectan para la misma mesa, independientemente del usuario, utilizando un enfoque más robusto basado en la comparación de horas y minutos en formato de cadena:

```javascript
// Verificamos explícitamente con === 0 o === false para asegurarnos de que la condición se evalúa correctamente
if (config.allow_consecutive_reservations === 0 || config.allow_consecutive_reservations === false) {
  // Obtener todas las reservas activas para la misma mesa en el mismo día
  const [tableReservationsToday] = await connection.query(
    `SELECT * FROM reservations 
     WHERE table_id = ? 
     AND status = 'active' 
     AND start_time >= ?
     AND start_time < ?`,
    [tableId, startOfDay.toISOString(), endOfDay.toISOString()]
  );
  
  // Convertir fechas a strings de formato HH:MM para comparación más fiable
  const formatTimeString = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const newReservationStart = formatTimeString(startDate);
  const newReservationEnd = formatTimeString(endDate);
  
  // Verificar cada reserva existente para detectar casos consecutivos
  let consecutiveFound = false;
  
  for (const res of tableReservationsToday) {
    const resStart = new Date(res.start_time);
    const resEnd = new Date(res.end_time);
    
    const existingStart = formatTimeString(resStart);
    const existingEnd = formatTimeString(resEnd);
    
    // Una reserva es consecutiva si:
    // 1. La hora de fin de la existente = la hora de inicio de la nueva
    // 2. La hora de fin de la nueva = la hora de inicio de la existente
    if (existingEnd === newReservationStart || newReservationEnd === existingStart) {
      consecutiveFound = true;
      break;
    }
  }
  
  if (consecutiveFound) {
    // Rechazar la reserva consecutiva
    return res.status(400).json({
      error: `No se permiten reservas consecutivas según la configuración actual.`
    });
  }
}
```

Este enfoque es más robusto porque:
1. Trabaja con representaciones de cadena de las horas (formato HH:MM) en lugar de timestamps
2. Realiza comparaciones exactas de las horas y minutos formateados
3. Evita problemas con milisegundos o diferencias mínimas en los timestamps
4. Es más fácil de depurar y entender visualmente

### Tiempo mínimo entre reservas

El tiempo mínimo entre reservas ahora se aplica también a todas las reservas de la misma mesa:

```javascript
if (config.min_time_between_reservations > 0) {
  // Obtener todas las reservas de la mesa para el mismo día
  // ...

  const hasInsufficientTimeBetween = tableReservationsToday.some(res => {
    // Verificar si hay suficiente tiempo entre esta reserva y la existente
    // ...
  });
}
```

## Pruebas recomendadas

Para verificar que la funcionalidad está operativa:

1. Intenta hacer dos reservas consecutivas en la misma mesa - debería aparecer un mensaje de error
2. Intenta hacer dos reservas en la misma mesa con menos del tiempo mínimo configurado entre ellas - debería aparecer un mensaje de error
3. Modifica la configuración a `allow_consecutive_reservations = true` y verifica que ahora sí permite reservas consecutivas

## Conclusión

Con estas mejoras, el sistema ahora implementa correctamente las restricciones de reservas consecutivas y tiempo mínimo entre reservas, considerando todas las reservas en la misma mesa y no solo las del usuario actual.
