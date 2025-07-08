# Tooltip con Motivo en Reservas Pendientes - Panel Admin

## Funcionalidad Implementada
Agregado tooltip en el panel de administración de reservas que muestra el motivo de la reserva cuando el usuario pasa el cursor sobre el badge "Pendiente" de reservas de día completo no aprobadas.

## Comportamiento
- **Tooltip visible**: Solo en reservas de día completo pendientes (no aprobadas) que tengan un motivo especificado
- **Tooltip oculto**: En reservas aprobadas, reservas sin motivo, o reservas regulares (no de día completo)
- **Activación**: Al pasar el mouse sobre el badge "Pendiente"
- **Contenido**: Muestra el motivo/razón de la reserva (`reservation.reason`)

## Implementación Técnica

### Componente Tooltip
```tsx
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};
```

### Lógica Condicional
```tsx
// Solo mostrar tooltip para reservas pendientes que tengan motivo
if (!isApproved && reservation.reason) {
  return (
    <Tooltip content={reservation.reason}>
      {badge}
    </Tooltip>
  );
}

return badge; // Sin tooltip para reservas aprobadas o sin motivo
```

## Estilos Aplicados
- **Cursor**: `cursor-help` solo en badges pendientes con tooltip
- **Posicionamiento**: Tooltip aparece arriba del badge centrado
- **Z-index**: `z-50` para aparecer sobre otros elementos
- **Responsive**: `max-w-xs` para limitar ancho en pantallas pequeñas
- **Tema**: Fondo oscuro con texto blanco, compatible con modo oscuro

## Casos de Uso
1. **Reserva día completo pendiente CON motivo**: ✅ Muestra tooltip al hover
2. **Reserva día completo pendiente SIN motivo**: ❌ No muestra tooltip
3. **Reserva día completo aprobada**: ❌ No muestra tooltip
4. **Reserva regular (no día completo)**: ❌ No muestra tooltip

## Beneficios
- **UX mejorada**: Los administradores pueden ver rápidamente por qué una reserva requiere aprobación
- **Información contextual**: Acceso inmediato al motivo sin necesidad de abrir detalles
- **Interfaz limpia**: El tooltip solo aparece cuando es relevante y útil
- **Accesibilidad**: Cursor help indica contenido interactivo

## Archivos Modificados
- `src/pages/admin/reservations/AdminReservationsPage.tsx`: 
  - Agregado componente Tooltip
  - Modificado renderizado de badge "Pendiente"
  - Corregido tipo de handleInputChange para compatibilidad

## Estado del Campo `reason`
- **Tipo**: `reason?: string` (opcional en interface Reservation)
- **Origen**: Campo que debe venir de la base de datos con el motivo de la reserva
- **Uso**: Solo se muestra si existe y la reserva está pendiente

## Testing Recomendado
1. Crear reserva de día completo con motivo → Verificar tooltip
2. Crear reserva de día completo sin motivo → Verificar ausencia de tooltip  
3. Aprobar reserva de día completo → Verificar que tooltip desaparece
4. Verificar comportamiento responsive en diferentes tamaños de pantalla
