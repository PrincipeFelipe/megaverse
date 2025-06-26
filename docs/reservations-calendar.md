# Sistema de Reservas con Calendario por Mesa

Este documento describe la implementación del sistema de reservas con calendarios específicos para cada mesa.

## Visión General

El sistema de reservas ha sido actualizado para proporcionar una experiencia más intuitiva:

1. **Vista de Usuario**:
   - Un selector desplegable permite elegir una mesa específica
   - Se muestra un calendario exclusivo para la mesa seleccionada
   - El usuario puede ver solo las reservas relacionadas con la mesa elegida
   - Es posible realizar reservas directamente desde el calendario de la mesa

2. **Panel de Administración**:
   - Se mantiene un listado completo de todas las reservas
   - No se muestra el calendario en el panel administrativo
   - Los administradores pueden ver, editar, aprobar y eliminar reservas desde la lista

## Ventajas del Nuevo Enfoque

- **Mayor claridad**: Al mostrar un calendario por mesa, se reduce la sobrecarga visual y se facilita la comprensión de la disponibilidad.
- **Experiencia más enfocada**: Los usuarios pueden centrarse en la mesa que realmente les interesa.
- **Menor confusión**: Al seleccionar directamente una mesa antes de ver su calendario, se elimina la necesidad de seleccionar mesa después de elegir un horario.
- **Panel administrativo optimizado**: Los administradores tienen una vista tabular clara de todas las reservas sin la distracción del calendario.

## Componentes Principales

1. **Selector de Mesas**:
   ```jsx
   <select
     id="tableSelect"
     onChange={(e) => {
       const tableId = parseInt(e.target.value);
       const table = tables.find(t => t.id === tableId) || null;
       setSelectedTable(table);
     }}
     value={selectedTable?.id || ""}
   >
     <option value="">-- Selecciona una mesa --</option>
     {tables.map((table) => (
       <option key={table.id} value={table.id}>
         {table.name}
       </option>
     ))}
   </select>
   ```

2. **Calendario Específico para la Mesa**:
   ```jsx
   {selectedTable ? (
     <BigCalendar
       reservations={reservations.filter(res => res.table_id === selectedTable.id)}
       tables={[selectedTable]}
       onSelectSlot={handleSelectSlot}
       onCancelReservation={handleCancelReservation}
     />
   ) : (
     <div className="placeholderMessage">
       Selecciona una mesa para ver su calendario
     </div>
   )}
   ```

## Flujo de Usuario

1. El usuario accede a la página de reservas
2. Selecciona una mesa del desplegable
3. Se muestra información sobre la mesa seleccionada
4. Aparece el calendario específico para esa mesa
5. El usuario puede:
   - Ver las reservas existentes para esa mesa
   - Seleccionar un rango de tiempo para hacer una nueva reserva
   - Cancelar sus propias reservas

## Consideraciones Futuras

- Implementar un sistema de búsqueda y filtrado para mesas
- Añadir una vista de calendario mensual para planificar reservas a largo plazo
- Mostrar información de capacidad y características de cada mesa
- Implementar un sistema de recomendación para sugerir mesas disponibles
