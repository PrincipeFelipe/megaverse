# Diagnóstico y Solución - Tooltip Reservas Pendientes

## Problema Reportado
El tooltip sobre la etiqueta "Pendiente" en el panel de administración de reservas muestra un símbolo "?" en lugar del contenido del campo `reason` de la tabla reservations.

## Diagnóstico Realizado

### 1. Verificación de Base de Datos ✅
```sql
DESCRIBE reservations;
```
**Resultado**: El campo `reason (varchar(255))` SÍ existe en la tabla reservations.

### 2. Verificación de Consulta Backend ✅
```javascript
SELECT r.*, u.name as user_name, t.name as table_name 
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN tables t ON r.table_id = t.id
```
**Resultado**: La consulta con `r.*` debería incluir todos los campos, incluyendo `reason`.

### 3. Posibles Causas del Problema
1. **Campo `reason` es NULL/vacío**: Si el campo está vacío, el tooltip no debería mostrarse
2. **Problema de serialización**: Los datos se pierden en el transporte frontend-backend
3. **Codificación de caracteres**: El símbolo "?" puede indicar problemas de encoding
4. **Lógica condicional**: El tooltip se muestra cuando no debería

## Cambios Implementados para Diagnóstico

### Backend - Logs de Debug
```javascript
// En getAllReservations controller
console.log('Debug - Reservations sample:', reservations.slice(0, 1).map(r => ({
  id: r.id,
  reason: r.reason,
  all_day: r.all_day,
  approved: r.approved,
  hasReason: r.reason !== null && r.reason !== undefined
})));
```

### Frontend - Logs de Debug
```javascript
// En renderizado de badge
console.log('Debug - Reservation data:', {
  id: reservation.id,
  reason: reservation.reason,
  isApproved: isApproved,
  allFields: Object.keys(reservation)
});

// En componente Tooltip
console.log('Tooltip - content:', content, 'type:', typeof content);
```

## Lógica Actual del Tooltip
```javascript
// Solo mostrar tooltip para reservas pendientes (no aprobadas) que tengan motivo
if (!isApproved && reservation.reason) {
  return (
    <Tooltip content={reservation.reason}>
      {badge}
    </Tooltip>
  );
}
```

## Pasos para Verificar

1. **Abrir consola del navegador** y ir al panel de administración de reservas
2. **Verificar logs del backend** en la terminal del servidor
3. **Verificar logs del frontend** en la consola del navegador
4. **Intentar crear una reserva de día completo** con motivo para probar

## Próximos Pasos

### Si el campo `reason` llega como NULL:
- Verificar que las reservas de día completo tengan un motivo al crearse
- Actualizar la lógica de creación de reservas para requerir motivo

### Si el campo `reason` llega correctamente:
- Verificar la codificación de caracteres en la respuesta HTTP
- Revisar la lógica del componente Tooltip

### Si hay problemas de codificación:
- Configurar charset UTF-8 en la base de datos
- Verificar headers HTTP de la respuesta

## Archivos Modificados
- `server/controllers/reservations.js`: Agregados logs de debug
- `src/pages/admin/reservations/AdminReservationsPage.tsx`: Agregados logs de debug en tooltip y renderizado

## Testing
1. Crear reserva de día completo con motivo específico
2. Verificar que aparece como "Pendiente" en admin
3. Hacer hover sobre la etiqueta
4. Verificar que el tooltip muestra el motivo correcto

## Notas
- Los logs de debug se pueden remover una vez identificado el problema
- El campo `reason` es opcional (`varchar(255)`) y puede ser NULL
- El tooltip solo debería aparecer si hay un motivo válido
