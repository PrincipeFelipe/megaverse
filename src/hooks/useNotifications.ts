import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

// Extraemos el hook de notificaciones a un archivo separado para mejorar el Fast Refresh
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
