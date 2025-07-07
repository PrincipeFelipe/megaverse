# Gestión de Reservas Consecutivas y Tiempo Mínimo Entre Reservas

## Problema resuelto

Se ha implementado una funcionalidad completa para gestionar dos escenarios en las reservas:

1. **Reservas consecutivas**: Configuración para permitir o no que un usuario pueda realizar reservas consecutivas (una termina exactamente cuando la otra empieza).
2. **Tiempo mínimo entre reservas**: En caso de no permitir reservas consecutivas o cuando no son consecutivas, se verifica que haya un tiempo mínimo entre ellas.

## Implementación

### Backend

Se ha modificado la tabla `reservation_config` añadiendo dos nuevos campos:

- `allow_consecutive_reservations` (TINYINT): Determina si se permiten reservas consecutivas (1) o no (0).
- `min_time_between_reservations` (INT): Tiempo mínimo en minutos que debe haber entre reservas.

El controlador `config.js` ha sido actualizado para soportar estos nuevos campos, permitiendo su actualización desde el panel de administración.

### Frontend - Panel de Administración

En el panel de administración se han añadido dos nuevos controles en la sección de configuración:

- **Permitir reservas consecutivas**: Checkbox para activar/desactivar la posibilidad de hacer reservas consecutivas.
- **Tiempo mínimo entre reservas (minutos)**: Campo numérico para establecer cuántos minutos deben pasar entre el final de una reserva y el inicio de otra.

### Frontend - Validación en Calendario

La función `checkForConsecutiveReservations` en el componente `Calendar7Days.tsx` ha sido mejorada para realizar dos validaciones:

1. **Validación de disponibilidad de mesa**: Verifica que la mesa esté disponible en el horario seleccionado.

2. **Validación de reservas del usuario**:
   - Verifica si el usuario ya tiene reservas para ese día
   - Comprueba si las nuevas reservas son consecutivas con las existentes
   - Si las reservas consecutivas no están permitidas, muestra un error
   - Si no son consecutivas o no están permitidas, verifica que haya suficiente tiempo entre ellas

## Cómo funciona

### Escenarios validados

1. **Reservas consecutivas permitidas**:
   - Un usuario puede hacer una reserva que termine exactamente cuando comienza otra
   - Un usuario puede hacer una reserva que comience exactamente cuando termina otra
   - No se verifica el tiempo mínimo en estos casos

2. **Reservas consecutivas NO permitidas**:
   - El sistema rechaza cualquier intento de hacer reservas consecutivas
   - Se muestra un mensaje claro explicando que las reservas consecutivas no están permitidas

3. **Tiempo mínimo entre reservas**:
   - Si las reservas no son consecutivas, se verifica que haya al menos X minutos entre ellas
   - Si no hay suficiente tiempo, se muestra un mensaje indicando cuántos minutos faltan

## Pruebas sugeridas

1. **Probar reservas consecutivas permitidas**:
   - Configurar `allow_consecutive_reservations = true`
   - Intentar reservar un horario que termine exactamente cuando comienza otra reserva
   - Verificar que la reserva se permite

2. **Probar reservas consecutivas NO permitidas**:
   - Configurar `allow_consecutive_reservations = false`
   - Intentar reservar un horario que termine exactamente cuando comienza otra reserva
   - Verificar que la reserva se rechaza con el mensaje adecuado

3. **Probar tiempo mínimo**:
   - Configurar `min_time_between_reservations = 30` (30 minutos)
   - Intentar reservar un horario que comience 15 minutos después de que termine otra reserva
   - Verificar que la reserva se rechaza con un mensaje sobre el tiempo mínimo

4. **Probar validación en diferentes mesas**:
   - Hacer una reserva en la Mesa 1
   - Intentar hacer una reserva consecutiva en la Mesa 2
   - Verificar que se aplican las mismas reglas de validación
