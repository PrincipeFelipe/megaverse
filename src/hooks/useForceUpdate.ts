/**
 * Hook personalizado para forzar re-renders cuando el avatar cambie
 */
import { useState, useCallback } from 'react';

export const useForceUpdate = () => {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  return forceUpdate;
};

/**
 * Hook para detectar cambios específicos en el avatar del usuario
 */
export const useAvatarUpdate = (user: any) => {
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [lastAvatarUrl, setLastAvatarUrl] = useState(user?.avatar_url);
  
  // Detectar cambios en el avatar
  if (user?.avatar_url !== lastAvatarUrl) {
    setLastAvatarUrl(user?.avatar_url);
    setAvatarVersion(prev => prev + 1);
  }
  
  return {
    avatarVersion,
    forceAvatarUpdate: () => setAvatarVersion(prev => prev + 1)
  };
};
