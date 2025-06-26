import React from 'react';
import { useDSTTransition } from '../hooks/useDSTTransition';
import './DSTWarning.css';

interface DSTNotificationProps {
  showOnlyNearTransitions?: boolean;
}

/**
 * Componente que muestra notificaciones sobre próximos cambios de horario (DST)
 * 
 * Este componente se puede colocar en la página principal de la aplicación o en
 * la página de reservas para informar a los usuarios sobre próximos cambios de horario.
 */
const DSTNotification: React.FC<DSTNotificationProps> = ({ 
  showOnlyNearTransitions = false 
}) => {
  // Obtener información sobre próximos cambios de horario
  const dstInfo = useDSTTransition(10); // Mostrar información para los próximos 10 días
  
  // Si solo queremos mostrar transiciones cercanas y no hay ninguna
  if (showOnlyNearTransitions && !dstInfo.isNearTransition) {
    return null;
  }
  
  // Si no hay información disponible
  if (!dstInfo.transitionDate) {
    return null;
  }
  
  const transitionType = dstInfo.isSpringTransition 
    ? 'horario de verano (CET → CEST)' 
    : 'horario de invierno (CEST → CET)';
    
  const transitionEffect = dstInfo.isSpringTransition
    ? 'Los relojes se adelantarán 1 hora (de 2:00 AM a 3:00 AM)'
    : 'Los relojes se retrasarán 1 hora (de 3:00 AM a 2:00 AM)';
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };
  
  const daysText = dstInfo.daysUntil === 0 
    ? 'HOY' 
    : dstInfo.daysUntil === 1 
      ? 'MAÑANA' 
      : `en ${dstInfo.daysUntil} días`;
  
  // Determinar si estamos muy cerca de un cambio (crítico)
  const isCritical = dstInfo.isNearTransition && dstInfo.daysUntil <= 1;
  
  return (
    <div className={`dst-notification ${isCritical ? 'critical' : ''}`}>
      <div className="dst-icon">
        {isCritical ? '⚠️' : '🕒'}
      </div>
      <div className="dst-content">
        <h4>Cambio de horario próximo</h4>
        <p>
          El cambio al {transitionType} ocurrirá <strong>{daysText}</strong>,{' '}
          el <strong>{formatDate(dstInfo.transitionDate)}</strong>.
        </p>
        <p>
          {transitionEffect}
        </p>
        {dstInfo.isNearTransition && (
          <div className="dst-advice">
            <p>
              <strong>Recomendación:</strong> Si va a hacer reservas para este día,
              {dstInfo.isSpringTransition ? (
                ' evite el horario entre 2:00 AM y 3:00 AM ya que estas horas no existirán.'
              ) : (
                ' tenga en cuenta que el horario entre 2:00 AM y 3:00 AM se repetirá.'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DSTNotification;
