/**
 * Componente para mostrar advertencias relacionadas con zonas horarias
 * durante reservas en fechas críticas (cerca de cambios de hora)
 */

import React from 'react';
import { isNearDSTTransition, checkDSTIssue } from '../utils/dstUtils';

interface DSTWarningProps {
  selectedDate: Date;
  startHour?: number;
  endHour?: number;
}

/**
 * Componente que muestra advertencias cuando una reserva está cerca de un cambio de horario
 */
const DSTWarning: React.FC<DSTWarningProps> = ({ selectedDate, startHour, endHour }) => {
  // Verificar si la fecha está cerca de una transición
  const nearTransition = isNearDSTTransition(selectedDate, 3);
  
  // Si no está cerca, no mostrar nada
  if (!nearTransition.isNear) return null;
  
  // Crear fechas de inicio y fin si se proporcionaron las horas
  const startDate = startHour !== undefined ? new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    startHour
  ) : null;
  
  const endDate = endHour !== undefined ? new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    endHour
  ) : null;
  
  // Verificar problemas específicos con las horas seleccionadas
  let hasHourIssue = false;
  let hourIssueMessage = '';
  
  if (startDate) {
    const startIssue = checkDSTIssue(startDate);
    if (startIssue.hasPotentialIssue) {
      hasHourIssue = true;
      hourIssueMessage = `La hora de inicio seleccionada (${startHour}:00) ${startIssue.message}`;
    }
  }
  
  if (endDate && !hasHourIssue) {
    const endIssue = checkDSTIssue(endDate);
    if (endIssue.hasPotentialIssue) {
      hasHourIssue = true;
      hourIssueMessage = `La hora de fin seleccionada (${endHour}:00) ${endIssue.message}`;
    }
  }
  
  // Mensaje general sobre el cambio de horario
  const transitionType = nearTransition.isSpringTransition 
    ? 'horario de verano (CET → CEST)' 
    : 'horario de invierno (CEST → CET)';
  
  const daysText = nearTransition.daysUntil === 0 
    ? 'HOY' 
    : nearTransition.daysUntil === 1 
      ? 'MAÑANA' 
      : `en ${nearTransition.daysUntil} días`;
  
  return (
    <div className="dst-warning">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <h4>Aviso importante de cambio de horario</h4>
        <p>
          El cambio al {transitionType} ocurrirá {daysText} 
          ({nearTransition.transitionDate?.toLocaleDateString()}).
        </p>
        
        {hasHourIssue && (
          <p className="hour-issue">
            <strong>Atención:</strong> {hourIssueMessage}. 
            Le recomendamos elegir otro horario para evitar inconvenientes.
          </p>
        )}
        
        {nearTransition.isSpringTransition ? (
          <p>
            Los relojes se adelantarán una hora. El día tendrá 23 horas y las horas entre 2:00 y 3:00 no existirán.
          </p>
        ) : (
          <p>
            Los relojes se retrasarán una hora. El día tendrá 25 horas y las horas entre 2:00 y 3:00 se repetirán.
          </p>
        )}
      </div>
    </div>
  );
};

export default DSTWarning;
