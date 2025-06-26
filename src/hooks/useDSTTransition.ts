import { useState, useEffect, useCallback } from 'react';
import { isNearDSTTransition, getNextDSTTransition } from '../utils/dstUtils';

/**
 * Hook personalizado para detectar y gestionar cambios de horario (DST)
 * 
 * Proporciona información sobre próximos cambios de horario y detecta
 * si la fecha actual está cerca de un cambio de horario.
 */
export function useDSTTransition(daysThreshold = 7) {
  // Estado para almacenar información de próximas transiciones
  const [dstInfo, setDstInfo] = useState({
    isNearTransition: false,
    transitionDate: null as Date | null,
    daysUntil: 0,
    isSpringTransition: false
  });
  
  // Función para actualizar la información DST
  const updateDSTInfo = useCallback(() => {
    const now = new Date();
    const transitionCheck = isNearDSTTransition(now, daysThreshold);
    
    // Si no hay transición cercana, calcular la próxima
    if (!transitionCheck.isNear) {
      const nextSpringTransition = getNextDSTTransition(now, false);
      const nextFallTransition = getNextDSTTransition(now, true);
      
      // Determinar cuál está más cerca
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysUntilSpring = Math.floor((nextSpringTransition.getTime() - now.getTime()) / msPerDay);
      const daysUntilFall = Math.floor((nextFallTransition.getTime() - now.getTime()) / msPerDay);
      
      const isSpringNext = daysUntilSpring < daysUntilFall;
      const nextTransition = isSpringNext ? nextSpringTransition : nextFallTransition;
      const daysUntil = isSpringNext ? daysUntilSpring : daysUntilFall;
      
      setDstInfo({
        isNearTransition: false,
        transitionDate: nextTransition,
        daysUntil,
        isSpringTransition: isSpringNext
      });
    } else {
      // Hay una transición cercana, usar la información del check
      setDstInfo({
        isNearTransition: true,
        transitionDate: transitionCheck.transitionDate || null,
        daysUntil: transitionCheck.daysUntil || 0,
        isSpringTransition: transitionCheck.isSpringTransition || false
      });
    }
  }, [daysThreshold]);
  
  // Actualizar al montar el componente
  useEffect(() => {
    updateDSTInfo();
    
    // Actualizar cada día a medianoche
    const intervalId = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        updateDSTInfo();
      }
    }, 60000); // Comprobar cada minuto
    
    return () => clearInterval(intervalId);
  }, [updateDSTInfo]);
  
  return dstInfo;
}
